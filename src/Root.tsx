import React from "react";
import { Composition } from "remotion";
import { calculateReelMetadata, Reel } from "./Reel";
import { VIDEO } from "./theme";
import type { ReelProps } from "./types";

/**
 * Una sola composición "Reel" para TODOS los videos.
 * El video se elige con la prop `slug` (carpeta en public/videos/<slug>).
 *   npx remotion studio            -> cambia `slug` en el panel de props
 *   npm run render -- <slug>       -> MP4 en out/<slug>.mp4
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={300}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{ slug: "reflejo-rodilla", manifest: null, subtitulos: true } satisfies ReelProps}
      calculateMetadata={calculateReelMetadata}
    />
  );
};
