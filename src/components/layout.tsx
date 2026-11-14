import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CAPTION_ZONE, EASE, SAFE } from "../theme";
import { useScene } from "../scene-context";

/** Formato numérico en español (México por defecto). */
export const fmt = (n: number, decimales = 0, locale = "es-MX") =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n);

export const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Área de contenido de la escena: respeta zonas seguras y deja libre
 * la franja de subtítulos. Aplica una salida corta al final de la escena
 * para que nada quede estático justo antes de la transición.
 */
export const SceneArea: React.FC<{
  children: React.ReactNode;
  justify?: "flex-start" | "center" | "flex-end";
  gap?: number;
}> = ({ children, justify = "center", gap = 48 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useScene();
  // Deriva continua muy leve (la cámara "respira"): nunca 0,5 s quietos.
  const drift = interpolate(frame, [0, durationInFrames], [0, -26], clamp01);
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.025], clamp01);
  const exit = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [0, 1],
    { ...clamp01, easing: EASE.exit },
  );
  return (
    <AbsoluteFill
      style={{
        paddingTop: CAPTION_ZONE.top + CAPTION_ZONE.height + 30,
        paddingLeft: SAFE.left,
        paddingRight: SAFE.right - 30,
        paddingBottom: SAFE.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: justify,
        gap,
        transform: `translateY(${drift - exit * 40}px) scale(${scale})`,
        opacity: 1 - exit * 0.6,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
