import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { COLOR } from "./theme";
import type { TransitionType } from "./types";

type PanelProps = { color: string };

/**
 * Familia 1 — "panel": un bloque de acento barre la pantalla de abajo
 * hacia arriba, tapa la escena saliente y destapa la entrante.
 */
const PanelPresentation: React.FC<
  TransitionPresentationComponentProps<PanelProps>
> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const p = Easing.bezier(0.77, 0, 0.18, 1)(presentationProgress);
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{
          // Una vez tapada por el panel, la escena saliente desaparece.
          opacity: p < 0.5 ? 1 : 0,
          transform: `translateY(${-interpolate(p, [0, 0.5], [0, 120], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  const coverTop = interpolate(p, [0, 0.5], [100, 0], {
    extrapolateRight: "clamp",
  });
  const coverBottom = interpolate(p, [0.5, 1], [0, 100], {
    extrapolateLeft: "clamp",
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: p >= 0.5 ? 1 : 0,
          transform: `translateY(${interpolate(p, [0.5, 1], [140, 0], { extrapolateLeft: "clamp" })}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: passedProps.color,
          top: `${coverTop}%`,
          bottom: `${coverBottom}%`,
          height: "auto",
        }}
      />
    </AbsoluteFill>
  );
};

const panel = (color: string = COLOR.accent): TransitionPresentation<PanelProps> => ({
  component: PanelPresentation,
  props: { color },
});

type ZoomProps = { dir: "in" | "out" };

/**
 * Familia "zoom": la cámara atraviesa la imagen. "in" = entramos (lo que sale
 * crece y se desvanece, lo nuevo llega desde pequeño); "out" = al revés.
 */
const ZoomPresentation: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = Easing.bezier(0.6, 0, 0.3, 1)(presentationProgress);
  const into = passedProps.dir === "in";
  if (presentationDirection === "exiting") {
    const s = into ? 1 + p * 2.2 : 1 - p * 0.6;
    return (
      <AbsoluteFill style={{ transform: `scale(${s})`, opacity: 1 - p, filter: `blur(${p * 10}px)` }}>
        {children}
      </AbsoluteFill>
    );
  }
  const s = into ? 0.55 + p * 0.45 : 2.2 - p * 1.2;
  return (
    <AbsoluteFill style={{ transform: `scale(${s})`, opacity: p, filter: `blur(${(1 - p) * 10}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

const zoom = (dir: "in" | "out"): TransitionPresentation<ZoomProps> => ({
  component: ZoomPresentation,
  props: { dir },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPresentation = TransitionPresentation<any>;

export const getTransition = (t: TransitionType, frames: number) => {
  const timing = linearTiming({ durationInFrames: frames });
  let presentation: AnyPresentation | null = null;
  if (t === "panel") presentation = panel();
  if (t === "deslizar") presentation = slide({ direction: "from-bottom" });
  if (t === "fundido") presentation = fade();
  if (t === "zoom") presentation = zoom("in");
  if (t === "zoom-out") presentation = zoom("out");
  return presentation ? { presentation, timing } : null;
};
