import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { useEstilo } from "../estilos";

/**
 * Fondo según el registro visual: degradado teñido, retícula opcional,
 * partículas (polvo / burbujas suaves) deterministas y viñeta.
 */
export const Background: React.FC<{ index?: number; total?: number }> = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const e = useEstilo();

  const dots = useMemo(
    () =>
      new Array(e.particulas === "burbujas" ? 26 : 70).fill(0).map((_, i) => ({
        x: random(`dx${i}`) * width,
        y: random(`dy${i}`) * height,
        r: e.particulas === "burbujas" ? 6 + random(`dr${i}`) * 26 : 0.8 + random(`dr${i}`) * 2.2,
        speed: 0.15 + random(`ds${i}`) * 0.5,
        phase: random(`dp${i}`) * Math.PI * 2,
        alpha: e.particulas === "burbujas" ? 0.04 + random(`da${i}`) * 0.08 : 0.15 + random(`da${i}`) * 0.45,
      })),
    [width, height, e.particulas],
  );

  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(180deg, ${e.fondo.arriba} 0%, ${e.fondo.abajo} 100%)`, overflow: "hidden" }}
    >
      {e.reticula ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            backgroundPosition: `0px ${-(frame * 0.2) % 60}px`,
            maskImage: "radial-gradient(90% 70% at 50% 55%, black 30%, transparent 100%)",
          }}
        />
      ) : null}
      {e.particulas !== "ninguna" ? (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {dots.map((d, i) => {
            const y = (((d.y - frame * d.speed) % height) + height) % height;
            const x = d.x + Math.sin(frame / 60 + d.phase) * 8;
            const tw = 0.6 + 0.4 * Math.sin(frame / 20 + d.phase);
            return e.particulas === "burbujas" ? (
              <circle key={i} cx={x} cy={y} r={d.r} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={d.alpha * tw * 2} />
            ) : (
              <circle key={i} cx={x} cy={y} r={d.r} fill="#fff" opacity={d.alpha * tw} />
            );
          })}
        </svg>
      ) : null}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 45%, transparent 50%, rgba(0,0,0,${e.fondo.vineta}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
