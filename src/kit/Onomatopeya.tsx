import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FONT } from "../theme";
import { tono } from "./colores";

/**
 * Onomatopeya dibujada ("GRRR", "¡TOC!", "GLU GLU"): letras gruesas con
 * contorno del mismo tono, entrada con rebote y temblor. Va dentro de un <svg>.
 */
export const Onomatopeya: React.FC<{
  x: number;
  y: number;
  text: string;
  at: number;
  dur?: number;
  size?: number;
  rot?: number;
  color?: string;
  scale?: number;
  temblor?: boolean;
}> = ({ x, y, text, at, dur = 26, size = 96, rot = -8, color = "#FFF4E0", scale = 1, temblor = true }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur + 8) return null;
  const pop = interpolate(t, [0, 5, 9], [0.2, 1.18, 1], { extrapolateRight: "clamp" });
  const out = interpolate(t, [dur, dur + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = temblor ? Math.sin(t * 2.3) * 3 : 0;
  const k = 1 / scale;
  return (
    <g data-qa="efecto" data-qa-nombre={text} transform={`translate(${x + shake * k} ${y}) rotate(${rot + shake * 0.6}) scale(${pop * k})`} opacity={out}>
      <text
        textAnchor="middle"
        fontFamily={FONT.sans}
        fontWeight={900}
        fontSize={size}
        letterSpacing={2}
        fill={color}
        stroke={tono(color, -0.62, 0.1)}
        strokeWidth={size * 0.14}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {text}
      </text>
    </g>
  );
};

/** Líneas de movimiento / vibración alrededor de un punto (como "GRRR"). */
export const Vibracion: React.FC<{ x: number; y: number; r: number; at: number; dur?: number; color?: string; scale?: number }> = ({
  x,
  y,
  r,
  at,
  dur = 24,
  color = "#FFFFFF",
  scale = 1,
}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const op = interpolate(t, [0, 4, dur], [0, 0.9, 0], { extrapolateRight: "clamp" });
  const g = 6 * Math.sin(t * 1.7);
  const k = 1 / scale;
  return (
    <g opacity={op} stroke={color} strokeWidth={5 * k} strokeLinecap="round" fill="none">
      <path d={`M${x - r - 10 * k + g * k} ${y - r * 0.5} Q${x - r - 30 * k + g * k} ${y} ${x - r - 10 * k + g * k} ${y + r * 0.5}`} />
      <path d={`M${x - r - 34 * k + g * k} ${y - r * 0.35} Q${x - r - 50 * k + g * k} ${y} ${x - r - 34 * k + g * k} ${y + r * 0.35}`} />
      <path d={`M${x + r + 10 * k - g * k} ${y - r * 0.5} Q${x + r + 30 * k - g * k} ${y} ${x + r + 10 * k - g * k} ${y + r * 0.5}`} />
      <path d={`M${x + r + 34 * k - g * k} ${y - r * 0.35} Q${x + r + 50 * k - g * k} ${y} ${x + r + 34 * k - g * k} ${y + r * 0.35}`} />
    </g>
  );
};
