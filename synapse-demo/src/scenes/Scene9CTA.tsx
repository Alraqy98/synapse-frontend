import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";

export const Scene9CTA: React.FC<{ frame: number }> = ({ frame }) => {
  const logoOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowPhase = (frame % 90) / 90;
  const glowOpacity = 0.15 + (Math.sin(glowPhase * Math.PI * 2) * 0.5 + 0.5) * 0.2;
  const fadeOut = interpolate(
    frame,
    [500, 600],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: BRAND.background,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(45,212,191,${glowOpacity}) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: logoOpacity,
        }}
      >
        <div style={{ width: 120, height: 120 }}>
          <img
            src="/logo.png"
            alt="Synapse"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: "0.25em",
            color: BRAND.textPrimary,
          }}
        >
          SYNAPSE
        </div>
        <div style={{ fontSize: 24, color: BRAND.primary }}>trysynapse.com</div>
        <div style={{ fontSize: 18, color: BRAND.textMuted, fontStyle: "italic", marginTop: 8 }}>
          The study platform that thinks like a clinician.
        </div>
      </div>
    </AbsoluteFill>
  );
};
