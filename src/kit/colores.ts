/**
 * Colores REALES de objetos y su sombreado. Regla: cada cosa se pinta con
 * su color real (el intestino es rosa, el músculo rojo, el hueso marfil,
 * la madera café) y se sombrea con tonos del MISMO color: luz, sombra y un
 * contorno más oscuro del mismo matiz. Nunca contornos negros puros.
 */

type HSL = { h: number; s: number; l: number };

const hexToHsl = (hex: string): HSL => {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
};

const hslToHex = ({ h, s, l }: HSL): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Aclara (+) u oscurece (-) un color manteniendo su matiz. */
export const tono = (hex: string, dl: number, ds = 0): string => {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h, s: clamp(c.s + ds), l: clamp(c.l + dl) });
};

/** Juego completo de sombreado para un color base. */
export const sombreado = (base: string) => ({
  base,
  luz: tono(base, 0.12, -0.04),
  brillo: tono(base, 0.24, -0.1),
  sombra: tono(base, -0.12, 0.04),
  contorno: tono(base, -0.26, 0.06),
});

/** Paleta de colores reales (ampliar según el tema del video). */
export const REAL = {
  piel: {
    clara: "#F3C9AE",
    media: "#E2A47F",
    morena: "#B97752",
    oscura: "#7C4A32",
  },
  cabello: { cafe: "#5A3825", negro: "#2A2220", rubio: "#D9A852", pelirrojo: "#C8592C" },
  cuerpo: {
    musculo: "#C9443F",
    tendon: "#F1E3C8",
    hueso: "#EFE6D2",
    cartilago: "#CFE3E8",
    nervio: "#F6CF4A",
    cerebro: "#F2A6B3",
    medulaBlanca: "#F4E7CC",
    medulaGris: "#C99AA3",
    sangre: "#B3122E",
    vena: "#4F6FC0",
    grasa: "#F5D88A",
    intestino: "#F2A3A8",
    mucosa: "#7A2238",
    estomago: "#E58E8E",
    pulmon: "#F0A5A0",
    corazon: "#C7293B",
    higado: "#8E3A2E",
    diente: "#F7F3E8",
  },
  ropa: {
    teal: "#2F8F9D",
    azulMarino: "#2B3A67",
    mezclilla: "#4C6EA8",
    rojo: "#D2453B",
    mostaza: "#E2A93B",
    blanco: "#F4F2EE",
    gris: "#8B93A1",
    verde: "#4E9A5B",
  },
  materiales: {
    madera: "#A8693E",
    maderaClara: "#C99464",
    metal: "#A9B2BE",
    cromo: "#D5DCE4",
    ladrillo: "#B5523B",
    ladrilloGris: "#9AA3AE",
    concreto: "#B9BCC2",
    vidrio: "#BFE3F2",
    plasticoRojo: "#D9473C",
    goma: "#C9473B",
    papel: "#F6F1E6",
  },
  naturaleza: {
    agua: "#4FB3E0",
    cielo: "#8EC9F0",
    pasto: "#6DBF4B",
    tierra: "#8A5A3B",
    sol: "#FFC83D",
    hoja: "#3F9B4E",
  },
  comida: { pan: "#E0A050", lechuga: "#7CC24E", tomate: "#E2483D", queso: "#F6C343", carne: "#7A3E2A" },
} as const;
