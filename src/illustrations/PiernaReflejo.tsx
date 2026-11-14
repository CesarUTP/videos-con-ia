import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp01 } from "../components/layout";
import { COLOR, EASE, FONT } from "../theme";

/**
 * Pierna sentada vista de perfil: el martillo golpea el tendón rotuliano,
 * el cuádriceps se ilumina y la pierna patea (oscilación amortiguada).
 * `golpe` = frame (relativo a la escena) del impacto.
 */
export const PiernaReflejo: React.FC<{ golpe: number; height?: number; etiquetas?: boolean }> = ({
  golpe,
  height = 470,
  etiquetas = true,
}) => {
  const frame = useCurrentFrame();
  const t = frame - golpe;

  // Martillo: se levanta antes del golpe, impacta y rebota.
  const raise = interpolate(frame, [golpe - 22, golpe - 6], [0, 1], { ...clamp01, easing: EASE.text });
  const strike = interpolate(frame, [golpe - 6, golpe], [0, 1], { ...clamp01, easing: EASE.exit });
  const recoil = interpolate(frame, [golpe, golpe + 14], [0, 1], { ...clamp01, easing: EASE.text });
  const hammerAngle = -28 * raise * (1 - strike) + -16 * recoil * strike;
  const hammerIn = interpolate(frame, [golpe - 34, golpe - 20], [0, 1], { ...clamp01, easing: EASE.text });

  // Patada: retardo de ~3 frames (el reflejo), oscilación amortiguada.
  const k = t - 3;
  const kick = k <= 0 ? 0 : Math.exp(-k / 11) * Math.sin((k * Math.PI) / 13);
  const shinAngle = -34 * kick;
  const contraction = k <= 0 ? 0 : Math.min(1, Math.exp(-k / 14) * 1.4);

  const ring = interpolate(t, [0, 14], [0, 1], clamp01);
  const label = interpolate(frame, [golpe + 2, golpe + 14], [0, 1], { ...clamp01, easing: EASE.text });

  const knee = { x: 470, y: 170 };

  return (
    <svg viewBox="0 0 880 520" style={{ width: "100%", height, overflow: "visible" }}>
      {/* asiento */}
      <path d="M40 228 H520" stroke={COLOR.inkSoft} strokeWidth={6} strokeLinecap="round" opacity={0.4} />
      {/* muslo */}
      <path d={`M90 168 L${knee.x} ${knee.y}`} stroke={COLOR.ink} strokeWidth={84} strokeLinecap="round" />
      {/* cuádriceps (se ilumina al contraerse) */}
      <path
        d={`M150 146 Q290 118 ${knee.x - 40} 146`}
        stroke={COLOR.accent}
        strokeWidth={26}
        strokeLinecap="round"
        fill="none"
        opacity={0.15 + contraction * 0.85}
      />
      {/* pierna (rota sobre la rodilla) */}
      <g transform={`rotate(${shinAngle} ${knee.x} ${knee.y})`}>
        <path d={`M${knee.x} ${knee.y} L${knee.x} 450`} stroke={COLOR.ink} strokeWidth={62} strokeLinecap="round" />
        <path d={`M${knee.x - 6} 462 L${knee.x + 92} 472`} stroke={COLOR.ink} strokeWidth={40} strokeLinecap="round" />
      </g>
      {/* rótula */}
      <circle cx={knee.x + 30} cy={knee.y - 4} r={20} fill={COLOR.bg} stroke={COLOR.ink} strokeWidth={6} />
      {/* punto de impacto: tendón rotuliano */}
      <circle cx={knee.x + 34} cy={knee.y + 52} r={10 + ring * 70} fill="none" stroke={COLOR.accent} strokeWidth={6 * (1 - ring)} />
      {/* martillo */}
      <g opacity={hammerIn} transform={`rotate(${hammerAngle} 790 360)`}>
        <path d="M790 360 L560 240" stroke={COLOR.inkSoft} strokeWidth={14} strokeLinecap="round" />
        <path d="M528 196 L572 280" stroke={COLOR.accent} strokeWidth={34} strokeLinecap="round" />
      </g>
      {etiquetas ? (
        <g opacity={label} fontFamily={FONT.mono} fontSize={30} fontWeight={700}>
          <path d={`M${knee.x + 40} ${knee.y + 64} L${knee.x + 120} ${knee.y + 260} H860`} stroke={COLOR.ink} strokeWidth={3} fill="none" />
          <text x={knee.x + 128} y={knee.y + 248} fill={COLOR.ink}>
            TENDÓN ROTULIANO
          </text>
          <path d="M290 112 L320 40 H660" stroke={COLOR.accent} strokeWidth={3} fill="none" opacity={contraction > 0.05 ? 1 : 0.3} />
          <text x={328} y={30} fill={COLOR.accent}>
            CUÁDRICEPS SE CONTRAE
          </text>
        </g>
      ) : null}
    </svg>
  );
};
