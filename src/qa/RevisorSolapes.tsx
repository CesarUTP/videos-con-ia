import { useLayoutEffect } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Revisor automático de composición (solo en modo QA: `npm run qa`).
 *
 * Mide en cada cuadro la caja REAL (getBoundingClientRect) de todo elemento
 * marcado con `data-qa` y avisa por consola (la recoge scripts/video.mjs):
 *
 *   pastilla   ⨯ cara | importante | objeto | etiqueta | pastilla | subtitulo
 *   etiqueta   ⨯ cara | etiqueta | subtitulo            (y fuera de pantalla)
 *   subtitulo  ⨯ cara
 *   objeto     ⨯ cara                                   (un sobre tapando la cara)
 *   efecto     ⨯ cara | importante                      (texto decorativo encima de algo clave)
 *
 * Marcas: data-qa="cara" (Personaje), "pastilla" (Badge), "etiqueta" (Label),
 * "subtitulo" (Captions), "objeto" (utilería que se mueve), "importante"
 * (arte que debe verse: banderas, documentos, letreros), "efecto" (Onomatopeya).
 * data-qa-nombre da un nombre legible en el aviso.
 */
type Tipo = "cara" | "pastilla" | "etiqueta" | "subtitulo" | "objeto" | "importante" | "efecto";

const CHOCA: Record<Tipo, Tipo[]> = {
  pastilla: ["cara", "importante", "objeto", "etiqueta", "pastilla", "subtitulo"],
  etiqueta: ["cara", "etiqueta", "subtitulo"],
  subtitulo: ["cara"],
  objeto: ["cara"],
  efecto: ["cara", "importante"],
  cara: [],
  importante: [],
};
const FUERA: Tipo[] = ["pastilla", "etiqueta", "subtitulo"];

/** Fracción mínima del área del elemento más pequeño que debe quedar tapada para avisar. */
const UMBRAL = 0.12;

const visible = (el: Element): boolean => {
  let n: Element | null = el;
  let op = 1;
  for (let i = 0; n && i < 12; i++) {
    const cs = getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    op *= parseFloat(cs.opacity || "1");
    n = n.parentElement;
  }
  return op > 0.35;
};

export const RevisorSolapes: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  useLayoutEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-qa]"))
      .filter(visible)
      .map((el) => ({
        tipo: el.getAttribute("data-qa") as Tipo,
        nombre: el.getAttribute("data-qa-nombre") ?? "",
        r: el.getBoundingClientRect(),
      }))
      .filter((e) => e.r.width > 2 && e.r.height > 2 && CHOCA[e.tipo] !== undefined);
    // El escalado del render (p. ej. 0.25) cambia el tamaño del viewport: normalizamos.
    const root = document.querySelector("#remotion-qa-raiz")?.getBoundingClientRect();
    const sx = root && root.width ? width / root.width : 1;
    const ox = root?.left ?? 0;
    const oy = root?.top ?? 0;
    const caja = (r: DOMRect) => ({
      x0: (r.left - ox) * sx,
      y0: (r.top - oy) * sx,
      x1: (r.right - ox) * sx,
      y1: (r.bottom - oy) * sx,
    });
    const avisos: string[] = [];
    els.forEach((a, i) => {
      const A = caja(a.r);
      if (FUERA.includes(a.tipo) && (A.x0 < -2 || A.x1 > width + 2 || A.y0 < -2 || A.y1 > height + 2)) {
        avisos.push(`${a.tipo} "${a.nombre}" se sale de la pantalla`);
      }
      els.forEach((b, j) => {
        if (i === j || !CHOCA[a.tipo].includes(b.tipo)) return;
        if (a.tipo === b.tipo && j < i) return; // par simétrico una sola vez
        const B = caja(b.r);
        const w = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0);
        const h = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0);
        if (w <= 0 || h <= 0) return;
        const menor = Math.min((A.x1 - A.x0) * (A.y1 - A.y0), (B.x1 - B.x0) * (B.y1 - B.y0));
        if ((w * h) / menor >= UMBRAL) {
          avisos.push(`${a.tipo} "${a.nombre}" tapa ${b.tipo}${b.nombre ? ` "${b.nombre}"` : ""}`);
        }
      });
    });
    avisos.forEach((m) => console.warn(`[qa] f=${frame} ${m}`));
  }, [frame, width, height]);
  return null;
};
