import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { KineticText, Kicker } from "../components/KineticText";
import { SceneArea, clamp01 } from "../components/layout";
import { Ilustracion, type IlustracionProps } from "../illustrations";
import { COLOR, EASE, FONT, TYPE } from "../theme";

export type GanchoProps = {
  kicker?: string;
  /** Usa **palabra** para el acento. */
  titulo: string;
  sub?: string;
  /** Ilustración animada opcional bajo el titular. */
  ilustracion?: IlustracionProps;
};

/** Escena 1: pregunta o tensión en 1-2 s. Entra desde el frame 0. */
export const Gancho: React.FC<GanchoProps> = ({ kicker, titulo, sub, ilustracion }) => {
  const frame = useCurrentFrame();
  const words = titulo.split(/\s+/).length;
  const subStart = 6 + words * 3 + 10;
  const sp = interpolate(frame, [subStart, subStart + 18], [0, 1], {
    ...clamp01,
    easing: EASE.text,
  });
  return (
    <SceneArea gap={ilustracion ? 28 : 40}>
      {kicker ? <Kicker text={kicker} delay={0} /> : null}
      <KineticText text={titulo} size={ilustracion ? TYPE.h1 : TYPE.hero} delay={4} />
      {sub ? (
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 400,
            fontSize: TYPE.body - (ilustracion ? 6 : 0),
            lineHeight: 1.25,
            color: COLOR.inkSoft,
            opacity: sp,
            transform: `translateY(${(1 - sp) * 24}px)`,
            maxWidth: 820,
          }}
        >
          {sub}
        </div>
      ) : null}
      {ilustracion ? <Ilustracion alto={420} {...ilustracion} /> : null}
    </SceneArea>
  );
};
