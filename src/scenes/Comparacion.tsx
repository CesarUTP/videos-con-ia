import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "../components/Icon";
import { KineticText, Kicker } from "../components/KineticText";
import { clamp01, SceneArea } from "../components/layout";
import { useCue } from "../scene-context";
import { COLOR, EASE, FONT, SPRING, TYPE } from "../theme";

type Lado = { titulo: string; valor?: string; nota?: string; icono?: string };

export type ComparacionProps = {
  kicker?: string;
  titulo?: string;
  a: Lado;
  b: Lado;
  /** Cuál lado "gana" (se pinta con el acento). */
  ganador?: "a" | "b";
  /** Palabras en las que aparece cada lado. */
  cueA?: string;
  cueB?: string;
};

const Card: React.FC<{ lado: Lado; at: number; win: boolean }> = ({ lado, at, win }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: SPRING.icon });
  const fill = win ? COLOR.accent : "rgba(21,23,28,0.06)";
  const fg = win ? COLOR.accentInk : COLOR.ink;
  return (
    <div
      style={{
        flex: 1,
        background: fill,
        borderRadius: 28,
        padding: "40px 34px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        border: win ? "none" : `3px solid ${COLOR.line}`,
        transform: `translateY(${(1 - s) * 80}px)`,
        opacity: interpolate(s, [0, 0.4], [0, 1], clamp01),
        minHeight: 520,
      }}
    >
      {lado.icono ? <Icon name={lado.icono} size={92} delay={at + 4} color={fg} /> : null}
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: fg, lineHeight: 1 }}>
        {lado.titulo}
      </div>
      {lado.valor ? (
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 92,
            color: fg,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          {lado.valor}
        </div>
      ) : null}
      {lado.nota ? (
        <div style={{ fontFamily: FONT.display, fontSize: 36, lineHeight: 1.2, color: fg, opacity: 0.85 }}>
          {lado.nota}
        </div>
      ) : null}
    </div>
  );
};

export const Comparacion: React.FC<ComparacionProps> = ({ kicker, titulo, a, b, ganador, cueA, cueB }) => {
  const frame = useCurrentFrame();
  const atA = useCue(cueA, 10);
  const atB = useCue(cueB, atA + 24);
  const vs = interpolate(frame, [atB - 6, atB + 8], [0, 1], { ...clamp01, easing: EASE.icon });
  return (
    <SceneArea gap={40}>
      {kicker ? <Kicker text={kicker} /> : null}
      {titulo ? <KineticText text={titulo} size={TYPE.h2} delay={2} /> : null}
      <div style={{ display: "flex", gap: 28, position: "relative", alignItems: "stretch" }}>
        <Card lado={a} at={atA} win={ganador === "a"} />
        <Card lado={b} at={atB} win={ganador === "b"} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 30,
            width: 96,
            height: 96,
            marginLeft: -48,
            borderRadius: 48,
            background: COLOR.ink,
            color: COLOR.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT.mono,
            fontWeight: 700,
            fontSize: 34,
            transform: `scale(${vs}) rotate(${(1 - vs) * -90}deg)`,
          }}
        >
          VS
        </div>
      </div>
    </SceneArea>
  );
};
