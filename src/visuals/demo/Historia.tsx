import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera } from "../../kit/Camera";
import { REAL } from "../../kit/colores";
import { Habitacion } from "../../kit/Habitacion";
import { Onomatopeya } from "../../kit/Onomatopeya";
import { Personaje } from "../../kit/Personaje";
import { useCues, useScene } from "../../scene-context";

/**
 * Demostración del registro "historia": habitación 2.5D a todo color y
 * personajes caricatura que cambian de expresión con la narración.
 */
export const DemoHistoria: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useScene();
  const [enoja, calma] = useCues(["furioso", "tranquilo"]);
  const furioso = frame >= enoja && frame < calma;
  return (
    <AbsoluteFill>
      <Camera
        keys={[
          { at: 0, shot: { x: 540, y: 1080, zoom: 1 } },
          { at: durationInFrames, shot: { x: 540, y: 1120, zoom: 1.12 } },
        ]}
        worldWidth={1080}
        worldHeight={1920}
      >
        <Habitacion pared="#F06AA6" piso="#C9CCD3" barrotes />
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <rect x={300} y={1420} width={360} height={26} rx={8} fill="#D5DCE4" stroke="#7E8794" strokeWidth={4} />
          <Personaje
            x={470}
            y={1560}
            escala={0.9}
            ropa="#E9EEF2"
            pantalon={REAL.ropa.mezclilla}
            cabello={REAL.cabello.pelirrojo}
            peinado="rizado"
            expresion={frame >= calma ? "feliz" : furioso ? "enojado" : "neutral"}
            pose={furioso ? "arriba" : "abajo"}
            furia={furioso}
            rubor={frame >= calma}
          />
          <Personaje
            x={820}
            y={1620}
            escala={0.95}
            ropa={REAL.ropa.azulMarino}
            pantalon={REAL.ropa.azulMarino}
            gorra={REAL.ropa.azulMarino}
            cabello={null}
            expresion={furioso ? "sorprendido" : "presumido"}
            pose="senala"
            mira={-1}
          />
          <Onomatopeya x={700} y={900} text="¡GRRR!" at={enoja} size={90} color="#FFE3EE" />
        </svg>
      </Camera>
    </AbsoluteFill>
  );
};
