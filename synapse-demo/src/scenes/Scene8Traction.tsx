import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";
import { useCountUp } from "../hooks/useCountUp";

const STATS = [
  { value: 3348, label: "MCQs Generated", teal: true },
  { value: 164, label: "Study Decks Created", teal: false },
  { value: 17, label: "Beta Users", teal: false },
  { value: "YC S25", label: "Application", teal: true, isString: true },
];

export const Scene8Traction: React.FC<{ frame: number }> = ({ frame }) => {
  const stagger = 20;
  const countDuration = 40;
  const stat1 = useCountUp(frame, 0, countDuration, 3348);
  const stat2 = useCountUp(frame, stagger, stagger + countDuration, 164);
  const stat3 = useCountUp(frame, stagger * 2, stagger * 2 + countDuration, 17);
  const bottomOpacity = interpolate(
    frame,
    [1960, 2020],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: BRAND.background,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(45,212,191,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,212,191,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          padding: 80,
        }}
      >
        {STATS.map((s, i) => {
          const start = i * stagger;
          const end = start + countDuration;
          const opacity = interpolate(
            frame,
            [start, start + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const displayValue = s.isString
            ? "YC S25"
            : i === 0
            ? Math.round(stat1)
            : i === 1
            ? Math.round(stat2)
            : i === 2
            ? Math.round(stat3)
            : "YC S25";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity,
              }}
            >
              <span
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 80,
                  fontWeight: 700,
                  color: s.teal ? BRAND.primary : BRAND.textPrimary,
                }}
              >
                {displayValue}
              </span>
              <span
                style={{
                  fontSize: 18,
                  color: BRAND.textSecondary,
                  marginTop: 8,
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: 20,
          color: BRAND.textSecondary,
          fontStyle: "italic",
          opacity: bottomOpacity,
        }}
      >
        Pre-revenue. Pre-launch. Already irreplaceable to its users.
      </div>
    </AbsoluteFill>
  );
};
