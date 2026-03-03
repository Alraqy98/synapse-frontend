import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";
import { MOCK_MCQ_QUESTION } from "../staticData";

export const Scene5MCQModal: React.FC<{ frame: number }> = ({ frame }) => {
  const showState1 = frame < 150;
  const showState2 = frame >= 150;

  const cardSlide = interpolate(frame, [0, 40], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardOpacity = interpolate(frame, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const optionBHighlight = frame >= 98;
  const overlayOpacity = interpolate(frame, [280, 360], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.background,
        fontFamily: "Inter, sans-serif",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          background: "#2d2d2d",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 760,
          width: "90%",
          background: BRAND.cardBg,
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
          padding: 32,
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
        }}
      >
        {showState1 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: BRAND.textMuted }}>Question 2 of 15</span>
              <span style={{ fontSize: 13, color: BRAND.textMuted }}>13%</span>
            </div>
            <div
              style={{
                height: 4,
                background: BRAND.cardBg,
                borderRadius: 2,
                overflow: "hidden",
                marginBottom: 24,
                border: `1px solid ${BRAND.border}`,
              }}
            >
              <div style={{ width: "13%", height: "100%", background: BRAND.primary, borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, color: BRAND.textPrimary, lineHeight: 1.6, marginBottom: 8 }}>
              {MOCK_MCQ_QUESTION.question}
            </div>
            <div style={{ fontSize: 13, color: BRAND.textMuted, marginBottom: 20 }}>Select the single best answer.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_MCQ_QUESTION.options_full.map((opt) => (
                <div
                  key={opt.letter}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    background: "#1a1d23",
                    borderRadius: 8,
                    border: `1px solid ${opt.letter === "B" && optionBHighlight ? BRAND.primary : BRAND.border}`,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "#1a1d23",
                      color: BRAND.textPrimary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      border: `1px solid ${BRAND.border}`,
                    }}
                  >
                    {opt.letter}
                  </span>
                  <span style={{ fontSize: 15, color: BRAND.textPrimary }}>{opt.option_text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 8,
                  color: BRAND.textSecondary,
                  fontSize: 14,
                }}
              >
                Previous
              </button>
              <button
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 8,
                  color: BRAND.textSecondary,
                  fontSize: 14,
                }}
              >
                Next
              </button>
            </div>
            <div style={{ position: "absolute", top: 24, right: 32, display: "flex", alignItems: "center", gap: 6, color: BRAND.primary, fontSize: 13 }}>
              <span>🚀</span> Astra
            </div>
          </>
        )}

        {showState2 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: BRAND.textMuted }}>Question 1 of 15</span>
              <span style={{ fontSize: 13, color: BRAND.textMuted }}>7%</span>
            </div>
            <div style={{ height: 4, background: BRAND.border, borderRadius: 2, marginBottom: 24 }}>
              <div style={{ width: "7%", height: "100%", background: BRAND.primary, borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, color: BRAND.textPrimary, lineHeight: 1.6, marginBottom: 8 }}>
              {MOCK_MCQ_QUESTION.question}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_MCQ_QUESTION.options_full.map((opt) => (
                <div key={opt.letter}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      background: "#1a1d23",
                      borderRadius: 8,
                      border: `1px solid ${opt.is_correct ? BRAND.primary : BRAND.border}`,
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "#1a1d23",
                        color: BRAND.textPrimary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1px solid ${BRAND.border}`,
                      }}
                    >
                      {opt.letter}
                    </span>
                    <span style={{ fontSize: 15, color: BRAND.textPrimary, flex: 1 }}>{opt.option_text}</span>
                    {opt.is_correct && <span style={{ color: BRAND.primary, fontSize: 18 }}>✓</span>}
                  </div>
                  {opt.explanation && (
                    <div
                      style={{
                        marginTop: 8,
                        marginLeft: 40,
                        padding: 12,
                        background: opt.is_correct ? BRAND.tealDim : "rgba(239,68,68,0.1)",
                        borderLeft: `3px solid ${opt.is_correct ? BRAND.primary : BRAND.errorRed}`,
                        borderRadius: 4,
                        fontSize: 13,
                        color: BRAND.textSecondary,
                        lineHeight: 1.5,
                      }}
                    >
                      {opt.is_correct ? "Why this is correct:" : "Why this is wrong:"} {opt.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: BRAND.tealDim,
                  color: BRAND.textMuted,
                  fontSize: 12,
                }}
              >
                5 Newborn Physical Examination.pdf · Page 12
              </span>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "Syne, sans-serif",
          fontSize: 28,
          color: BRAND.textPrimary,
          opacity: overlayOpacity,
        }}
      >
        High-yield explanations. For every answer. Right and wrong.
      </div>
    </AbsoluteFill>
  );
};
