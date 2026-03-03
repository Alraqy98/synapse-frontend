import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";

const WORDS = [
  { text: "Medical", teal: false },
  { text: "students", teal: false },
  { text: "spend", teal: false },
  { text: "40%", teal: false },
  { text: "of", teal: false },
  { text: "study", teal: false },
  { text: "time", teal: false },
  { text: "fighting", teal: true },
  { text: "their", teal: true },
  { text: "tools.", teal: true },
];

const WORD_DURATION = 12;
const UNDERLINE_START = 120;
const UNDERLINE_END = 140;
const FADE_START = 140;
const FADE_END = 150;

export const Scene1Hook: React.FC<{ frame: number }> = ({ frame }) => {
  const fadeToBg = interpolate(
    frame,
    [FADE_START, FADE_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const bgColor = fadeToBg < 1 ? "#000000" : "#0D0F12";
  const contentOpacity = 1 - fadeToBg;

  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Syne, sans-serif",
      }}
    >
      <div style={{ opacity: contentOpacity }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "0.2em 0.35em",
            maxWidth: 1000,
            padding: 40,
            lineHeight: 1.2,
          }}
        >
          {WORDS.map(({ text, teal }, i) => {
            const start = i * WORD_DURATION;
            const opacity = interpolate(
              frame,
              [start, start + 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const y = interpolate(
              frame,
              [start, start + 8],
              [8, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <span
                key={i}
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  color: teal ? BRAND.primary : BRAND.textPrimary,
                  opacity,
                  transform: `translateY(${y}px)`,
                  display: "inline-block",
                }}
              >
                {text}
              </span>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginTop: 4,
          }}
        >
          <div
            style={{
              height: 3,
              background: BRAND.primary,
              opacity: interpolate(
                frame,
                [UNDERLINE_START, UNDERLINE_END],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
              transform: `scaleX(${interpolate(
                frame,
                [UNDERLINE_START, UNDERLINE_END],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )})`,
              transformOrigin: "left",
              width: 420,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
