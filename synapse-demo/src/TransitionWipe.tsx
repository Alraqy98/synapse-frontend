import React from "react";
import { interpolate } from "remotion";
import { BRAND } from "./brand";

const WIPE_DURATION = 15;

type TransitionWipeProps = {
  frame: number;
  startFrame: number;
  children: React.ReactNode;
};

/**
 * Horizontal wipe: content slides in from right. Teal flash at midpoint (frame 7).
 */
export const TransitionWipe: React.FC<TransitionWipeProps> = ({
  frame,
  startFrame,
  children,
}) => {
  const localFrame = frame - startFrame;
  const progress = interpolate(
    localFrame,
    [0, WIPE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const clipRight = interpolate(progress, [0, 1], [100, 0]); // % to hide from right
  const flashOpacity =
    localFrame >= 0 && localFrame < WIPE_DURATION && Math.floor(localFrame) === 7
      ? 1
      : 0;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 ${clipRight}% 0 0)`,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      {/* Teal flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(45,212,191,0.3)",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
