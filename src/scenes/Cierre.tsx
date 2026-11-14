import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { KineticText, Kicker } from "../components/KineticText";
import { clamp01, SceneArea } from "../components/layout";
import { Ilustracion, type IlustracionProps } from "../illustrations";
import { COLOR, EASE, FONT, TYPE } from "../theme";

export type CierreProps = {
  kicker?: string;
  /** Payoff que reconecta con el gancho (bucle). */
  titulo: string;
  /** Fuente verificable. Se muestra SIEMPRE en el último cuadro. */
  fuente?: string;
  cta?: string;
  /** Ilustración que repite la del gancho (cierra el bucle). */
  ilustracion?: IlustracionProps;
};

export const Cierre: React.FC<CierreProps> = ({ kicker, titulo, fuente, cta, ilustracion }) => {
  const frame = useCurrentFrame();
  const words = titulo.split(/\s+/).length;
  const at = 6 + words * 3 + 8;
  const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp01, easing: EASE.text });
  return (
    <SceneArea gap={40}>
      {kicker ? <Kicker text={kicker} /> : null}
      <KineticText text={titulo} size={TYPE.h1} delay={4} />
      {cta ? (
        <div
          style={{
            alignSelf: "flex-start",
            padding: "16px 28px",
            borderRadius: 16,
            background: COLOR.ink,
            color: COLOR.bg,
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 40,
            opacity: p,
            transform: `translateY(${(1 - p) * 20}px)`,
          }}
        >
          {cta}
        </div>
      ) : null}
      {ilustracion ? <Ilustracion alto={210} etiquetas={false} {...ilustracion} /> : null}
      {fuente ? (
        <div
          style={{
            borderTop: `3px solid ${COLOR.ink}`,
            paddingTop: 20,
            fontFamily: FONT.mono,
            fontSize: 28,
            lineHeight: 1.4,
            color: COLOR.inkSoft,
            opacity: p,
          }}
        >
          <span style={{ color: COLOR.accent, fontWeight: 700 }}>FUENTE · </span>
          {fuente}
        </div>
      ) : null}
    </SceneArea>
  );
};
