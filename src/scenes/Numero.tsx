import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { KineticText, Kicker } from "../components/KineticText";
import { SceneArea, clamp01, fmt } from "../components/layout";
import { useCue } from "../scene-context";
import { COLOR, EASE, FONT, TIMING, TYPE } from "../theme";

export type NumeroProps = {
  kicker?: string;
  valor: number;
  desde?: number;
  prefijo?: string;
  sufijo?: string;
  decimales?: number;
  etiqueta: string;
  /** Palabra de la narración en la que arranca el conteo. */
  cue?: string;
  locale?: string;
};

/** Cifra protagonista con conteo de números tabulares. */
export const Numero: React.FC<NumeroProps> = ({
  kicker,
  valor,
  desde = 0,
  prefijo = "",
  sufijo = "",
  decimales = 0,
  etiqueta,
  cue,
  locale,
}) => {
  const frame = useCurrentFrame();
  const start = useCue(cue, 14);
  const p = interpolate(frame, [start, start + TIMING.dataIn + 10], [0, 1], {
    ...clamp01,
    easing: EASE.data,
  });
  const appear = interpolate(frame, [start - 8, start + 6], [0, 1], {
    ...clamp01,
    easing: EASE.text,
  });
  const done = interpolate(
    frame,
    [start + TIMING.dataIn + 10, start + TIMING.dataIn + 22],
    [0, 1],
    { ...clamp01, easing: EASE.icon },
  );
  const current = desde + (valor - desde) * p;
  const text = `${prefijo}${fmt(current, decimales, locale)}${sufijo}`;
  const fontSize = Math.min(TYPE.number, Math.floor(1700 / Math.max(4, text.length)));

  return (
    <SceneArea gap={30}>
      {kicker ? <Kicker text={kicker} /> : null}
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize,
          lineHeight: 0.95,
          letterSpacing: -fontSize * 0.04,
          fontVariantNumeric: "tabular-nums",
          opacity: appear,
          transform: `translateY(${(1 - appear) * 40}px) scale(${1 + Math.sin(done * Math.PI) * 0.035})`,
          color: done > 0.5 ? COLOR.accent : COLOR.ink,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
      <div
        style={{
          height: 10,
          width: `${p * 100}%`,
          background: COLOR.accent,
          borderRadius: 6,
        }}
      />
      <KineticText
        text={etiqueta}
        size={TYPE.h2}
        weight={600}
        delay={start + 6}
        color={COLOR.ink}
      />
    </SceneArea>
  );
};
