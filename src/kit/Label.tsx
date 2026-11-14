import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useEstilo } from "../estilos";
import { EASE, FONT } from "../theme";

/**
 * Etiqueta con línea guía. Dos variantes según el registro visual:
 * - "tecnica" (tecnico): texto en mayúsculas con tracking + subrayado.
 * - "pastilla" (cuerpo/historia): pastilla clara redondeada con texto oscuro.
 * Coordenadas del SVG que la contiene; `scale` compensa el zoom de cámara.
 */
export const Label: React.FC<{
  x: number;
  y: number;
  tx: number;
  ty: number;
  text: string;
  at: number;
  until?: number;
  scale?: number;
  color?: string;
  align?: "start" | "end";
  sub?: string;
  variante?: "tecnica" | "pastilla";
}> = ({ x, y, tx, ty, text, at, until, scale = 1, color, align = "start", sub, variante }) => {
  const frame = useCurrentFrame();
  const e = useEstilo();
  const v = variante ?? e.etiqueta;
  const c = color ?? e.texto;
  const draw = interpolate(frame, [at, at + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.text,
  });
  const pop = interpolate(frame, [at + 4, at + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.icon,
  });
  const out =
    until === undefined
      ? 0
      : interpolate(frame, [until, until + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = draw * (1 - out);
  if (op <= 0) return null;
  const k = 1 / scale;
  const ex = x + (tx - x) * draw;
  const ey = y + (ty - y) * draw;

  if (v === "pastilla") {
    const fs = 30 * k;
    const subFs = 22 * k;
    const w = Math.max(text.length * fs * 0.6, sub ? sub.length * subFs * 0.56 : 0) + 44 * k;
    const h = (sub ? 86 : 56) * k;
    const left = align === "start" ? tx : tx - w;
    return (
      <g opacity={op}>
        <path d={`M${x} ${y} L${ex} ${ey}`} stroke="#FFFFFF" strokeWidth={3 * k} opacity={0.9} />
        <circle cx={x} cy={y} r={7 * k} fill="#FFFFFF" />
        <g data-qa="etiqueta" data-qa-nombre={text} transform={`translate(${left + w / 2} ${ty}) scale(${pop}) translate(${-w / 2} ${-h / 2})`}>
          <rect width={w} height={h} rx={h / 2.4} fill="#FFFDF8" stroke="rgba(0,0,0,0.25)" strokeWidth={2 * k} />
          <text
            x={w / 2}
            y={(sub ? 36 : 38) * k}
            textAnchor="middle"
            fontFamily={FONT.sans}
            fontWeight={800}
            fontSize={fs}
            fill="#2A1A2E"
          >
            {text}
          </text>
          {sub ? (
            <text x={w / 2} y={68 * k} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={subFs} fill="#7A5C76">
              {sub}
            </text>
          ) : null}
        </g>
      </g>
    );
  }

  const fs = 26 * k;
  const barW = (align === "start" ? 1 : -1) * (text.length * fs * 0.72 + 10 * k);
  return (
    <g opacity={op}>
      <circle cx={x} cy={y} r={5 * k} fill={c} />
      <circle cx={x} cy={y} r={11 * k} fill="none" stroke={c} strokeWidth={1.5 * k} opacity={0.6} />
      <path d={`M${x} ${y} L${ex} ${ey} l${barW * draw} 0`} stroke={c} strokeWidth={2 * k} fill="none" opacity={0.8} />
      <text
        data-qa="etiqueta"
        data-qa-nombre={text}
        x={tx + (align === "start" ? 4 * k : -4 * k)}
        y={ty - 10 * k}
        textAnchor={align}
        fontFamily={FONT.sans}
        fontWeight={700}
        fontSize={fs}
        letterSpacing={4 * k}
        fill={c}
        style={{ textTransform: "uppercase" }}
      >
        {text}
      </text>
      {sub ? (
        <text
          x={tx + (align === "start" ? 4 * k : -4 * k)}
          y={ty + 30 * k}
          textAnchor={align}
          fontFamily={FONT.mono}
          fontWeight={500}
          fontSize={fs * 0.85}
          fill={e.textoSuave}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
};
