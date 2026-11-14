#!/usr/bin/env node
/** Instalación única: dependencias npm + entorno Python (.venv) + efectos + skills + música (ACE-Step). */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";
const run = (cmd, args) => {
  console.log(`▶ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, shell: win });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run("npm", ["install"]);
const py = win ? path.join(ROOT, ".venv", "Scripts", "python.exe") : path.join(ROOT, ".venv", "bin", "python");
if (!existsSync(py)) run(win ? "py" : "python3", win ? ["-3.12", "-m", "venv", ".venv"] : ["-m", "venv", ".venv"]);
run(py, ["-m", "pip", "install", "--upgrade", "pip"]);
run(py, ["-m", "pip", "install", "-r", "requirements.txt"]);
run(py, [path.join("pipeline", "sfx.py")]);
run("node", [path.join("scripts", "registrar.mjs")]);
run("node", [path.join("scripts", "sync-skill.mjs")]);

// Skills oficiales de Remotion (buenas prácticas del framework) para Claude Code.
const r0 = spawnSync("npx", ["--yes", "remotion", "skills", "add"], { stdio: "inherit", cwd: ROOT, shell: win });
const agentes = path.join(ROOT, ".agents", "skills");
if (r0.status === 0 && existsSync(agentes)) {
  cpSync(agentes, path.join(ROOT, ".claude", "skills"), { recursive: true });
} else {
  console.warn("⚠ No pude instalar las skills de Remotion (opcional). Reintenta: npx remotion skills add");
}

// Música (ACE-Step 1.5, opcional pero recomendado): entorno propio con uv.
const ace = path.join(ROOT, "tools", "ACE-Step-1.5");
if (!process.argv.includes("--sin-musica")) {
  if (!existsSync(ace)) run("git", ["clone", "--depth", "1", "https://github.com/ACE-Step/ACE-Step-1.5.git", ace]);
  run(win ? "py" : "python3", win ? ["-3.12", "-m", "pip", "install", "--user", "uv"] : ["-m", "pip", "install", "--user", "uv"]);
  const r = spawnSync("uv", ["sync"], { stdio: "inherit", cwd: ace, shell: win });
  if (r.status === 0) spawnSync("uv", ["pip", "install", "imageio-ffmpeg"], { stdio: "inherit", cwd: ace, shell: win });
  else console.warn("⚠ No pude instalar ACE-Step (música). El resto funciona; reintenta con: cd tools/ACE-Step-1.5 && uv sync");
}
console.log("\n✔ Listo. Abre esta carpeta con Claude Code y pide: «hazme un video sobre …»");
console.log("  (o a mano: npm run nuevo -- mi-video --estilo=cuerpo)");
