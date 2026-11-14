import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLOR, EASE, FONT } from "../theme";

/**
 * Lectura numérica "de instrumento" dentro de la escena (p. ej. sensores
 * que bajan de 100 a 62). Valor interpolado entre claves, números tabulares.
 */
export const Readout: React.FC<{
  keys: { at: number; value: number }[];
  label?: string;
  decimals?: number;
  size?: number;
  color?: string;
  appear?: number;
  style?: React.CSSProperties;
}> = ({ keys, label, decimals = 0, size = 64, color = COLOR.ink, appear = keys[0]?.at ?? 0, style }) => {
  const frame = useCurrentFrame();
  const value = interpolate(
    frame,
    keys.map((k) => k.at),
    keys.map((k) => k.value),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.data },
  );
  const op = interpolate(frame, [appear - 6, appear + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: op, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, ...style }}>
      <div
        style={{
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: size,
          color,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          textShadow: color === COLOR.accent ? "0 0 24px rgba(255,178,63,0.6)" : "none",
        }}
      >
        {value.toFixed(decimals)}
      </div>
      {label ? (
        <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: COLOR.inkSoft, textTransform: "uppercase" }}>
          {label}
        </div>
      ) : null}
    </div>
  );
};
