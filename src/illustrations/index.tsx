import React from "react";
import { useCue } from "../scene-context";
import { PiernaReflejo } from "./PiernaReflejo";

/**
 * Ilustraciones animadas reutilizables. Se usan desde gancho/cierre con
 *   "ilustracion": { "tipo": "pierna-reflejo", "cue": "golpecito" }
 * `cue` = palabra de la narración donde ocurre la acción principal.
 */
export type IlustracionProps = { tipo: string; cue?: string; etiquetas?: boolean; alto?: number };

export const Ilustracion: React.FC<IlustracionProps> = ({ tipo, cue, etiquetas, alto }) => {
  const at = useCue(cue, 24);
  if (tipo === "pierna-reflejo") {
    return <PiernaReflejo golpe={at} etiquetas={etiquetas ?? true} height={alto} />;
  }
  throw new Error(`Ilustración desconocida: ${tipo}`);
};

export const ILUSTRACIONES = ["pierna-reflejo"];
