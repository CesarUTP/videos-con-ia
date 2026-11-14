import React from "react";
import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { SceneProvider } from "./scene-context";
import { Barras } from "./scenes/Barras";
import { Cierre } from "./scenes/Cierre";
import { Columnas } from "./scenes/Columnas";
import { Comparacion } from "./scenes/Comparacion";
import { Frase } from "./scenes/Frase";
import { Gancho } from "./scenes/Gancho";
import { Lista } from "./scenes/Lista";
import { Numero } from "./scenes/Numero";
import { Ruta } from "./scenes/Ruta";
import { Visual } from "./scenes/Visual";
import { EstiloProvider } from "./estilos";
import { RevisorSolapes } from "./qa/RevisorSolapes";
import { COLOR } from "./theme";
import { getTransition } from "./transitions";
import type { Manifest, ManifestScene, ReelProps } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENES: Record<string, React.FC<any>> = {
  gancho: Gancho,
  numero: Numero,
  barras: Barras,
  columnas: Columnas,
  comparacion: Comparacion,
  lista: Lista,
  frase: Frase,
  cierre: Cierre,
  ruta: Ruta,
  visual: Visual,
};

/** Titular de portada: grande, alto contraste, dentro de la zona segura. */
const TituloPortada: React.FC<{ texto: string; historia: boolean }> = ({
  texto,
  historia,
}) => (
  <div
    style={{
      position: "absolute",
      top: 250,
      left: 70,
      right: 70,
      textAlign: "center",
      fontFamily: "Inter",
      fontWeight: 900,
      fontSize: 104,
      lineHeight: 1.02,
      letterSpacing: -2,
      color: "#FFFFFF",
      WebkitTextStroke: historia ? "16px #000" : "0px transparent",
      paintOrder: "stroke fill",
      textShadow: historia ? "none" : "0 6px 40px rgba(0,0,0,0.85)",
    }}
  >
    {texto}
  </div>
);

/**
 * Atenuación de la música bajo la voz (ducking): 1 sin voz, `bajo` con voz,
 * con rampas suaves de `rampa` frames para que no "bombee".
 */
export const duckAt = (
  f: number,
  ranges: [number, number][],
  bajo = 0.32,
  rampa = 9,
): number => {
  let g = 1;
  for (const [a, b] of ranges) {
    if (f >= a - rampa && f <= b + rampa) {
      const t = f < a ? (a - f) / rampa : f > b ? (f - b) / rampa : 0;
      g = Math.min(g, bajo + (1 - bajo) * Math.min(1, t));
    }
  }
  return g;
};

/** Frame absoluto en el que empieza cada escena (descontando solapes). */
export const sceneStarts = (m: Manifest): number[] => {
  const starts: number[] = [];
  let t = 0;
  m.escenas.forEach((s, i) => {
    starts.push(t);
    const overlap =
      i < m.escenas.length - 1 &&
      getTransition(s.transicion, m.transitionFrames)
        ? m.transitionFrames
        : 0;
    t += s.durationInFrames - overlap;
  });
  return starts;
};

export const totalFrames = (m: Manifest): number => {
  const starts = sceneStarts(m);
  const last = m.escenas[m.escenas.length - 1];
  return starts[starts.length - 1] + last.durationInFrames;
};

export const calculateReelMetadata: CalculateMetadataFunction<
  ReelProps
> = async ({ props, abortSignal }) => {
  const res = await fetch(staticFile(`videos/${props.slug}/manifest.json`), {
    signal: abortSignal,
  });
  if (!res.ok) {
    throw new Error(
      `No existe public/videos/${props.slug}/manifest.json. Ejecuta primero: npm run voz -- ${props.slug}`,
    );
  }
  const manifest = (await res.json()) as Manifest;
  return {
    durationInFrames: totalFrames(manifest),
    fps: manifest.fps,
    props: { ...props, manifest },
    defaultOutName: props.slug,
  };
};

const SceneBody: React.FC<{
  scene: ManifestScene;
  index: number;
  total: number;
  fps: number;
  subtitulos: boolean;
}> = ({ scene, index, total, fps, subtitulos }) => {
  const Comp = SCENES[scene.tipo];
  if (!Comp) throw new Error(`Tipo de escena desconocido: ${scene.tipo}`);
  return (
    <SceneProvider
      value={{
        durationInFrames: scene.durationInFrames,
        audioStartFrame: scene.audioStartFrame,
        audioFrames: scene.audioFrames,
        palabras: scene.palabras,
        fps,
        index,
        total,
      }}
    >
      <AbsoluteFill>
        <Comp {...scene.props} />
        {subtitulos ? (
          <Captions
            palabras={scene.palabras}
            offsetFrames={scene.audioStartFrame}
          />
        ) : null}
      </AbsoluteFill>
    </SceneProvider>
  );
};

export const Reel: React.FC<ReelProps> = ({
  manifest,
  subtitulos = true,
  portada = null,
  qa = false,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!manifest) return <AbsoluteFill style={{ background: COLOR.bg }} />;

  const starts = sceneStarts(manifest);
  const voiceRanges = manifest.escenas.map((sc, i) => [
    starts[i] + sc.audioStartFrame,
    starts[i] + sc.audioStartFrame + sc.audioFrames,
  ]) as [number, number][];
  const muteRanges = manifest.escenas
    .map(
      (sc, i) =>
        [
          starts[i],
          starts[i] + sc.durationInFrames,
          sc.musicaFondo === false,
        ] as const,
    )
    .filter((r) => r[2])
    .map((r) => [r[0], r[1]] as [number, number]);

  const children: React.ReactNode[] = [];
  manifest.escenas.forEach((scene, i) => {
    children.push(
      <TransitionSeries.Sequence
        key={`s-${scene.id}`}
        name={`${String(i + 1).padStart(2, "0")} ${scene.tipo}`}
        durationInFrames={scene.durationInFrames}
      >
        <SceneBody
          scene={scene}
          index={i}
          total={manifest.escenas.length}
          fps={fps}
          subtitulos={subtitulos}
        />
      </TransitionSeries.Sequence>,
    );
    const tr =
      i < manifest.escenas.length - 1
        ? getTransition(scene.transicion, manifest.transitionFrames)
        : null;
    if (tr) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${scene.id}`}
          presentation={tr.presentation}
          timing={tr.timing}
        />,
      );
    }
  });

  return (
    <EstiloProvider id={manifest.estilo}>
      <AbsoluteFill id="remotion-qa-raiz" style={{ backgroundColor: COLOR.bg }}>
        {qa ? <RevisorSolapes /> : null}
        <Background />
        <TransitionSeries>{children}</TransitionSeries>

        {/* Voz: un archivo por escena, colocado en su frame exacto. */}
        {manifest.escenas.map((scene, i) => (
          <Sequence
            key={`a-${scene.id}`}
            name={`voz ${scene.id}`}
            from={starts[i] + scene.audioStartFrame}
            durationInFrames={scene.audioFrames + 2}
            layout="none"
          >
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        ))}

        {/* Efectos de sonido generados localmente (sin licencias de terceros). */}
        {manifest.sfx
          ? manifest.escenas.slice(0, -1).map((scene, i) =>
              getTransition(scene.transicion, manifest.transitionFrames) ? (
                <Sequence
                  key={`w-${scene.id}`}
                  name="whoosh"
                  from={Math.max(0, starts[i + 1] - 4)}
                  durationInFrames={30}
                  layout="none"
                >
                  <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
                </Sequence>
              ) : null,
            )
          : null}

        {portada ? (
          <TituloPortada
            texto={portada}
            historia={manifest.estilo === "historia"}
          />
        ) : null}
        {manifest.musica ? (
          <Audio
            src={staticFile(manifest.musica.src)}
            loop
            volume={(f) =>
              manifest.musica!.volumen *
              duckAt(f, voiceRanges) *
              duckAt(f, muteRanges, 0, 12) *
              interpolate(
                f,
                [0, fps, durationInFrames - fps * 1.5, durationInFrames],
                [0, 1, 1, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )
            }
          />
        ) : null}
      </AbsoluteFill>
    </EstiloProvider>
  );
};
