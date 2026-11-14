import React from "react";
import { useCurrentFrame } from "remotion";
import { REAL, sombreado, tono } from "./colores";

export type Expresion =
  | "neutral"
  | "feliz"
  | "enojado"
  | "sorprendido"
  | "triste"
  | "presumido";
export type Pose = "abajo" | "arriba" | "senala" | "jarras" | "sostiene";

/**
 * Personaje caricatura (registro "historia"): cabeza redonda grande con
 * expresión, cuerpo-cápsula con la ropa, piernas de palito. Respira solo.
 * Coordenadas: (x, y) = punto entre los pies. Altura base ≈ 520 * escala.
 */
export const Personaje: React.FC<{
  x: number;
  y: number;
  escala?: number;
  piel?: string;
  ropa?: string;
  pantalon?: string;
  cabello?: string | null;
  peinado?: "corto" | "rizado" | "ninguno";
  gorra?: string | null;
  corbata?: string | null;
  expresion?: Expresion;
  pose?: Pose;
  mira?: -1 | 1;
  /** Líneas de enojo/energía alrededor (como en la celda rosa). */
  furia?: boolean;
  rubor?: boolean;
  /** Estrellas de rango en la gorra (0 = ninguna; 1 por defecto). */
  estrellas?: number;
  /** Casco militar redondo (color). */
  casco?: string | null;
  /** Sombrero de ala ancha (color). */
  sombrero?: string | null;
  bigote?: string | null;
  /** Lentes oscuros. */
  lentes?: boolean;
}> = ({
  x,
  y,
  escala = 1,
  piel = "#FFFFFF",
  ropa = REAL.ropa.blanco,
  pantalon = REAL.ropa.azulMarino,
  cabello = REAL.cabello.cafe,
  peinado = "corto",
  gorra = null,
  corbata = null,
  expresion = "neutral",
  pose = "abajo",
  mira = 1,
  furia = false,
  rubor = false,
  estrellas = 1,
  casco = null,
  sombrero = null,
  bigote = null,
  lentes = false,
}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 9) * 3;
  const sr = sombreado(ropa);
  const sp = sombreado(piel);
  const line = "#1C1C22";
  const arm = (side: -1 | 1) => {
    const sx = side * 58;
    const sy = -300;
    if (pose === "arriba") return `M${sx} ${sy} L${side * 110} ${sy - 140}`;
    if (pose === "senala" && side === mira)
      return `M${sx} ${sy} L${side * 190} ${sy - 30}`;
    if (pose === "jarras")
      return `M${sx} ${sy} L${side * 100} ${sy + 60} L${side * 62} ${sy + 110}`;
    if (pose === "sostiene" && side === mira)
      return `M${sx} ${sy} L${side * 120} ${sy - 10} L${side * 150} ${sy - 70}`;
    return `M${sx} ${sy} L${side * 80} ${sy + 150}`;
  };
  // Parpadeo natural: cada ~3,2 s, desfasado por personaje (determinista).
  const fase = Math.abs(Math.round(x * 7 + y * 3)) % 96;
  const parpadea = (f + fase) % 96 < 3 && expresion !== "feliz" && !lentes;
  const eyes = () => {
    const ex = 34;
    const ey = -470;
    if (parpadea) {
      return (
        <>
          <path d={`M${-ex - 12} ${ey} h24`} stroke={line} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${ex - 12} ${ey} h24`} stroke={line} strokeWidth={6} strokeLinecap="round" />
        </>
      );
    }
    switch (expresion) {
      case "feliz":
        return (
          <>
            <path
              d={`M${-ex - 12} ${ey} q12 -14 24 0`}
              stroke={line}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${ex - 12} ${ey} q12 -14 24 0`}
              stroke={line}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      case "enojado":
        return (
          <>
            <path
              d={`M${-ex - 20} ${ey - 24} L${-ex + 14} ${ey - 10}`}
              stroke={line}
              strokeWidth={7}
              strokeLinecap="round"
            />
            <path
              d={`M${ex + 20} ${ey - 24} L${ex - 14} ${ey - 10}`}
              stroke={line}
              strokeWidth={7}
              strokeLinecap="round"
            />
            <circle
              cx={-ex}
              cy={ey + 4}
              r={9}
              fill="#C22"
              stroke={line}
              strokeWidth={3}
            />
            <circle
              cx={ex}
              cy={ey + 4}
              r={9}
              fill="#C22"
              stroke={line}
              strokeWidth={3}
            />
          </>
        );
      case "sorprendido":
        return (
          <>
            <circle
              cx={-ex}
              cy={ey}
              r={16}
              fill="#FFF"
              stroke={line}
              strokeWidth={4}
            />
            <circle
              cx={ex}
              cy={ey}
              r={16}
              fill="#FFF"
              stroke={line}
              strokeWidth={4}
            />
            <circle cx={-ex} cy={ey} r={6} fill={line} />
            <circle cx={ex} cy={ey} r={6} fill={line} />
          </>
        );
      case "presumido":
        return (
          <>
            <path
              d={`M${-ex - 14} ${ey} h28`}
              stroke={line}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <path
              d={`M${ex - 14} ${ey} h28`}
              stroke={line}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <path
              d={`M${-ex - 16} ${ey - 22} q16 -8 30 0`}
              stroke={line}
              strokeWidth={5}
              fill="none"
            />
          </>
        );
      default:
        return (
          <>
            <circle cx={-ex} cy={ey} r={7} fill={line} />
            <circle cx={ex} cy={ey} r={7} fill={line} />
          </>
        );
    }
  };
  const mouth = () => {
    const my = -415;
    switch (expresion) {
      case "feliz":
        return (
          <path
            d={`M-30 ${my} q30 34 60 0 Z`}
            fill="#7A2020"
            stroke={line}
            strokeWidth={4}
          />
        );
      case "enojado":
        return (
          <g>
            <rect
              x={-38}
              y={my - 14}
              width={76}
              height={30}
              rx={6}
              fill="#FFF"
              stroke={line}
              strokeWidth={4}
            />
            <path
              d={`M-38 ${my + 1} h76 M-19 ${my - 14} v30 M0 ${my - 14} v30 M19 ${my - 14} v30`}
              stroke={line}
              strokeWidth={3}
            />
          </g>
        );
      case "sorprendido":
        return (
          <ellipse
            cx={0}
            cy={my}
            rx={14}
            ry={20}
            fill="#7A2020"
            stroke={line}
            strokeWidth={4}
          />
        );
      case "triste":
        return (
          <path
            d={`M-26 ${my + 10} q26 -22 52 0`}
            stroke={line}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        );
      case "presumido":
        return (
          <path
            d={`M-24 ${my} q30 16 50 -6`}
            stroke={line}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        );
      default:
        return (
          <path
            d={`M-20 ${my} h40`}
            stroke={line}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
    }
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${escala * mira} ${escala})`}>
      {furia ? (
        <g
          stroke="#E3242B"
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          opacity={0.85}
        >
          {new Array(10).fill(0).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 + f / 20;
            const r0 = 170 + Math.sin(f / 3 + i) * 10;
            return (
              <path
                key={i}
                d={`M${Math.cos(a) * r0} ${-330 + Math.sin(a) * r0} q${Math.cos(a + 0.6) * 40} ${Math.sin(a + 0.6) * 40} ${Math.cos(a) * 90} ${Math.sin(a) * 90}`}
              />
            );
          })}
        </g>
      ) : null}
      <g transform={`translate(0 ${bob})`}>
        {/* piernas */}
        <path
          d={`M-26 -150 L-34 ${-bob} M26 -150 L34 ${-bob}`}
          stroke={line}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <path
          d={`M-34 ${-bob} h-26 M34 ${-bob} h26`}
          stroke={line}
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* brazos */}
        <path
          d={arm(-1)}
          stroke={line}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={arm(1)}
          stroke={line}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* torso cápsula */}
        <rect
          x={-66}
          y={-330}
          width={132}
          height={210}
          rx={58}
          fill={sr.base}
          stroke={line}
          strokeWidth={6}
        />
        <path
          d="M-66 -200 h132 v20 q0 50 -60 58 h-12 q-60 -8 -60 -58 Z"
          fill={pantalon}
          stroke={line}
          strokeWidth={6}
        />
        <path
          d="M-40 -310 q-14 60 0 130"
          stroke={sr.luz}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          opacity={0.7}
        />
        {corbata ? (
          <path
            d="M0 -322 l-12 16 l12 90 l12 -90 Z"
            fill={corbata}
            stroke={line}
            strokeWidth={4}
          />
        ) : null}
        {/* cabeza */}
        <g transform="translate(0 16)">
          <circle
            data-qa="cara"
            cx={0}
            cy={-445}
            r={98}
            fill={sp.base}
            stroke={line}
            strokeWidth={6}
          />
          <ellipse
            cx={-34}
            cy={-490}
            rx={26}
            ry={16}
            fill="#FFFFFF"
            opacity={0.35}
          />
          {rubor ? (
            <>
              <ellipse
                cx={-56}
                cy={-425}
                rx={16}
                ry={9}
                fill="#F28B9A"
                opacity={0.75}
              />
              <ellipse
                cx={56}
                cy={-425}
                rx={16}
                ry={9}
                fill="#F28B9A"
                opacity={0.75}
              />
            </>
          ) : null}
          {cabello && peinado === "corto" ? (
            <path
              d="M-96 -462 q0 -92 96 -92 q96 0 96 92 q-40 -40 -96 -36 q-40 2 -60 30 Z"
              fill={cabello}
              stroke={line}
              strokeWidth={5}
            />
          ) : null}
          {cabello && peinado === "rizado" ? (
            <g fill={cabello} stroke={tono(cabello, -0.25)} strokeWidth={4}>
              {new Array(9).fill(0).map((_, i) => {
                const a = Math.PI + (i / 8) * Math.PI;
                return (
                  <circle
                    key={i}
                    cx={Math.cos(a) * 92}
                    cy={-460 + Math.sin(a) * 92}
                    r={34}
                  />
                );
              })}
            </g>
          ) : null}
          {gorra ? (
            <g transform="translate(0 -22)">
              <path
                d="M-100 -470 q0 -100 100 -100 q100 0 100 100 Z"
                fill={gorra}
                stroke={line}
                strokeWidth={5}
              />
              <path
                d="M40 -472 q90 0 110 18 q-60 10 -150 6 Z"
                fill={tono(gorra, -0.1)}
                stroke={line}
                strokeWidth={5}
              />
              {new Array(estrellas).fill(0).map((_, i) => (
                <path
                  key={i}
                  transform={`translate(${(i - (estrellas - 1) / 2) * 34} 0)`}
                  d="M-10 -540 l8 16 l18 2 l-13 12 l4 18 l-17 -9 l-17 9 l4 -18 l-13 -12 l18 -2 Z"
                  fill="#F6C343"
                  stroke={line}
                  strokeWidth={1.5}
                />
              ))}
            </g>
          ) : null}
          {casco ? (
            <g>
              <path d="M-112 -455 q0 -120 112 -120 q112 0 112 120 Z" fill={casco} stroke={line} strokeWidth={5} />
              <path d="M-122 -455 h244" stroke={line} strokeWidth={10} strokeLinecap="round" />
              <path d="M-60 -540 q30 -18 70 -6" stroke={tono(casco, 0.18)} strokeWidth={8} fill="none" strokeLinecap="round" />
              <circle cx={-40} cy={-500} r={8} fill={tono(casco, -0.18)} />
              <circle cx={30} cy={-520} r={10} fill={tono(casco, -0.18)} />
              <circle cx={60} cy={-485} r={7} fill={tono(casco, -0.18)} />
            </g>
          ) : null}
          {sombrero ? (
            <g>
              <ellipse cx={0} cy={-500} rx={170} ry={26} fill={tono(sombrero, -0.08)} stroke={line} strokeWidth={5} />
              <path d="M-80 -505 q0 -90 80 -90 q80 0 80 90 Z" fill={sombrero} stroke={line} strokeWidth={5} />
              <path d="M-80 -520 h160" stroke={tono(sombrero, -0.3)} strokeWidth={12} />
            </g>
          ) : null}
          {eyes()}
          {lentes ? (
            <g>
              <rect x={-66} y={-488} width={58} height={34} rx={10} fill="#1C1C22" />
              <rect x={8} y={-488} width={58} height={34} rx={10} fill="#1C1C22" />
              <path d="M-8 -474 h16" stroke="#1C1C22" strokeWidth={5} />
              <path d="M-56 -480 l14 -4" stroke="#FFFFFF" strokeWidth={4} opacity={0.6} />
            </g>
          ) : null}
          {bigote ? (
            <path d="M-46 -428 q22 -18 46 -4 q24 -14 46 4 q-24 12 -46 2 q-22 10 -46 -2 Z" fill={bigote} stroke={line} strokeWidth={3} />
          ) : null}
          {mouth()}
        </g>
      </g>
    </g>
  );
};
