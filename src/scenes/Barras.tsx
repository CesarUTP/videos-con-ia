import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { KineticText, Kicker } from "../components/KineticText";
import { SceneArea, clamp01, fmt } from "../components/layout";
import { useCue } from "../scene-context";
import { COLOR, EASE, FONT, TIMING, TYPE } from "../theme";

export type BarrasProps = {
  kicker?: string;
  titulo: string;
  unidad?: string;
  prefijo?: string;
  decimales?: number;
  items: { etiqueta: string; valor: number; resaltar?: boolean }[];
  cue?: string;
  locale?: string;
};

/** Barras horizontales que crecen escalonadas; una resaltada en acento. */
export const Barras: React.FC<BarrasProps> = ({
  kicker,
  titulo,
  unidad = "",
  prefijo = "",
  decimales = 0,
  items,
  cue,
  locale,
}) => {
  const frame = useCurrentFrame();
  const start = useCue(cue, 20);
  const max = Math.max(...items.map((i) => i.valor), 1);

  return (
    <SceneArea gap={44}>
      {kicker ? <Kicker text={kicker} /> : null}
      <KineticText text={titulo} size={TYPE.h2} delay={2} />
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {items.map((it, i) => {
          const s = start + i * 6;
          const p = interpolate(frame, [s, s + TIMING.dataIn], [0, 1], {
            ...clamp01,
            easing: EASE.data,
          });
          const lab = interpolate(frame, [s - 6, s + 8], [0, 1], {
            ...clamp01,
            easing: EASE.text,
          });
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: FONT.display,
                  fontSize: TYPE.label + 4,
                  fontWeight: 600,
                  color: COLOR.ink,
                  opacity: lab,
                }}
              >
                <span>{it.etiqueta}</span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: it.resaltar ? COLOR.accent : COLOR.ink,
                  }}
                >
                  {prefijo}
                  {fmt(it.valor * p, decimales, locale)}
                  {unidad}
                </span>
              </div>
              <div
                style={{
                  height: 46,
                  borderRadius: 10,
                  background: "rgba(21,23,28,0.07)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(it.valor / max) * 100 * p}%`,
                    background: it.resaltar ? COLOR.accent : COLOR.ink,
                    borderRadius: 10,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SceneArea>
  );
};
