import React, { createContext, useContext } from "react";

/**
 * REGISTROS VISUALES. El registro se elige según el TEMA del video
 * (campo "estilo" en guion.json). Ver CLAUDE.md > Registros visuales.
 *
 * - tecnico : física, tecnología, cómo funcionan las cosas. Fondo casi negro,
 *             objetos semi-realistas, energía dorada brillante, etiquetas técnicas.
 * - cuerpo  : medicina, biología, cuerpo humano. Fondo oscuro TEÑIDO (ciruela),
 *             órganos y objetos con su COLOR REAL, ilustración plana con sombra
 *             suave, ventanas de corte, metáforas cotidianas y onomatopeyas.
 * - historia: relatos, experimentos, datos curiosos con personajes. Escenarios
 *             completos a todo color, personajes caricatura con expresiones,
 *             subtítulos grandes al centro con contorno negro.
 */
export type EstiloId = "tecnico" | "cuerpo" | "historia";

export type Estilo = {
  id: EstiloId;
  /** Degradado de fondo (arriba → abajo) y viñeta. */
  fondo: { arriba: string; abajo: string; vineta: number };
  particulas: "polvo" | "burbujas" | "ninguna";
  reticula: boolean;
  texto: string;
  textoSuave: string;
  /** Color de "energía"/señal (lo que se activa). */
  energia: string;
  energiaNucleo: string;
  seleccion: string;
  /** Estilo de etiquetas: técnicas (línea guía) o pastilla (fondo claro). */
  etiqueta: "tecnica" | "pastilla";
  subtitulos: "seleccion" | "historia";
};

export const ESTILOS: Record<EstiloId, Estilo> = {
  tecnico: {
    id: "tecnico",
    fondo: { arriba: "#0B0D12", abajo: "#050608", vineta: 0.75 },
    particulas: "polvo",
    reticula: true,
    texto: "#F3F1EC",
    textoSuave: "#8C9099",
    energia: "#FFB23F",
    energiaNucleo: "#FFE2A3",
    seleccion: "#3D8BFF",
    etiqueta: "tecnica",
    subtitulos: "seleccion",
  },
  cuerpo: {
    id: "cuerpo",
    fondo: { arriba: "#3A1A3F", abajo: "#160A1C", vineta: 0.55 },
    particulas: "burbujas",
    reticula: false,
    texto: "#FFF8F2",
    textoSuave: "#C7B3C4",
    energia: "#FFD54A",
    energiaNucleo: "#FFF4C2",
    seleccion: "#4C8DFF",
    etiqueta: "pastilla",
    subtitulos: "seleccion",
  },
  historia: {
    id: "historia",
    fondo: { arriba: "#BFD9EE", abajo: "#E9EEF2", vineta: 0.2 },
    particulas: "ninguna",
    reticula: false,
    texto: "#FFFFFF",
    textoSuave: "#FFFFFF",
    energia: "#FF4D6D",
    energiaNucleo: "#FFD1DA",
    seleccion: "#FF4D6D",
    etiqueta: "pastilla",
    subtitulos: "historia",
  },
};

const Ctx = createContext<Estilo>(ESTILOS.tecnico);

export const EstiloProvider: React.FC<{ id?: string; children: React.ReactNode }> = ({ id, children }) => (
  <Ctx.Provider value={ESTILOS[(id as EstiloId) ?? "tecnico"] ?? ESTILOS.tecnico}>{children}</Ctx.Provider>
);

export const useEstilo = () => useContext(Ctx);
