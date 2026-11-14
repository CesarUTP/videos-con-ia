import type { Palabra } from "./components/Captions";

/** Tipos de escena disponibles (ver src/scenes). */
export type SceneType =
  | "gancho"
  | "numero"
  | "barras"
  | "columnas"
  | "comparacion"
  | "lista"
  | "frase"
  | "cierre"
  | "ruta"
  | "visual";

export type TransitionType = "panel" | "deslizar" | "fundido" | "zoom" | "zoom-out" | "corte";

/** Una escena tal como la escribe pipeline/voz.py en manifest.json. */
export type ManifestScene = {
  id: string;
  tipo: SceneType;
  /** Props visuales propias de cada tipo de escena. */
  props: Record<string, unknown>;
  narracion: string;
  /** Ruta relativa a public/ */
  audio: string;
  /** Frame (relativo a la escena) en el que empieza la voz. */
  audioStartFrame: number;
  audioFrames: number;
  durationInFrames: number;
  /** Palabras con tiempos en ms relativos al INICIO DEL AUDIO de la escena. */
  palabras: Palabra[];
  /** Transición hacia la escena siguiente. */
  transicion: TransitionType;
  /** false = silencia la música de fondo en esta escena (p. ej. hay música diegética). */
  musicaFondo?: boolean;
};

export type Manifest = {
  slug: string;
  titulo: string;
  fps: number;
  /** Registro visual: tecnico | cuerpo | historia */
  estilo?: string;
  motorVoz: string;
  voz: string;
  transitionFrames: number;
  musica?: { src: string; volumen: number } | null;
  sfx: boolean;
  escenas: ManifestScene[];
};

export type ReelProps = {
  slug: string;
  manifest?: Manifest | null;
  /** Desactiva subtítulos (p. ej. para exportar sin ellos). */
  subtitulos?: boolean;
  /** Activa el revisor automático de solapes (npm run qa). */
  qa?: boolean;
  /** Titular grande de portada (solo al exportar la portada). */
  portada?: string | null;
};
