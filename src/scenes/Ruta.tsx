import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../components/Icon";
import { KineticText, Kicker } from "../components/KineticText";
import { clamp01, SceneArea } from "../components/layout";
import { useScene } from "../scene-context";
import { COLOR, EASE, FONT, TYPE } from "../theme";

export type RutaProps = {
  kicker?: string;
  titulo: string;
  /** Pasos de un proceso; cada uno se enciende cuando la voz dice su `cue`. */
  pasos: { icono?: string; texto: string; detalle?: string; cue?: string }[];
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");

const NODE = 104;

/**
 * Diagrama de proceso vertical: nodos conectados por una línea que se dibuja
 * y un pulso de acento que "viaja" de un paso al siguiente (la señal).
 */
export const Ruta: React.FC<RutaProps> = ({ kicker, titulo, pasos }) => {
  const frame = useCurrentFrame();
  const { palabras, audioStartFrame, audioFrames, fps } = useScene();

  // Frame de cada paso: su palabra clave, buscando en orden después del anterior.
  const at: number[] = [];
  let from = 0;
  pasos.forEach((p, i) => {
    const fallback = 14 + Math.round((i * audioFrames * 0.85) / Math.max(1, pasos.length));
    let f = fallback;
    if (p.cue) {
      const idx = palabras.findIndex((w, j) => j >= from && norm(w.text) === norm(p.cue!));
      if (idx >= 0) {
        f = audioStartFrame + Math.round((palabras[idx].startMs / 1000) * fps);
        from = idx + 1;
      }
    }
    at.push(Math.max(f, (at[i - 1] ?? -99) + 8));
  });

  const rowH = Math.min(150, Math.floor(700 / Math.max(1, pasos.length)));

  return (
    <SceneArea gap={36}>
      {kicker ? <Kicker text={kicker} /> : null}
      <KineticText text={titulo} size={TYPE.h2} delay={2} />
      <div style={{ position: "relative", height: rowH * pasos.length }}>
        {/* conectores */}
        {pasos.slice(0, -1).map((_, i) => {
          const p = interpolate(frame, [at[i], at[i + 1]], [0, 1], { ...clamp01, easing: EASE.data });
          const y0 = i * rowH + NODE / 2;
          const len = rowH;
          return (
            <div key={`c${i}`}>
              <div
                style={{
                  position: "absolute",
                  left: NODE / 2 - 3,
                  top: y0,
                  width: 6,
                  height: len,
                  background: COLOR.line,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: NODE / 2 - 3,
                  top: y0,
                  width: 6,
                  height: len * p,
                  background: COLOR.accent,
                }}
              />
              {p > 0 && p < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: NODE / 2 - 14,
                    top: y0 + len * p - 14,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: COLOR.accent,
                    boxShadow: `0 0 0 10px rgba(255,74,28,0.22)`,
                  }}
                />
              ) : null}
            </div>
          );
        })}
        {pasos.map((paso, i) => {
          const on = interpolate(frame, [at[i], at[i] + 12], [0, 1], { ...clamp01, easing: EASE.text });
          const pulse = interpolate(frame, [at[i], at[i] + 16], [0, 1], clamp01);
          const active = frame >= at[i] && (i === pasos.length - 1 || frame < at[i + 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: i * rowH,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                gap: 30,
                height: NODE,
              }}
            >
              <div
                style={{
                  width: NODE,
                  height: NODE,
                  flexShrink: 0,
                  borderRadius: NODE / 2,
                  background: on > 0.5 ? (active ? COLOR.accent : COLOR.ink) : COLOR.bg,
                  border: `5px solid ${on > 0.05 ? (active ? COLOR.accent : COLOR.ink) : COLOR.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${0.85 + on * 0.15 + Math.sin(pulse * Math.PI) * 0.08})`,
                  position: "relative",
                }}
              >
                <Icon name={paso.icono ?? "check"} size={60} delay={at[i]} color={on > 0.5 ? COLOR.bg : COLOR.ink} />
              </div>
              <div
                style={{
                  opacity: 0.25 + on * 0.75,
                  transform: `translateX(${(1 - on) * 30}px)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.display,
                    fontWeight: 800,
                    fontSize: 46,
                    lineHeight: 1.05,
                    color: active ? COLOR.accent : COLOR.ink,
                  }}
                >
                  {paso.texto}
                </div>
                {paso.detalle ? (
                  <div style={{ fontFamily: FONT.mono, fontSize: 25, color: COLOR.inkSoft, lineHeight: 1.3 }}>
                    {paso.detalle}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </SceneArea>
  );
};
