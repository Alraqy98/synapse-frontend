import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { BRAND } from "../brand";

const FPS = 30;

export const Scene2Intro: React.FC<{ frame: number }> = ({ frame }) => {
  const logoSpring = spring({
    frame: frame - 150,
    fps: FPS,
    config: { stiffness: 80, damping: 14 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.5, 1]);

  const wordmarkOpacity = interpolate(
    frame,
    [180, 220],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const subtitleOpacity = interpolate(
    frame,
    [220, 270],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const taglineOpacity = interpolate(
    frame,
    [270, 330],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const fadeOut = interpolate(
    frame,
    [330, 360],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "#0D0F12",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(45,212,191,0.08) 0%, transparent 600px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            transform: `scale(${logoScale})`,
            width: 120,
            height: 120,
          }}
        >
          <img
            src="/logo.png"
            alt="Synapse"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            opacity: wordmarkOpacity,
            fontFamily: "Syne, sans-serif",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "0.3em",
            color: BRAND.textPrimary,
          }}
        >
          SYNAPSE
        </div>
        <div
          style={{
            opacity: subtitleOpacity,
            fontFamily: "Inter, sans-serif",
            fontSize: 22,
            color: BRAND.textSecondary,
          }}
        >
          Curriculum Intelligence Infrastructure
        </div>
        <div
          style={{
            opacity: taglineOpacity,
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: BRAND.textMuted,
            fontStyle: "italic",
          }}
        >
          For medical students. Built by one.
        </div>
      </div>
    </AbsoluteFill>
  );
};
