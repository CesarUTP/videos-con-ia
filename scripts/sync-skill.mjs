#!/usr/bin/env node
/**
 * Mantiene el proyecto compatible con varios agentes:
 *  - La skill vive en skills/crear-video/ (formato de `npx skills add`) y se copia a
 *    .claude/skills/ (Claude Code) y .agents/skills/ (Codex y otros que siguen el estándar).
 *  - CLAUDE.md es la fuente de las reglas; AGENTS.md (Codex) es una copia idéntica.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "skills", "crear-video");
if (existsSync(src)) {
  for (const d of [".claude", ".agents"]) {
    const dst = path.join(ROOT, d, "skills", "crear-video");
    mkdirSync(dst, { recursive: true });
    cpSync(src, dst, { recursive: true });
  }
}
const reglas = readFileSync(path.join(ROOT, "CLAUDE.md"), "utf-8");
const aviso = "<!-- Copia automática de CLAUDE.md (scripts/sync-skill.mjs). Edita CLAUDE.md, no este archivo. -->\n";
const destino = path.join(ROOT, "AGENTS.md");
const nuevo = aviso + reglas;
if (!existsSync(destino) || readFileSync(destino, "utf-8") !== nuevo) writeFileSync(destino, nuevo);
console.log("✔ skill crear-video en .claude/ y .agents/; AGENTS.md sincronizado con CLAUDE.md");
