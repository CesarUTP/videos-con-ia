#!/usr/bin/env node
/**
 * Valida guiones ANTES de gastar tiempo en voz/render.
 *   node scripts/validar.mjs            # todos los videos
 *   node scripts/validar.mjs <slug>     # uno
 * Errores (✖) detienen el flujo; avisos (⚠) solo informan.
 */
import { existsSync, openSync, readFileSync, readSync, closeSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ESTILOS = ["tecnico", "cuerpo", "historia"];
const TRANSICIONES = ["panel", "deslizar", "fundido", "zoom", "zoom-out", "corte"];
const TIPOS = ["gancho", "numero", "barras", "columnas", "comparacion", "lista", "frase", "cierre", "ruta", "visual"];

/** Claves "<tema>/<escena>" declaradas en src/visuals/<tema>/index.ts. */
const visualesRegistrados = () => {
  const dir = path.join(ROOT, "src", "visuals");
  const out = new Set();
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const idx = path.join(dir, d.name, "index.ts");
    if (!d.isDirectory() || !existsSync(idx)) continue;
    const src = readFileSync(idx, "utf-8");
    const bloque = /export const visuales\s*=\s*\{([\s\S]*?)\}/.exec(src)?.[1] ?? "";
    for (const m of bloque.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)) out.add(`${d.name}/${m[1]}`);
  }
  return out;
};

/** Duración de un MP3 CBR: tamaño / bitrate del primer cuadro (así se exportan los fondos). */
const duracionMp3 = (file) => {
  const buf = readFileSync(file);
  let i = buf.slice(0, 3).toString() === "ID3" ? 10 + ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]) : 0;
  while (i < buf.length - 4 && !(buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0)) i++;
  const tabla = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  const kbps = tabla[(buf[i + 2] >> 4) & 0xf];
  return kbps ? ((buf.length - i) * 8) / (kbps * 1000) : 0;
};

/** Duración de un WAV PCM leyendo su cabecera (sin dependencias). */
const duracionWav = (file) => {
  const fd = openSync(file, "r");
  const buf = Buffer.alloc(4096);
  readSync(fd, buf, 0, 4096, 0);
  closeSync(fd);
  let off = 12;
  let byteRate = 0;
  while (off < 4088) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(off + 16);
    if (id === "data") return byteRate ? size / byteRate : 0;
    off += 8 + size + (size % 2);
  }
  return 0;
};

const duracionVideo = (slug) => {
  const p = path.join(ROOT, "public", "videos", slug, "manifest.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf-8"));
  const esc = m.escenas;
  const f = esc.reduce((a, e) => a + e.durationInFrames, 0) - m.transitionFrames * esc.slice(0, -1).filter((e) => e.transicion !== "corte").length;
  return f / m.fps;
};

export const validar = (slug) => {
  const errores = [];
  const avisos = [];
  const p = path.join(ROOT, "videos", slug, "guion.json");
  if (!existsSync(p)) return { errores: [`no existe videos/${slug}/guion.json`], avisos };
  let g;
  try {
    g = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    return { errores: [`guion.json no es JSON válido: ${e.message}`], avisos };
  }
  const reg = visualesRegistrados();
  const interno = g.interno === true; // demos/pruebas: no se publican
  const estilo = g.estilo ?? "tecnico";
  if (!ESTILOS.includes(estilo)) errores.push(`estilo "${estilo}" inválido (${ESTILOS.join(" | ")})`);
  if (!g.estilo && !interno) avisos.push(`sin "estilo": se usará "tecnico"; elige según el tema (CLAUDE.md)`);
  if (!Array.isArray(g.escenas) || !g.escenas.length) errores.push("no hay escenas");
  const ids = new Set();
  (g.escenas ?? []).forEach((e, i) => {
    const d = `escena ${i + 1} (${e.id ?? "?"})`;
    if (!e.id) errores.push(`${d}: falta id`);
    if (ids.has(e.id)) errores.push(`${d}: id repetido`);
    ids.add(e.id);
    if (!TIPOS.includes(e.tipo)) errores.push(`${d}: tipo "${e.tipo}" inválido`);
    if (!e.narracion?.trim()) errores.push(`${d}: falta narración`);
    if (e.transicion && !TRANSICIONES.includes(e.transicion)) errores.push(`${d}: transición "${e.transicion}" inválida`);
    if (e.tipo === "visual") {
      const v = e.props?.visual;
      if (!v) errores.push(`${d}: falta props.visual`);
      else if (!reg.has(v)) errores.push(`${d}: el visual "${v}" no existe (exporta "${v.split("/")[1]}" en src/visuals/${v.split("/")[0]}/index.ts)`);
    }
    if (e.tipo !== "visual" && !interno) {
      avisos.push(`${d}: tipo de texto "${e.tipo}"; la regla es que la imagen explique (usa "visual")`);
    }
  });
  const fuentes = (g.fuentes ?? []).filter((f) => f && !/Autor\/Institución/.test(f));
  if (!fuentes.length && !interno) avisos.push("sin fuentes verificables en guion.fuentes");
  if (g.musica) {
    const mp = path.join(ROOT, "public", g.musica.src);
    if (!existsSync(mp)) errores.push(`música no encontrada: public/${g.musica.src} (npm run musica -- <nombre> --para ${slug})`);
    else {
      const dm = mp.endsWith(".mp3") ? duracionMp3(mp) : duracionWav(mp);
      const dv = duracionVideo(slug);
      if (dv && dm && dm < dv - 0.5) {
        avisos.push(`la música dura ${dm.toFixed(1)} s y el video ${dv.toFixed(1)} s: se repetirá con un corte. Regenera con --para ${slug}`);
      }
    }
  } else if (!interno) avisos.push("sin música de fondo");
  if (!g.portada?.titulo && !interno) avisos.push('sin "portada.titulo" (titular de la portada del Reel)');
  return { errores, avisos };
};

const main = () => {
  const arg = process.argv[2];
  const slugs = arg
    ? [arg]
    : readdirSync(path.join(ROOT, "videos"), { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
        .map((d) => d.name);
  let total = 0;
  for (const s of slugs) {
    const { errores, avisos } = validar(s);
    total += errores.length;
    const estado = errores.length ? "✖" : avisos.length ? "⚠" : "✔";
    console.log(`${estado} ${s}`);
    errores.forEach((e) => console.log(`   ✖ ${e}`));
    avisos.forEach((a) => console.log(`   ⚠ ${a}`));
  }
  if (total) process.exit(1);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
