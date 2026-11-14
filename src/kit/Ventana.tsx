import React, { useId } from "react";
import { tono } from "./colores";

/**
 * Ventana de corte (como la escotilla circular sobre la playera en el video
 * de las tripas): recorta `children` dentro de una elipse/rectángulo
 * redondeado con un borde grueso del color del "material" que se corta
 * (piel, ropa) y sombra interior para dar profundidad.
 */
export const Ventana: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  /** Radio de esquina; si es >= min(w,h)/2 es una elipse. */
  r?: number;
  /** Color del material que rodea el corte. */
  borde?: string;
  grosor?: number;
  /** Color del fondo del interior (cavidad). */
  interior?: string;
  /** 0..1: apertura animada (0 = cerrada). */
  apertura?: number;
  children: React.ReactNode;
}> = ({ x, y, w, h, r, borde = "#E2A47F", grosor = 14, interior = "#5A1B2E", apertura = 1, children }) => {
  const id = useId().replace(/:/g, "");
  const rr = r ?? Math.min(w, h) / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const aw = w * apertura;
  const ah = h * apertura;
  const ax = cx - aw / 2;
  const ay = cy - ah / 2;
  const ar = Math.min(rr * apertura, Math.min(aw, ah) / 2);
  if (apertura <= 0.01) return null;
  return (
    <g>
      <defs>
        <clipPath id={`v${id}`}>
          <rect x={ax} y={ay} width={aw} height={ah} rx={ar} />
        </clipPath>
        <radialGradient id={`s${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#v${id})`}>
        <rect x={ax} y={ay} width={aw} height={ah} fill={interior} />
        {children}
        <rect x={ax} y={ay} width={aw} height={ah} fill={`url(#s${id})`} />
      </g>
      <rect
        data-qa="importante"
        data-qa-nombre="ventana de corte"
        x={ax}
        y={ay}
        width={aw}
        height={ah}
        rx={ar}
        fill="none"
        stroke={borde}
        strokeWidth={grosor}
      />
      <rect
        x={ax - grosor / 2}
        y={ay - grosor / 2}
        width={aw + grosor}
        height={ah + grosor}
        rx={ar + grosor / 2}
        fill="none"
        stroke={tono(borde, -0.22)}
        strokeWidth={3}
      />
    </g>
  );
};
