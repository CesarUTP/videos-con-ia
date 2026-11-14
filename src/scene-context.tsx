import React, { createContext, useContext } from "react";
import type { Palabra } from "./components/Captions";

type SceneCtx = {
  /** Duración total de la escena en frames. */
  durationInFrames: number;
  /** Frame (relativo a la escena) donde empieza la voz. */
  audioStartFrame: number;
  audioFrames: number;
  palabras: Palabra[];
  fps: number;
  index: number;
  total: number;
};

const Ctx = createContext<SceneCtx | null>(null);

export const SceneProvider: React.FC<{
  value: SceneCtx;
  children: React.ReactNode;
}> = ({ value, children }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;

export const useScene = (): SceneCtx => {
  const v = useContext(Ctx);
  if (!v) {
    // Uso fuera del Reel (p. ej. una composición de prueba): valores neutros.
    return {
      durationInFrames: 150,
      audioStartFrame: 0,
      audioFrames: 150,
      palabras: [],
      fps: 30,
      index: 0,
      total: 1,
    };
  }
  return v;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ%$]/g, "");

/**
 * Devuelve el frame (relativo a la escena) en que la voz DICE una palabra.
 * Permite sincronizar revelaciones con la narración: useCue("mediana").
 * `nth` = qué aparición (0 = primera). Si no la encuentra usa `fallback`.
 */
/** Aviso (lo recoge `npm run stills`): la palabra clave no está en la narración. */
const avisados = new Set<string>();
const avisar = (word: string, index: number) => {
  const k = `${index}:${word}`;
  if (avisados.has(k)) return; // una vez por pestaña del navegador, no en cada cuadro
  avisados.add(k);
  console.warn(`[cue] escena ${index + 1}: no encontré "${word}" en la narración (uso tiempo aproximado)`);
};

export const useCue = (
  word: string | undefined,
  fallback: number,
  nth = 0,
): number => {
  const { palabras, audioStartFrame, fps, index } = useScene();
  if (!word) return fallback;
  const target = normalize(word);
  let seen = 0;
  for (const p of palabras) {
    if (normalize(p.text) === target) {
      if (seen === nth) {
        return audioStartFrame + Math.round((p.startMs / 1000) * fps);
      }
      seen++;
    }
  }
  if (palabras.length) avisar(word, index);
  return fallback;
};

/**
 * Varias palabras en ORDEN de aparición (cada una se busca después de la
 * anterior). Devuelve frames relativos a la escena. Útil para coreografiar
 * una escena completa con la narración: useCues(["tendón", "cuádriceps", "huso"]).
 */
export const useCues = (words: (string | undefined)[], fallbacks?: number[]): number[] => {
  const { palabras, audioStartFrame, fps, audioFrames, index } = useScene();
  const out: number[] = [];
  let from = 0;
  words.forEach((w, i) => {
    const fb = fallbacks?.[i] ?? audioStartFrame + Math.round(((i + 1) * audioFrames) / (words.length + 1));
    if (!w) {
      out.push(fb);
      return;
    }
    const target = normalize(w);
    const idx = palabras.findIndex((p, j) => j >= from && normalize(p.text) === target);
    if (idx >= 0) {
      out.push(audioStartFrame + Math.round((palabras[idx].startMs / 1000) * fps));
      from = idx + 1;
    } else {
      if (palabras.length) avisar(w, index);
      out.push(fb);
    }
  });
  return out;
};
