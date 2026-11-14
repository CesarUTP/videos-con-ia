import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEstilo } from "../estilos";
import { useScene } from "../scene-context";
import { CAPTION_ZONE, EASE, FONT, TIMING, TYPE } from "../theme";

/** Palabra con tiempos (ms relativos al inicio del audio de la escena). */
export type Palabra = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs?: number | null;
  confidence?: number | null;
  /** Palabra clave (marcada con **…** en la narración): caja de selección azul. */
  destacar?: boolean;
  /** La palabra cerraba una frase o cláusula (., ?, !, ,): corte de página. */
  corte?: boolean;
};

type Page = { words: Palabra[]; startMs: number; endMs: number };

/** Agrupa en "páginas" cortas: máx. 4 palabras / 24 caracteres, corta en pausas y puntuación. */
export const paginate = (palabras: Palabra[], maxWords = 4, maxChars = 24): Page[] => {
  const pages: Page[] = [];
  let cur: Palabra[] = [];
  const flush = () => {
    if (cur.length) {
      pages.push({ words: cur, startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs });
    }
    cur = [];
  };
  palabras.forEach((w, i) => {
    const prev = palabras[i - 1];
    const chars = cur.map((c) => c.text.trim()).join(" ").length + w.text.trim().length;
    if (cur.length && (cur.length >= maxWords || chars > maxChars || (prev && w.startMs - prev.endMs > 320))) flush();
    cur.push(w);
    if (w.corte) flush();
  });
  flush();
  return pages;
};

const Handles: React.FC<{ color: string; fill: string }> = ({ color, fill }) => {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 9,
    height: 9,
    background: fill,
    border: `2px solid ${color}`,
    borderRadius: 2,
  };
  return (
    <>
      <span style={{ ...s, left: -6, top: -6 }} />
      <span style={{ ...s, right: -6, bottom: -6 }} />
    </>
  );
};

/**
 * Subtítulos arriba, estilo "explicador": las palabras aparecen al decirse,
 * las ya dichas quedan en gris, la actual en blanco y la palabra clave con
 * una caja de selección azul.
 */
export const Captions: React.FC<{ palabras: Palabra[]; offsetFrames: number }> = ({
  palabras,
  offsetFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const e = useEstilo();
  const historia = e.subtitulos === "historia";
  const pages = useMemo(() => (historia ? paginate(palabras, 2, 14) : paginate(palabras)), [palabras, historia]);
  const { durationInFrames } = useScene();
  // No mostrar subtítulos durante la salida (solape con la escena siguiente):
  // evita dos subtítulos a la vez en fundidos/zooms.
  const tMs = ((frame - offsetFrames) / fps) * 1000;
  const fin = palabras.length ? palabras[palabras.length - 1].endMs : 0;
  if (frame >= durationInFrames - TIMING.cambioEscena && tMs > fin + 150) return null;

  const idx = pages.findIndex(
    (p, i) => tMs >= p.startMs - 60 && tMs < (pages[i + 1]?.startMs ?? p.endMs + 400) - 60,
  );
  if (idx < 0) return null;
  const page = pages[idx];

  if (historia) {
    const pStart = offsetFrames + (page.startMs / 1000) * fps;
    const pop = interpolate(frame, [pStart - 1, pStart + 4], [0.6, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.icon,
    });
    return (
      <div
        style={{
          position: "absolute",
          top: 1400,
          left: 60,
          width: width - 120,
          textAlign: "center",
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.05,
          color: e.texto,
          WebkitTextStroke: "14px #000",
          paintOrder: "stroke fill",
          transform: `scale(${pop})`,
          letterSpacing: -1,
          pointerEvents: "none",
        }}
      >
        <span data-qa="subtitulo" data-qa-nombre={page.words.map((w) => w.text.trim()).join(" ")}>
          {page.words.map((w) => w.text.trim()).join(" ")}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: CAPTION_ZONE.top,
        left: 90,
        width: width - 180,
        height: CAPTION_ZONE.height,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        data-qa="subtitulo"
        data-qa-nombre={page.words.map((w) => w.text.trim()).join(" ")}
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          gap: "4px 16px",
          fontFamily: FONT.sans,
          fontSize: TYPE.caption,
          lineHeight: 1.22,
          letterSpacing: -0.5,
          textAlign: "center",
          textShadow: "0 2px 18px rgba(0,0,0,0.85)",
        }}
      >
        {page.words.map((w, i) => {
          const wStart = offsetFrames + (w.startMs / 1000) * fps;
          const appear = interpolate(frame, [wStart - 2, wStart + 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE.text,
          });
          const current = tMs >= w.startMs - 40 && tMs < w.endMs + 80;
          const said = tMs >= w.startMs - 40;
          const sel = w.destacar && said;
          const box = interpolate(frame, [wStart, wStart + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE.text,
          });
          return (
            <span
              key={i}
              style={{
                position: "relative",
                opacity: appear,
                transform: `translateY(${(1 - appear) * 10}px)`,
                color: current || sel ? e.texto : e.textoSuave,
                fontWeight: current || sel ? 700 : 500,
                padding: sel ? "0 8px" : 0,
              }}
            >
              {sel ? (
                <span
                  style={{
                    position: "absolute",
                    inset: "2px -2px -2px -2px",
                    border: `2.5px solid ${e.seleccion}`,
                    background: `${e.seleccion}29`,
                    transform: `scale(${0.9 + box * 0.1})`,
                    opacity: box,
                  }}
                >
                  <Handles color={e.seleccion} fill={e.texto} />
                </span>
              ) : null}
              <span style={{ position: "relative" }}>{w.text.trim()}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
