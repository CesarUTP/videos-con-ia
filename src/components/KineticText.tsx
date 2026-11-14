import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLOR, EASE, FONT, TIMING } from "../theme";

type Token = { text: string; strong: boolean };

/** "El **promedio** engaña" -> tokens; ** marca palabras de acento. */
export const parseEmphasis = (text: string): Token[] => {
  const out: Token[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  for (const part of parts) {
    const strong = part.startsWith("**") && part.endsWith("**");
    const clean = strong ? part.slice(2, -2) : part;
    const words = clean.split(/\s+/).filter(Boolean);
    // Puntuación pegada al acento ("**promedio**?") se une a la palabra previa.
    if (!strong && out.length && /^[?!.,;:…»”)]/.test(clean)) {
      out[out.length - 1].text += words.shift() ?? "";
    }
    for (const w of words) {
      out.push({ text: w, strong });
    }
  }
  return out;
};

/**
 * Texto cinético: cada palabra sube desde una máscara, escalonada.
 * Las palabras con **acento** reciben color de acento y un subrayado
 * que se dibuja DESPUÉS de que la palabra entra (pausa de revelación).
 */
export const KineticText: React.FC<{
  text: string;
  delay?: number;
  size: number;
  weight?: number;
  color?: string;
  align?: "left" | "center";
  lineHeight?: number;
  maxWidth?: number;
  stagger?: number;
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  size,
  weight = 800,
  color = COLOR.ink,
  align = "left",
  lineHeight = 1.02,
  maxWidth,
  stagger = TIMING.stagger,
  style,
}) => {
  const frame = useCurrentFrame();
  const tokens = parseEmphasis(text);

  return (
    <div
      style={{
        fontFamily: FONT.display,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        letterSpacing: -size * 0.035,
        color,
        textAlign: align,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.24,
        maxWidth,
        ...style,
      }}
    >
      {tokens.map((t, i) => {
        const start = delay + i * stagger;
        const p = interpolate(frame, [start, start + TIMING.textIn], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.text,
        });
        const underline = interpolate(
          frame,
          [start + TIMING.textIn * 0.6, start + TIMING.textIn * 0.6 + 14],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE.data,
          },
        );
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: size * 0.12,
              marginBottom: -size * 0.12,
              position: "relative",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 105}%) rotate(${(1 - p) * 4}deg)`,
                transformOrigin: "left bottom",
                color: t.strong ? COLOR.accent : undefined,
              }}
            >
              {t.text}
            </span>
            {t.strong ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: size * 0.06,
                  height: Math.max(6, size * 0.07),
                  background: COLOR.accent,
                  transform: `scaleX(${underline})`,
                  transformOrigin: "left center",
                  borderRadius: 4,
                }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

/** Etiqueta pequeña mono (kicker) con línea de acento que se dibuja. */
export const Kicker: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.text,
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        fontFamily: FONT.mono,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: 5,
        textTransform: "uppercase",
        color: COLOR.accent,
        opacity: p,
        transform: `translateX(${(1 - p) * -30}px)`,
      }}
    >
      <span
        style={{
          width: 64 * p,
          height: 5,
          background: COLOR.accent,
          display: "inline-block",
        }}
      />
      {text}
    </div>
  );
};
