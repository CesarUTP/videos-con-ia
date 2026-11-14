import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../components/Icon";
import { KineticText, Kicker } from "../components/KineticText";
import { clamp01, SceneArea } from "../components/layout";
import { useScene } from "../scene-context";
import { COLOR, EASE, FONT, TYPE } from "../theme";

export type ListaProps = {
  kicker?: string;
  titulo: string;
  items: { icono?: string; texto: string; cue?: string }[];
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");

/** Lista con íconos que se dibujan; cada ítem entra cuando la voz lo nombra. */
export const Lista: React.FC<ListaProps> = ({ kicker, titulo, items }) => {
  const frame = useCurrentFrame();
  const { palabras, audioStartFrame, fps, audioFrames } = useScene();
  const cueFrame = (w: string | undefined, fb: number) => {
    if (!w) return fb;
    const hit = palabras.find((p) => norm(p.text) === norm(w));
    return hit ? audioStartFrame + Math.round((hit.startMs / 1000) * fps) : fb;
  };
  const spacing = Math.max(14, Math.floor((audioFrames * 0.7) / Math.max(1, items.length)));

  return (
    <SceneArea gap={44}>
      {kicker ? <Kicker text={kicker} /> : null}
      <KineticText text={titulo} size={TYPE.h2} delay={2} />
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        {items.map((it, i) => {
          const at = cueFrame(it.cue, 18 + i * spacing);
          const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp01, easing: EASE.text });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 30,
                opacity: p,
                transform: `translateX(${(1 - p) * 60}px)`,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  flexShrink: 0,
                  borderRadius: 28,
                  background: i % 2 === 0 ? COLOR.ink : COLOR.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={it.icono ?? "check"} size={72} delay={at + 2} color={COLOR.bg} />
              </div>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 600,
                  fontSize: TYPE.body + 4,
                  lineHeight: 1.12,
                  color: COLOR.ink,
                }}
              >
                {it.texto}
              </div>
            </div>
          );
        })}
      </div>
    </SceneArea>
  );
};
