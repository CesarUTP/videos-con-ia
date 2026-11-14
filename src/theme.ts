/**
 * Sistema de diseño "noche" (estilo explicativo cinematográfico).
 * La ilustración explica; el texto solo aparece como subtítulo y etiquetas.
 * Toda escena usa SOLO estos tokens (ver CLAUDE.md).
 */
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Easing } from "remotion";

const sans = loadSans("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});
const mono = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin", "latin-ext"],
});

export const FONT = {
  display: sans.fontFamily,
  sans: sans.fontFamily,
  mono: mono.fontFamily,
} as const;

/**
 * Paleta: fondo casi negro, texto claro, ENERGÍA en dorado brillante
 * (señales, campos, lo que "se activa") y AZUL solo para la caja de
 * selección de la palabra clave del subtítulo.
 */
export const COLOR = {
  bg: "#07080B",
  bgDeep: "#000000",
  surface: "#14161C", // objetos/paneles oscuros
  surface2: "#1E2129",
  ink: "#F3F1EC", // texto principal
  inkSoft: "#8C9099", // texto secundario / palabras ya dichas
  line: "rgba(255,255,255,0.055)", // retícula
  accent: "#FFB23F", // energía (dorado)
  accentHot: "#FFE2A3", // núcleo brillante del dorado
  accentInk: "#0B0C0F",
  select: "#3D8BFF", // caja de selección (palabra clave)
  danger: "#FF5A4E",
  // piel (ilustraciones)
  skin: "#E7B9A0",
  skinLight: "#F6D2BE",
  skinShadow: "#B47F68",
  // tejidos
  muscle: "#B8483F",
  muscleLight: "#E0705F",
  tendon: "#E9DCC6",
  nerve: "#F2D27A",
  bone: "#E8E1D3",
} as const;

/** Formato vertical Reels / TikTok / Shorts. */
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Zonas seguras de Instagram Reels. */
export const SAFE = {
  top: 230,
  bottom: 420,
  left: 80,
  right: 150,
} as const;

/** Subtítulos ARRIBA (como la referencia): bajo el encabezado de IG. */
export const CAPTION_ZONE = {
  top: 250,
  height: 200,
  // compatibilidad con escenas de texto antiguas
  bottom: 1920 - 250 - 200,
} as const;

export const EASE = {
  text: Easing.bezier(0.16, 1, 0.3, 1),
  data: Easing.bezier(0.65, 0, 0.35, 1),
  exit: Easing.bezier(0.7, 0, 0.84, 0),
  icon: Easing.bezier(0.34, 1.2, 0.64, 1),
  camera: Easing.bezier(0.45, 0, 0.2, 1), // movimientos de cámara suaves
} as const;

export const SPRING = {
  icon: { damping: 18, stiffness: 140, mass: 0.8 },
  smooth: { damping: 200 },
} as const;

export const TIMING = {
  stagger: 3,
  textIn: 18,
  dataIn: 36,
  revealPause: 12,
  cambioEscena: 14,
} as const;

export const TYPE = {
  hero: 120,
  h1: 96,
  h2: 70,
  body: 48,
  label: 30,
  caption: 54,
  number: 220,
} as const;
