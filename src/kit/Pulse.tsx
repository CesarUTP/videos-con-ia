import { getLength, getPointAtLength } from "@remotion/paths";
import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useEstilo } from "../estilos";
import { EASE } from "../theme";

/**
 * Señal que VIAJA por una ruta SVG: la ruta tenue siempre visible, un tramo
 * brillante que avanza con estela y una "cabeza" luminosa.
 * Úsalo dentro de un <svg> que tenga <GlowDefs/>.
 */
export const Pulse: React.FC<{
  d: string;
  start: number;
  duration: number;
  color?: string;
  width?: number;
  /** Fracción de la ruta que ocupa la estela (0-1). */
  tail?: number;
  /** Deja la ruta encendida después de pasar la señal. */
  keepLit?: boolean;
  showTrack?: boolean;
}> = ({
  d,
  start,
  duration,
  color,
  width = 6,
  tail = 0.22,
  keepLit = true,
  showTrack = true,
}) => {
  const frame = useCurrentFrame();
  const e = useEstilo();
  color = color ?? e.energia;
  const hot = e.energiaNucleo;
  const len = useMemo(() => getLength(d), [d]);
  const p = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.data,
  });
  const head = p * len;
  const pt = p > 0 && p < 1 ? getPointAtLength(d, head) : null;
  const tailLen = len * tail;
  const after = interpolate(frame, [start + duration, start + duration + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <g>
      {showTrack ? (
        <path d={d} stroke={color} strokeOpacity={0.18} strokeWidth={width} fill="none" strokeLinecap="round" />
      ) : null}
      {keepLit ? (
        <path
          d={d}
          stroke={color}
          strokeOpacity={0.55 * (1 - after * 0.4)}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${head} ${len}`}
        />
      ) : null}
      {p > 0 && p < 1 ? (
        <>
          <path
            d={d}
            stroke={hot}
            strokeWidth={width * 1.6}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(tailLen, head)} ${len * 2}`}
            strokeDashoffset={-(head - Math.min(tailLen, head))}
            filter="url(#glow)"
          />
          {pt ? (
            <>
              <circle cx={pt.x} cy={pt.y} r={width * 4} fill={color} opacity={0.35} filter="url(#glowBig)" />
              <circle cx={pt.x} cy={pt.y} r={width * 1.7} fill={hot} filter="url(#glow)" />
            </>
          ) : null}
        </>
      ) : null}
    </g>
  );
};

/** Filtros de brillo compartidos. Ponlo una vez dentro de cada <svg>. */
export const GlowDefs: React.FC = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glowBig" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" />
    </filter>
  </defs>
);
