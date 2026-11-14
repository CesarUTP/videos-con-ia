#!/usr/bin/env node
/**
 * La skill vive en skills/crear-video/ (formato de `npx skills add`).
 * Claude Code la lee desde .claude/skills/: esta copia las mantiene iguales.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "skills", "crear-video");
const dst = path.join(ROOT, ".claude", "skills", "crear-video");
if (existsSync(src)) {
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, { recursive: true });
  console.log("✔ skill crear-video sincronizada en .claude/skills/");
}
