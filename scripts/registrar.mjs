#!/usr/bin/env node
/**
 * Genera src/visuals/index.ts a partir de cada carpeta src/visuals/<tema>/index.ts
 * (que exporta `visuales`). Claves resultantes: "<tema>/<escena>".
 * Se ejecuta solo antes de stills/render/dev; no edites index.ts a mano.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "src", "visuals");

export const registrar = () => {
  const temas = readdirSync(DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(DIR, d.name, "index.ts")))
    .map((d) => d.name)
    .sort();
  const id = (t) => "V_" + t.replace(/[^a-zA-Z0-9]/g, "_");
  const src = `// ARCHIVO GENERADO por scripts/registrar.mjs — no editar a mano.
import type React from "react";
${temas.map((t) => `import { visuales as ${id(t)} } from "./${t}";`).join("\n")}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Escena = React.FC<any>;
const prefijar = (tema: string, v: Record<string, Escena>): Record<string, Escena> =>
  Object.fromEntries(Object.entries(v).map(([k, c]) => [\`\${tema}/\${k}\`, c]));

/** Registro de escenas visuales: "<tema>/<escena>" → componente. */
export const VISUALS: Record<string, Escena> = {
${temas.map((t) => `  ...prefijar("${t}", ${id(t)}),`).join("\n")}
};
`;
  const dest = path.join(DIR, "index.ts");
  const prev = existsSync(dest) ? readFileSync(dest, "utf-8") : "";
  if (prev !== src) writeFileSync(dest, src);
  return temas;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log(`✔ visuales registrados: ${registrar().join(", ")}`);
}
