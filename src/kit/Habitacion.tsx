import React, { useId } from "react";
import { sombreado, tono } from "./colores";

/**
 * Habitación en perspectiva 2.5D (pared del fondo + laterales + piso + techo),
 * como la celda rosa. Ocupa el lienzo 1080×1920. Opcional: ladrillo, ventana
 * con barrotes y lámpara.
 */
export const Habitacion: React.FC<{
  pared: string;
  piso?: string;
  techo?: string;
  ladrillo?: boolean;
  barrotes?: boolean;
  lampara?: boolean;
  /** Fondo del rectángulo de la pared trasera (en pantalla). */
  fondo?: { x: number; y: number; w: number; h: number };
}> = ({
  pared,
  piso = "#C9CCD3",
  techo,
  ladrillo = true,
  barrotes = false,
  lampara = true,
  fondo = { x: 170, y: 420, w: 740, h: 900 },
}) => {
  const id = useId().replace(/:/g, "");
  const s = sombreado(pared);
  const W = 1080;
  const H = 2600; // se extiende bajo el cuadro: la cámara puede subir el encuadre sin dejar huecos
  const { x, y, w, h } = fondo;
  const t = techo ?? tono(pared, 0.08);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <pattern id={`lad${id}`} width={120} height={60} patternUnits="userSpaceOnUse">
          <rect width={120} height={60} fill="transparent" />
          <path d="M0 30 H120 M0 60 H120 M60 0 V30 M0 30 V60 M120 30 V60" stroke={s.contorno} strokeWidth={4} opacity={0.35} />
        </pattern>
        <linearGradient id={`luz${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {/* techo */}
      <path d={`M0 0 H${W} L${x + w} ${y} H${x} Z`} fill={t} />
      {/* laterales */}
      <path d={`M0 0 L${x} ${y} V${y + h} L0 ${H} Z`} fill={s.sombra} />
      <path d={`M${W} 0 L${x + w} ${y} V${y + h} L${W} ${H} Z`} fill={s.sombra} />
      {ladrillo ? (
        <>
          <path d={`M0 0 L${x} ${y} V${y + h} L0 ${H} Z`} fill={`url(#lad${id})`} opacity={0.6} />
          <path d={`M${W} 0 L${x + w} ${y} V${y + h} L${W} ${H} Z`} fill={`url(#lad${id})`} opacity={0.6} />
        </>
      ) : null}
      {/* pared trasera */}
      <rect x={x} y={y} width={w} height={h} fill={s.base} />
      {ladrillo ? <rect x={x} y={y} width={w} height={h} fill={`url(#lad${id})`} /> : null}
      <rect x={x} y={y} width={w} height={h} fill={`url(#luz${id})`} />
      {/* piso */}
      <path d={`M${x} ${y + h} H${x + w} L${W} ${H} H0 Z`} fill={piso} />
      <path d={`M${x} ${y + h} H${x + w} L${W} ${H} H0 Z`} fill={`url(#luz${id})`} />
      {barrotes ? (
        <g>
          <rect x={x + w / 2 - 110} y={y + 150} width={220} height={150} rx={8} fill="#4B4F6B" stroke={tono(pared, -0.3)} strokeWidth={8} />
          {new Array(7).fill(0).map((_, i) => (
            <rect key={i} x={x + w / 2 - 96 + i * 30} y={y + 156} width={10} height={138} fill="#D5DCE4" />
          ))}
        </g>
      ) : null}
      {lampara ? (
        <g>
          <path d={`M${W / 2 - 160} 140 h320 l-30 40 h-260 Z`} fill="#E9EEF3" stroke="#9AA3AE" strokeWidth={4} />
          {new Array(9).fill(0).map((_, i) => (
            <rect key={i} x={W / 2 - 140 + i * 32} y={148} width={18} height={22} fill="#FFFFFF" />
          ))}
        </g>
      ) : null}
    </svg>
  );
};
