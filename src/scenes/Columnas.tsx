import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { KineticText, Kicker } from "../components/KineticText";
import { clamp01, fmt, SceneArea } from "../components/layout";
import { useCue } from "../scene-context";
import { COLOR, EASE, FONT, TIMING, TYPE } from "../theme";

export type ColumnasProps = {
  kicker?: string;
  titulo: string;
  valores: number[];
  etiquetas?: string[];
  prefijo?: string;
  sufijo?: string;
  /** Tope del eje. Valores mayores se dibujan "fuera de escala". */
  tope?: number;
  /** Líneas calculadas AUTOMÁTICAMENTE de los datos (no se inventan). */
  lineas?: { tipo: "media" | "mediana"; cue?: string }[];
  /** Una columna que entra tarde, sincronizada con una palabra. */
  entraTarde?: { indice: number; cue?: string };
  cue?: string;
  locale?: string;
};

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const CH = 640; // alto del gráfico
const CW = 860; // ancho del gráfico

export const Columnas: React.FC<ColumnasProps> = ({
  kicker,
  titulo,
  valores,
  etiquetas,
  prefijo = "",
  sufijo = "",
  tope,
  lineas = [],
  entraTarde,
  cue,
  locale,
}) => {
  const frame = useCurrentFrame();
  const start = useCue(cue, 8);
  const lateCue = useCue(entraTarde?.cue, start + 40);
  const cues = [
    useCue(lineas[0]?.cue, start + 60),
    useCue(lineas[1]?.cue, start + 90),
  ];
  const sorted = [...valores].sort((a, b) => a - b);
  const cap = tope ?? sorted[Math.floor(sorted.length * 0.8)] * 1.6;
  const n = valores.length;
  const gap = 14;
  const bw = (CW - gap * (n - 1)) / n;
  const late = entraTarde?.indice;
  // Las líneas se calculan con las columnas visibles en ese momento.
  const visibleAt = (f: number) =>
    valores.filter((_, i) => i !== late || f >= lateCue);

  return (
    <SceneArea gap={36}>
      {kicker ? <Kicker text={kicker} /> : null}
      <KineticText text={titulo} size={TYPE.h2} delay={2} />
      <div style={{ position: "relative", width: CW, height: CH + 60, marginTop: 70 }}>
        {/* eje base */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: CH,
            width: CW,
            height: 4,
            background: COLOR.ink,
          }}
        />
        {valores.map((v, i) => {
          const s = i === late ? lateCue : start + i * 3;
          const p = interpolate(frame, [s, s + TIMING.dataIn], [0, 1], {
            ...clamp01,
            easing: i === late ? EASE.text : EASE.data,
          });
          const over = v > cap;
          const h = (Math.min(v, cap) / cap) * CH * p;
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: i * (bw + gap),
                  top: CH - h,
                  width: bw,
                  height: h,
                  background: over ? COLOR.accent : COLOR.ink,
                  borderRadius: "8px 8px 0 0",
                  overflow: "hidden",
                }}
              >
                {over ? (
                  <svg
                    width={bw}
                    height={40}
                    style={{ position: "absolute", top: 70 }}
                    viewBox={`0 0 ${bw} 40`}
                  >
                    <path
                      d={`M0 14 L${bw} 4 M0 34 L${bw} 24`}
                      stroke={COLOR.bg}
                      strokeWidth={8}
                    />
                  </svg>
                ) : null}
              </div>
              {over && p > 0.6 ? (
                <div
                  style={{
                    position: "absolute",
                    right: CW - (i * (bw + gap) + bw),
                    top: -62,
                    fontFamily: FONT.mono,
                    fontWeight: 700,
                    fontSize: 32,
                    color: COLOR.accent,
                    whiteSpace: "nowrap",
                    opacity: interpolate(p, [0.6, 1], [0, 1]),
                  }}
                >
                  ↑ {prefijo}
                  {fmt(v, 0, locale)}
                  {sufijo}
                </div>
              ) : null}
              {etiquetas?.[i] ? (
                <div
                  style={{
                    position: "absolute",
                    left: i * (bw + gap),
                    top: CH + 14,
                    width: bw,
                    textAlign: "center",
                    fontFamily: FONT.mono,
                    fontSize: 22,
                    color: COLOR.inkSoft,
                    opacity: p,
                  }}
                >
                  {etiquetas[i]}
                </div>
              ) : null}
            </div>
          );
        })}
        {lineas.map((l, li) => {
          const c = cues[li];
          const vis = visibleAt(c);
          const value = l.tipo === "media" ? mean(vis) : median(vis);
          const p = interpolate(frame, [c, c + 22], [0, 1], {
            ...clamp01,
            easing: EASE.data,
          });
          if (p <= 0) return null;
          const over = value > cap;
          const y = over ? 0 : CH - (value / cap) * CH;
          const color = l.tipo === "media" ? COLOR.accent : COLOR.ink;
          const label = `${l.tipo === "media" ? "Media" : "Mediana"} ${prefijo}${fmt(value, 0, locale)}${sufijo}`;
          return (
            <div key={li}>
              <div
                style={{
                  position: "absolute",
                  left: -10,
                  top: y - 3,
                  width: (CW + 20) * p,
                  height: 0,
                  borderTop: `6px ${l.tipo === "media" ? "solid" : "dashed"} ${color}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  ...(over ? { left: 0 } : { right: 0 }),
                  top: over ? -62 : y - (li === 0 ? 70 : -16),
                  boxShadow: `0 0 0 5px ${COLOR.bg}`,
                  padding: "6px 16px",
                  borderRadius: 10,
                  background: color,
                  color: COLOR.accentInk,
                  fontFamily: FONT.mono,
                  fontWeight: 700,
                  fontSize: 30,
                  fontVariantNumeric: "tabular-nums",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 16}px)`,
                  whiteSpace: "nowrap",
                }}
              >
                {over ? "↑ " : ""}
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </SceneArea>
  );
};
