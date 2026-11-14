#!/usr/bin/env node
/**
 * Orquestador del flujo completo.
 *
 *   node scripts/video.mjs nuevo   <slug>          crea videos/<slug>/guion.json desde la plantilla
 *   node scripts/video.mjs voz     <slug> [args]   voz + tiempos por palabra + manifest (Python)
 *   node scripts/video.mjs stills  <slug>          fotogramas clave para QA en out/<slug>/stills
 *   node scripts/video.mjs render  <slug>          MP4 final en out/<slug>.mp4
 *   node scripts/video.mjs todo    <slug> [args]   voz -> stills -> render (+ masterización + portada)
 *   node scripts/video.mjs musica  <nombre> [--estilo historia|cuerpo|tecnico] [--prompt "..."]
 *   node scripts/video.mjs portada <slug>          out/<slug>/portada.png
 *   node scripts/video.mjs qa      <slug>          revisión automática de solapes en todo el video
 *
 * (Los mismos comandos existen como `npm run <cmd> -- <slug>`.)
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { registrar } from "./registrar.mjs";
import { validar } from "./validar.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [cmd, slug, ...rest] = process.argv.slice(2);

const die = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

const python = () => {
  const win = path.join(ROOT, ".venv", "Scripts", "python.exe");
  const nix = path.join(ROOT, ".venv", "bin", "python");
  if (existsSync(win)) return win;
  if (existsSync(nix)) return nix;
  die("No encuentro .venv. Ejecuta: npm run setup");
};

const runPy = (script, args) => {
  const r = spawnSync(python(), [path.join(ROOT, "pipeline", script), ...args], {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
  });
  if (r.status !== 0) die(`${script} falló`);
};

const manifestOf = (s) => {
  const p = path.join(ROOT, "public", "videos", s, "manifest.json");
  if (!existsSync(p)) die(`Falta ${p}. Ejecuta primero: npm run voz -- ${s}`);
  return JSON.parse(readFileSync(p, "utf-8"));
};

/** Valida el guion: errores detienen, avisos se muestran. */
const validarOMorir = (s) => {
  registrar();
  const { errores, avisos } = validar(s);
  avisos.forEach((a) => console.warn(`  ⚠ ${a}`));
  if (errores.length) die(`El guion de ${s} tiene errores:\n  ✖ ${errores.join("\n  ✖ ")}`);
};

let bundled = null;
const getBundle = async () => {
  if (bundled) return bundled;
  registrar();
  const { bundle } = await import("@remotion/bundler");
  console.log("▶ empaquetando proyecto Remotion…");
  bundled = await bundle({
    entryPoint: path.join(ROOT, "src", "index.ts"),
    publicDir: path.join(ROOT, "public"),
    rspack: true,
  });
  return bundled;
};

const getComp = async (s) => {
  const { selectComposition } = await import("@remotion/renderer");
  const serveUrl = await getBundle();
  const inputProps = { slug: s, subtitulos: true };
  const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });
  return { serveUrl, composition, inputProps };
};

/** Frames clave: por escena, cuando la voz va a la mitad y justo antes de salir. */
const keyFrames = (m) => {
  const T = m.transitionFrames;
  const frames = [];
  let t = 0;
  m.escenas.forEach((s, i) => {
    frames.push({ name: `${String(i + 1).padStart(2, "0")}-${s.id}-a`, frame: t + s.audioStartFrame + Math.round(s.audioFrames * 0.35) });
    frames.push({ name: `${String(i + 1).padStart(2, "0")}-${s.id}-b`, frame: t + s.durationInFrames - (i < m.escenas.length - 1 ? T + 6 : 2) });
    t += s.durationInFrames - (i < m.escenas.length - 1 && s.transicion !== "corte" ? T : 0);
  });
  return frames;
};

/** Recoge avisos del navegador ([cue] …) sin repetirlos. */
const avisos = new Set();
const onBrowserLog = (log) => {
  if (log.text.includes("[cue]") && !avisos.has(log.text)) {
    avisos.add(log.text);
    console.warn(`  ⚠ ${log.text}`);
  }
};

const stills = async (s) => {
  const { renderStill } = await import("@remotion/renderer");
  const m = manifestOf(s);
  const { serveUrl, composition, inputProps } = await getComp(s);
  const dir = path.join(ROOT, "out", s, "stills");
  rmSync(dir, { recursive: true, force: true }); // sin fotogramas viejos de versiones anteriores
  mkdirSync(dir, { recursive: true });
  for (const k of keyFrames(m)) {
    const frame = Math.min(composition.durationInFrames - 1, Math.max(0, k.frame));
    const output = path.join(dir, `${k.name}.png`);
    await renderStill({ serveUrl, composition, inputProps, frame, output, imageFormat: "png", onBrowserLog });
    console.log(`  ✓ ${path.relative(ROOT, output)} (frame ${frame})`);
  }
  runPy("hoja.py", [dir, path.join(ROOT, "out", s, "hoja.png")]);
  if (avisos.size) console.warn(`  ⚠ ${avisos.size} aviso(s) de cues: revisa que esas palabras estén en la narración.`);
};

const render = async (s) => {
  const { renderMedia } = await import("@remotion/renderer");
  manifestOf(s);
  const { serveUrl, composition, inputProps } = await getComp(s);
  const outputLocation = path.join(ROOT, "out", `${s}.mp4`);
  mkdirSync(path.dirname(outputLocation), { recursive: true });
  const t0 = Date.now();
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    outputLocation,
    codec: "h264",
    crf: 18, // alta calidad (menor = mejor; 17-18 es visualmente sin pérdidas)
    x264Preset: "slow",
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    imageFormat: "jpeg",
    jpegQuality: 95,
    audioCodec: "aac",
    audioBitrate: "320k",
    concurrency: Math.max(2, Math.floor(os.cpus().length * 0.6)),
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct % 10 === 0 && pct !== last) {
        last = pct;
        console.log(`  render ${pct}%`);
      }
    },
  });
  console.log(`✔ ${path.relative(ROOT, outputLocation)} · ${composition.durationInFrames} frames · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  runPy("masterizar.py", [outputLocation]);
  await portada(s);
  descripcion(s);
};

/** Texto listo para pegar en la descripción del Reel: gancho + fuentes + aviso de IA. */
const descripcion = (s) => {
  const g = JSON.parse(readFileSync(path.join(ROOT, "videos", s, "guion.json"), "utf-8"));
  const fuentes = (g.fuentes ?? []).filter(Boolean);
  const lineas = [
    g.portada?.titulo ?? g.titulo ?? s,
    "",
    g.descripcion ?? "",
    fuentes.length ? "Fuentes:" : "",
    ...fuentes.map((f) => `• ${f}`),
    "",
    "Voz y animaciones hechas con IA.",
    g.estilo === "cuerpo" ? "Información, no diagnóstico." : "",
  ].filter((l, i, a) => !(l === "" && a[i - 1] === ""));
  const out = path.join(ROOT, "out", s, "descripcion.txt");
  writeFileSync(out, lineas.join("\n").trim() + "\n");
  console.log(`✔ descripción: ${path.relative(ROOT, out)}`);
};

/** Portada del Reel: cuadro del gancho (1,2 s o el frame indicado en guion.portada). */
const portada = async (s) => {
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const serveUrl = await getBundle();
  const guion = JSON.parse(readFileSync(path.join(ROOT, "videos", s, "guion.json"), "utf-8"));
  const inputProps = { slug: s, subtitulos: false, portada: guion.portada?.titulo ?? null };
  const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });
  const frame = Math.min(composition.durationInFrames - 1, guion.portada?.frame ?? 36);
  const output = path.join(ROOT, "out", s, "portada.png");
  mkdirSync(path.dirname(output), { recursive: true });
  await renderStill({ serveUrl, composition, inputProps, frame, output, imageFormat: "png" });
  console.log(`✔ portada: ${path.relative(ROOT, output)} (frame ${frame}, sin subtítulos)`);
};

/** Crea videos/<slug>/guion.json + src/visuals/<slug>/ (escenas base) y los registra. */
/**
 * Revisión automática de composición: renderiza el video completo a baja
 * resolución con el revisor de solapes activo (src/qa/RevisorSolapes.tsx) y
 * agrupa los avisos por escena. Devuelve el número de problemas distintos.
 */
const qa = async (s) => {
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const m = manifestOf(s);
  const serveUrl = await getBundle();
  const inputProps = { slug: s, subtitulos: true, qa: true };
  const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });
  const starts = [];
  let t = 0;
  m.escenas.forEach((e, i) => {
    starts.push(t);
    t += e.durationInFrames - (i < m.escenas.length - 1 && e.transicion !== "corte" ? m.transitionFrames : 0);
  });
  // Cuadros de transición (zoom/fundido): la escena se escala o se funde a propósito; no se evalúan.
  const enTransicion = (f) =>
    starts.some((st, i) => i > 0 && m.escenas[i - 1].transicion !== "corte" && f >= st && f < st + m.transitionFrames);
  const escenaDe = (f) => {
    let k = 0;
    starts.forEach((st, i) => {
      if (f >= st) k = i;
    });
    return `${String(k + 1).padStart(2, "0")}-${m.escenas[k].id}`;
  };
  const hallazgos = new Map();
  const tmp = path.join(os.tmpdir(), `qa-${s}-${Date.now()}.mp4`);
  console.log("▶ QA de composición (revisando cada cuadro)…");
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    outputLocation: tmp,
    codec: "h264",
    scale: 0.25,
    muted: true,
    imageFormat: "jpeg",
    jpegQuality: 40,
    concurrency: Math.max(2, Math.floor(os.cpus().length * 0.6)),
    onBrowserLog: (log) => {
      const mm = /^\[(qa|cue)\] (?:f=(\d+) )?(.*)$/.exec(log.text);
      if (!mm) return;
      const f = Number(mm[2] ?? 0);
      if (mm[1] === "qa" && enTransicion(f)) return;
      const clave = `${mm[1] === "qa" ? escenaDe(f) : "cues"} · ${mm[3]}`;
      const h = hallazgos.get(clave) ?? { desde: f, hasta: f, n: 0 };
      h.desde = Math.min(h.desde, f);
      h.hasta = Math.max(h.hasta, f);
      h.n++;
      hallazgos.set(clave, h);
    },
  });
  try {
    rmSync(tmp, { force: true });
  } catch {
    /* Windows puede tener el archivo bloqueado un momento; es temporal */
  }
  // Ignora roces de 1–2 cuadros (entradas/salidas animadas).
  const reales = [...hallazgos.entries()].filter(([, h]) => h.n >= 3);
  if (!reales.length) {
    console.log("✔ QA: sin solapes ni elementos fuera de pantalla.");
    return 0;
  }
  console.warn(`⚠ QA: ${reales.length} problema(s) de composición:`);
  for (const [clave, h] of reales.sort()) {
    console.warn(`  ⚠ ${clave}  (${(h.desde / 30).toFixed(1)}–${(h.hasta / 30).toFixed(1)} s, ${h.n} cuadros)`);
  }
  return reales.length;
};

const nuevo = (s) => {
  if (!/^[a-z0-9-]+$/.test(s)) die("El slug solo puede tener minúsculas, números y guiones (ej. por-que-suenan-tripas)");
  const i = rest.indexOf("--estilo");
  const estilo = i >= 0 ? rest[i + 1] : (rest.find((a) => a.startsWith("--estilo=")) ?? "--estilo=cuerpo").split("=")[1];
  if (!["tecnico", "cuerpo", "historia"].includes(estilo)) die("--estilo debe ser tecnico, cuerpo o historia");
  const dir = path.join(ROOT, "videos", s);
  const vis = path.join(ROOT, "src", "visuals", s);
  if (existsSync(dir) || existsSync(vis)) die(`Ya existe videos/${s} o src/visuals/${s}`);
  mkdirSync(dir, { recursive: true });
  mkdirSync(vis, { recursive: true });
  const guion = readFileSync(path.join(ROOT, "videos", "_plantilla", "guion.json"), "utf-8")
    .replaceAll("<tema>", s)
    .replace('"estilo": "cuerpo"', `"estilo": "${estilo}"`)
    // Música de fondo genérica del registro (sin GPU). Con GPU: npm run musica -- <slug> --para <slug>
    .replace('"musica": null', `"musica": { "src": "musica/fondo-${estilo}.mp3", "volumen": 0.5 }`);
  writeFileSync(path.join(dir, "guion.json"), guion);
  writeFileSync(path.join(dir, "notas.md"), `# ${s}

## Datos y fuentes
- 

## Storyboard (frase → qué se ve → palabra que lo dispara)
- 
`);
  const plantilla = readFileSync(path.join(ROOT, "scripts", "plantilla-escenas.tsx.txt"), "utf-8")
    .replaceAll("__SLUG__", s)
    .replaceAll("__ESTILO__", estilo)
    .replaceAll("__CUE1__", "clave");
  writeFileSync(path.join(vis, "scenes.tsx"), plantilla);
  writeFileSync(
    path.join(vis, "index.ts"),
    `/** Escenas del video "${s}". */
import { Cierre, Detalle, Gancho, Mecanismo } from "./scenes";

export const visuales = {
  gancho: Gancho,
  mecanismo: Mecanismo,
  detalle: Detalle,
  cierre: Cierre,
};
`,
  );
  registrar();
  console.log(`✔ videos/${s}/guion.json y src/visuals/${s}/ creados (registro ${estilo}).`);
  console.log(`  Siguiente: escribe el guion, ilustra las escenas y ejecuta  npm run video -- ${s}`);
};

const main = async () => {
  if (!cmd || cmd === "help") {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf-8").split("*/")[0]);
    return;
  }
  if (cmd === "voces") return runPy("voz.py", ["--voces"]);
  if (cmd === "musica") {
    const ace = path.join(ROOT, "tools", "ACE-Step-1.5", ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
    if (!existsSync(ace)) die("Falta ACE-Step: ver README > Música (tools/ACE-Step-1.5, `uv sync`).");
    const r = spawnSync(ace, [path.join(ROOT, "pipeline", "musica.py"), slug, ...rest].filter(Boolean), {
      stdio: "inherit",
      cwd: ROOT,
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1", TORCHDYNAMO_DISABLE: "1" },
    });
    if (r.status !== 0) die("musica.py falló");
    return;
  }
  if (cmd === "sfx") return runPy("sfx.py", []);
  if (cmd === "muestras") return runPy("muestras.py", [slug, ...rest].filter(Boolean));
  if (!slug) die("Falta el slug del video");
  if (cmd === "nuevo") return nuevo(slug);
  if (cmd === "voz") return runPy("voz.py", [slug, ...rest]);
  if (["stills", "render", "qa", "todo"].includes(cmd)) validarOMorir(slug);
  if (cmd === "stills") return stills(slug);
  if (cmd === "render") return render(slug);
  if (cmd === "portada") return portada(slug);
  if (cmd === "qa") {
    const n = await qa(slug);
    if (n) process.exitCode = 1;
    return;
  }
  if (cmd === "todo") {
    runPy("voz.py", [slug, ...rest.filter((a) => a !== "--forzar")]);
    await stills(slug);
    const n = await qa(slug);
    if (n && !rest.includes("--forzar")) {
      die(`QA encontró ${n} problema(s): corrígelos y vuelve a ejecutar (o usa --forzar para renderizar igual).`);
    }
    await render(slug);
    return;
  }
  die(`Comando desconocido: ${cmd}`);
};

main().catch((e) => die(e.stack || e.message));
