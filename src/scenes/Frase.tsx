import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { clamp01, SceneArea } from "../components/layout";
import { COLOR, EASE, FONT, TYPE } from "../theme";

export type FraseProps = { texto: string; autor?: string };

/** Frase grande (idea clave o cita). Usa **palabra** para el acento. */
export const Frase: React.FC<FraseProps> = ({ texto, autor }) => {
  const frame = useCurrentFrame();
  const words = texto.split(/\s+/).length;
  const at = 8 + words * 3 + 6;
  const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp01, easing: EASE.text });
  const mark = interpolate(frame, [0, 18], [0, 1], { ...clamp01, easing: EASE.icon });
  return (
    <SceneArea gap={30}>
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 260,
          lineHeight: 0.6,
          height: 120,
          color: COLOR.accent,
          transform: `scale(${mark})`,
          transformOrigin: "left bottom",
        }}
      >
        “
      </div>
      <KineticText text={texto} size={TYPE.h1 - 8} delay={6} weight={800} lineHeight={1.06} />
      {autor ? (
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 32,
            fontWeight: 500,
            color: COLOR.inkSoft,
            opacity: p,
            letterSpacing: 2,
          }}
        >
          — {autor}
        </div>
      ) : null}
    </SceneArea>
  );
};
