import React from "react";
import { VISUALS } from "../visuals";

/** Escena ilustrada: delega en un componente registrado en src/visuals. */
export const Visual: React.FC<{ visual: string } & Record<string, unknown>> = ({ visual, ...rest }) => {
  const Comp = VISUALS[visual];
  if (!Comp) {
    throw new Error(`Visual no registrado: "${visual}". Disponibles: ${Object.keys(VISUALS).join(", ")}`);
  }
  return <Comp {...rest} />;
};
