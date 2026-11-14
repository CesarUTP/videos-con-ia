import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useEstilo } from "../estilos";
import { FONT } from "../theme";
import { Sfx } from "./Sfx";

/** Posiciones fijas de las pastillas (pantalla 1080×1920). */
export const FRANJA = { historia: 300, arriba: 560, paso: 96 } as const;

/**
 * Pastilla de dato en pantalla (como el reloj "cada 1,5 - 2 h"): ícono
 * dibujado + texto, fondo claro. Coordenadas de PANTALLA (fuera de la cámara).
 */
export const Badge: React.FC<{
  /** Normalmente se omiten: la pastilla va a su franja fija según el registro. */
  x?: number;
  y?: number;
  /** Fila en la franja (0, 1, 2…) cuando hay varias pastillas a la vez. */
  fila?: number;
  text: string;
  at: number;
  until?: number;
  icono?: "reloj" | "regla" | "rayo" | "info" | "alerta" | "check";
  size?: number;
  color?: string;
  /** Pop sonoro al aparecer. */
  sonido?: boolean;
}> = ({ x, y, fila = 0, text, at, until, icono, size = 40, color = "#2A1A2E", sonido = true }) => {
  const f = useCurrentFrame();
  const e = useEstilo();
  // Franja fija: en "historia" arriba (los subtítulos van abajo); en el resto, bajo los subtítulos.
  const yBase = e.subtitulos === "historia" ? FRANJA.historia : FRANJA.arriba;
  y = y ?? yBase + fila * FRANJA.paso;
  x = x ?? 540;
  const pop = interpolate(f, [at, at + 6, at + 10], [0, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = until === undefined ? 1 : interpolate(f, [until, until + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spin = (f - at) * 12;
  return (
    <>
      {sonido ? <Sfx name="pop" at={at} dur={10} volume={0.35} /> : null}
      {pop <= 0 || out <= 0 ? null : (
    <div
      data-qa="pastilla"
      data-qa-nombre={text}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${pop})`,
        opacity: out,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: `${size * 0.32}px ${size * 0.62}px`,
        borderRadius: 999,
        background: "#FFFDF8",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: size,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {icono ? (
        <svg width={size * 1.1} height={size * 1.1} viewBox="0 0 48 48">
          {icono === "reloj" ? (
            <>
              <circle cx={24} cy={24} r={20} fill="#FFF" stroke={color} strokeWidth={4} />
              <path d="M24 24 V12" stroke={color} strokeWidth={4} strokeLinecap="round" transform={`rotate(${spin} 24 24)`} />
              <path d="M24 24 H33" stroke="#D2453B" strokeWidth={3} strokeLinecap="round" transform={`rotate(${spin / 12} 24 24)`} />
            </>
          ) : icono === "regla" ? (
            <path d="M4 32 L32 4 L44 16 L16 44 Z M12 28 l4 4 M18 22 l3 3 M24 16 l4 4 M30 10 l3 3" stroke={color} strokeWidth={3.5} fill="#F6C343" strokeLinejoin="round" />
          ) : icono === "rayo" ? (
            <path d="M27 4 9 27h14l-2 17 18-23H25Z" fill="#FFD54A" stroke={color} strokeWidth={3} strokeLinejoin="round" />
          ) : icono === "alerta" ? (
            <path d="M24 5 44 41H4Z M24 18v11 M24 34v1" fill="#FFD54A" stroke={color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
          ) : icono === "check" ? (
            <path d="M24 44a20 20 0 1 0 0-40 20 20 0 0 0 0 40Z m-9-20 6 6 12-13" fill="#6DBF4B" stroke={color} strokeWidth={3.5} strokeLinejoin="round" />
          ) : (
            <path d="M24 44a20 20 0 1 0 0-40 20 20 0 0 0 0 40Z M24 21v12 M24 15v1" fill="#8EC9F0" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
          )}
        </svg>
      ) : null}
      {text}
    </div>
      )}
    </>
  );
};
