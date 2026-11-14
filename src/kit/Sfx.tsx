import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile } from "remotion";
import { useScene } from "../scene-context";

/**
 * Efecto de sonido sincronizado con la imagen. REGLA: lo que suena en la
 * historia se ESCUCHA (helicóptero, mazo, golpe, música); no se escribe en
 * pantalla. Los archivos viven en public/sfx/<name>.wav (pipeline/sfx.py).
 *
 *   <Sfx name="mazo" at={acuso - 2} />
 *   <Sfx name="helicoptero" at={0} dur={durationInFrames} loop volume={0.5} fadeIn={20} fadeOut={20} />
 *
 * `at` y `dur` en frames relativos a la escena.
 */
export const Sfx: React.FC<{
  name: string;
  at: number;
  /** Duración en frames (obligatoria si loop). */
  dur?: number;
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  /** Velocidad/tono (0.9–1.1 para variar repeticiones). */
  rate?: number;
  /** Baja el volumen mientras habla la voz (para música diegética, motores, multitudes). */
  duck?: boolean | number;
}> = ({ name, at, dur, volume = 1, loop = false, fadeIn = 0, fadeOut = 0, rate = 1, duck = false }) => {
  const total = dur ?? 30 * 8;
  const { audioStartFrame, audioFrames } = useScene();
  const bajo = duck === true ? 0.4 : typeof duck === "number" ? duck : 1;
  const ramp = 8;
  return (
    <Sequence from={Math.round(at)} durationInFrames={Math.max(1, Math.round(total))} layout="none" name={`sfx ${name}`}>
      <Audio
        src={staticFile(`sfx/${name}.wav`)}
        loop={loop}
        playbackRate={rate}
        volume={(f) => {
          const a = fadeIn > 0 ? interpolate(f, [0, fadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
          const b =
            fadeOut > 0 && dur
              ? interpolate(f, [dur - fadeOut, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
              : 1;
          let d = 1;
          if (bajo < 1) {
            const g = f + Math.round(at); // frame de la escena
            const vA = audioStartFrame;
            const vB = audioStartFrame + audioFrames;
            const dist = g < vA ? vA - g : g > vB ? g - vB : 0;
            d = bajo + (1 - bajo) * Math.min(1, dist / ramp);
          }
          return volume * a * b * d;
        }}
      />
    </Sequence>
  );
};
