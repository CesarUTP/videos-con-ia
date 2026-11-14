import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLOR, EASE } from "../theme";

/**
 * Íconos de trazo constante (retícula 48x48, trazo 3.2). Un solo estilo.
 * Se "dibujan" con strokeDashoffset (pathLength=1) al aparecer.
 */
const PATHS: Record<string, string[]> = {
  persona: ["M24 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "M9 42c1.5-8 7.5-12 15-12s13.5 4 15 12"],
  dinero: [
    "M6 14h36v20H6Z",
    "M24 29a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
    "M11 19v10M37 19v10",
  ],
  grafico: ["M8 40V8", "M8 40h32", "M15 32V24M23 32V16M31 32V20M39 32V11"],
  alerta: ["M24 6 44 40H4Z", "M24 18v10", "M24 33v1"],
  check: ["M24 44a20 20 0 1 0 0-40 20 20 0 0 0 0 40Z", "m15 24 6 6 12-13"],
  cruz: ["M24 44a20 20 0 1 0 0-40 20 20 0 0 0 0 40Z", "m17 17 14 14M31 17 17 31"],
  rayo: ["M27 4 9 27h14l-2 17 18-23H25Z"],
  reloj: ["M24 44a20 20 0 1 0 0-40 20 20 0 0 0 0 40Z", "M24 13v11l8 5"],
  lupa: ["M21 34a13 13 0 1 0 0-26 13 13 0 0 0 0 26Z", "m31 31 11 11"],
  flecha: ["M8 24h30", "m28 14 10 10-10 10"],
  estrella: ["m24 5 5.8 12 13.2 1.9-9.5 9.3 2.2 13.1L24 35l-11.8 6.3 2.3-13.1L5 18.9 18.2 17Z"],
  cerebro: [
    "M20 8a6 6 0 0 0-6 6 6 6 0 0 0-5 9 6 6 0 0 0 3 10 6 6 0 0 0 8 7V8Z",
    "M28 8a6 6 0 0 1 6 6 6 6 0 0 1 5 9 6 6 0 0 1-3 10 6 6 0 0 1-8 7V8Z",
  ],
  mundo: [
    "M24 44a20 20 0 1 0 0-40 20 20 0 0 0 0 40Z",
    "M4 24h40",
    "M24 4c6 6 8 13 8 20s-2 14-8 20c-6-6-8-13-8-20s2-14 8-20Z",
  ],
  libro: ["M8 8h13a5 5 0 0 1 5 5v29a4 4 0 0 0-4-4H8Z", "M40 8H29a5 5 0 0 0-5 5v29a4 4 0 0 1 4-4h12Z"],
  balanza: ["M24 6v36", "M14 42h20", "M8 14h32", "m8 14-5 12a6 6 0 0 0 10 0Z", "m40 14-5 12a6 6 0 0 0 10 0Z"],
  martillo: ["M8 42 27 23", "m21 15 10-10 12 12-10 10Z"],
  neurona: [
    "M18 24a6 6 0 1 0 12 0a6 6 0 1 0-12 0Z",
    "M19.5 20 12 11M18.5 26.5 8 31M22 18.5 20 8",
    "M30 24h9M39 24l5-5M39 24l5 5",
  ],
  musculo: ["M5 24c7-13 31-13 38 0-7 13-31 13-38 0Z", "M12 24h24M14 19h20M14 29h20"],
  columna: ["M17 5h14v8H17Z", "M17 18h14v8H17Z", "M17 31h14v8H17Z", "M24 13v5M24 26v5M24 39v5"],
};

export type IconName = keyof typeof PATHS;
export const ICONS = Object.keys(PATHS);

export const Icon: React.FC<{
  name: string;
  size?: number;
  delay?: number;
  color?: string;
  strokeWidth?: number;
}> = ({ name, size = 96, delay = 0, color = COLOR.ink, strokeWidth = 3.2 }) => {
  const frame = useCurrentFrame();
  const paths = PATHS[name] ?? PATHS.estrella;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {paths.map((d, i) => {
        const start = delay + i * 4;
        const p = interpolate(frame, [start, start + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.data,
        });
        return (
          <path
            key={i}
            d={d}
            pathLength={1}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            strokeDashoffset={1 - p}
          />
        );
      })}
    </svg>
  );
};
