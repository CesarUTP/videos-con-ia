import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../theme";

/**
 * Un "plano" de cámara: punto del mundo que queda en el centro de la
 * pantalla (x, y) y nivel de zoom. Los planos con nombre se comparten
 * entre escenas para que la cámara sea CONTINUA (sin cortes visibles).
 */
export type Shot = { x: number; y: number; zoom: number; rot?: number };

/** Clave de cámara: en el frame `at` la cámara está en `shot`. */
export type CamKey = { at: number; shot: Shot };

/** Centro de encuadre en pantalla (un poco bajo, deja aire a los subtítulos). */
export const SCREEN_FOCUS = { x: 540, y: 1080 };

export const cameraAt = (frame: number, keys: CamKey[]): Shot => {
  if (keys.length === 1 || frame <= keys[0].at) return keys[0].shot;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.at) {
      const t = interpolate(frame, [a.at, Math.max(a.at + 1, b.at)], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE.camera,
      });
      // zoom interpolado en escala logarítmica: se siente natural
      const zoom = Math.exp(Math.log(a.shot.zoom) + (Math.log(b.shot.zoom) - Math.log(a.shot.zoom)) * t);
      return {
        x: a.shot.x + (b.shot.x - a.shot.x) * t,
        y: a.shot.y + (b.shot.y - a.shot.y) * t,
        zoom,
        rot: (a.shot.rot ?? 0) + ((b.shot.rot ?? 0) - (a.shot.rot ?? 0)) * t,
      };
    }
  }
  return keys[keys.length - 1].shot;
};

/**
 * Envuelve un "mundo" (SVG grande con coordenadas propias) y lo mueve como
 * una cámara. Incluye una deriva mínima ("respiración") para que nunca
 * haya cuadros congelados.
 */
export const Camera: React.FC<{
  keys: CamKey[];
  worldWidth: number;
  worldHeight: number;
  children: React.ReactNode;
  breathe?: boolean;
}> = ({ keys, worldWidth, worldHeight, children, breathe = true }) => {
  const frame = useCurrentFrame();
  const s = cameraAt(frame, keys);
  const bx = breathe ? Math.sin(frame / 47) * 6 : 0;
  const by = breathe ? Math.cos(frame / 59) * 5 : 0;
  const tx = SCREEN_FOCUS.x - s.x * s.zoom + bx;
  const ty = SCREEN_FOCUS.y - s.y * s.zoom + by;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: worldWidth,
        height: worldHeight,
        transformOrigin: "0 0",
        transform: `translate(${tx}px, ${ty}px) scale(${s.zoom}) rotate(${s.rot ?? 0}deg)`,
      }}
    >
      {children}
    </div>
  );
};

/** Zoom actual (para compensar grosores/tamaños de etiquetas). */
export const useCameraZoom = (keys: CamKey[]) => cameraAt(useCurrentFrame(), keys).zoom;
