import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";
import { Sidebar } from "../components/Sidebar";
import { MOCK_LEARNING_STATE, MOCK_REINFORCEMENT_SESSION } from "../staticData";

const STABLE_COLOR = "#C4A84F";

export const Scene6LearningModal: React.FC<{ frame: number }> = ({ frame }) => {
  const partA = frame < 180;
  const partB = frame >= 180 && frame < 300;
  const partC = frame >= 300;

  const pageFade = interpolate(frame, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseOpacity = partA && frame >= 80
    ? 0.6 + 0.4 * Math.sin((frame - 80) * 0.3) * 0.5
    : 1;
  const buttonHover = partA && frame >= 120;
  const wipeProgress = interpolate(
    frame,
    [180, 195],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const optionBSelected = partC && frame >= 340;
  const explanationReveal = partC && frame >= 370;
  const nextVisible = partC && frame >= 390;
  const overlayOpacity = interpolate(
    frame,
    [400, 420],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: BRAND.background,
        fontFamily: "Inter, sans-serif",
        opacity: pageFade,
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: 28,
          background: "#2d2d2d",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar active="barchart" />

        {/* PART A: Learning Status */}
        {partA && (
          <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: BRAND.textMuted, fontFamily: "monospace" }}>
                LEARNING STATUS | Last computed: just now | b3113dfc
              </span>
              <button
                style={{
                  padding: "6px 12px",
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 6,
                  background: BRAND.cardBg,
                  color: BRAND.textSecondary,
                  fontSize: 12,
                }}
              >
                ● WATCH
              </button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: `1px solid ${BRAND.primary}`,
                  color: BRAND.primary,
                  fontSize: 12,
                }}
              >
                {MOCK_LEARNING_STATE.specialty}
              </span>
            </div>
            <div
              style={{
                background: BRAND.cardBg,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: STABLE_COLOR }}>{MOCK_LEARNING_STATE.state}</span>
                <span style={{ fontSize: 24, fontWeight: 600, color: BRAND.warningOrange }}>{MOCK_LEARNING_STATE.momentum}%</span>
              </div>
              <div style={{ fontSize: 16, color: BRAND.textSecondary, lineHeight: 1.5, marginBottom: 4 }}>
                Primary risk: {MOCK_LEARNING_STATE.primaryRisk.concept} — {MOCK_LEARNING_STATE.primaryRisk.accuracy}% accuracy, {MOCK_LEARNING_STATE.primaryRisk.attempts} attempts.
              </div>
              <div style={{ fontSize: 14, color: BRAND.textMuted }}>
                {MOCK_LEARNING_STATE.intervention.type} · {MOCK_LEARNING_STATE.intervention.duration} min session recommended.
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 16, flexWrap: "wrap" }}>
                {Array.from({ length: 22 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: BRAND.primary,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: BRAND.primary, letterSpacing: "0.15em", marginBottom: 8 }}>
              PRIMARY RISK
            </div>
            <div
              style={{
                opacity: pulseOpacity,
                marginBottom: 4,
                fontSize: 20,
                fontWeight: 700,
                color: BRAND.warningOrange,
              }}
            >
              Congenital Glaucoma
            </div>
            <div style={{ fontSize: 13, color: "rgba(249,115,22,0.8)", marginBottom: 4 }}>
              This concept is actively limiting your performance.
            </div>
            <div style={{ fontSize: 12, color: BRAND.textMuted, marginBottom: 20 }}>
              0% accuracy (3 attempts)
            </div>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                background: BRAND.cardBg,
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
                fontSize: 11,
                color: BRAND.textMuted,
                marginBottom: 24,
              }}
            >
              Low accuracy trend
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: BRAND.primary, letterSpacing: "0.15em" }}>INTERVENTION PLAN</span>
              <span style={{ fontSize: 13, color: BRAND.textMuted }}>20 minutes</span>
            </div>
            <div
              style={{
                background: BRAND.cardBg,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.textPrimary, fontFamily: "monospace", marginBottom: 4 }}>
                MEMORY_REINFORCEMENT
              </div>
              <div style={{ fontSize: 14, color: BRAND.primary, marginBottom: 4 }}>→ Focus concept: Congenital Glaucoma</div>
              <div style={{ fontSize: 13, color: BRAND.textMuted, marginBottom: 12 }}>
                Targeting this instability should improve your overall trajectory.
              </div>
              <button
                style={{
                  padding: "10px 20px",
                  border: `1px solid ${buttonHover ? BRAND.primary : BRAND.border}`,
                  borderRadius: 8,
                  background: "transparent",
                  color: buttonHover ? BRAND.primary : BRAND.textSecondary,
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              >
                Start 20-Minute Focus Session
              </button>
            </div>
          </div>
        )}

        {/* PART B: Reinforcement prep */}
        {partB && (
          <div
            style={{
              flex: 1,
              padding: "24px 32px",
              opacity: interpolate(frame, [180, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              transform: `translateX(${(1 - wipeProgress) * 50}px)`,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <a style={{ fontSize: 14, color: BRAND.textMuted, textDecoration: "none" }}>← Back to Learning Status</a>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: BRAND.textPrimary, marginBottom: 12 }}>
              Congenital Glaucoma
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 12,
                  color: BRAND.textSecondary,
                }}
              >
                Level 0 · Foundational
              </span>
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: BRAND.errorRed,
                  fontSize: 12,
                  color: BRAND.textPrimary,
                }}
              >
                High Risk
              </span>
            </div>
            <div style={{ display: "flex", gap: 32, marginBottom: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: BRAND.textMuted, letterSpacing: "0.1em", marginBottom: 4 }}>ROLLING ACCURACY</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: BRAND.textPrimary }}>0%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: BRAND.textMuted, letterSpacing: "0.1em", marginBottom: 4 }}>EXPOSURE COUNT</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: BRAND.textPrimary }}>3</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: BRAND.textMuted, letterSpacing: "0.1em", marginBottom: 4 }}>SESSION DURATION</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: BRAND.textPrimary }}>20 min</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: BRAND.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>
              You struggled with this concept recently. A short focused session will reinforce memory traces and improve retention.
            </div>
            <div
              style={{
                background: "#0f1115",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: BRAND.textPrimary, marginBottom: 4 }}>
                Why You&apos;re Struggling With <span style={{ color: BRAND.primary }}>Congenital Glaucoma</span>
              </div>
              <div style={{ fontSize: 13, color: BRAND.textMuted, marginBottom: 8 }}>
                2 incorrect attempts traced to source material
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: BRAND.textPrimary, marginBottom: 4 }}>
                5 Newborn Physical Examination.pdf
              </div>
              <div style={{ fontSize: 13, color: BRAND.primary, fontFamily: "monospace", marginBottom: 4 }}>
                p. 23 · p. 66 · p. 68
              </div>
              <div style={{ fontSize: 13, color: BRAND.textMuted, fontStyle: "italic" }}>
                Question preview from source...
              </div>
            </div>
            <button
              style={{
                width: "100%",
                padding: 14,
                background: BRAND.primary,
                color: BRAND.background,
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Start 20 Minute Session
            </button>
          </div>
        )}

        {/* PART C: Reinforcement session */}
        {partC && (
          <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: BRAND.textSecondary }}>Reinforcement Session</span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid ${BRAND.primary}`,
                  color: BRAND.primary,
                  fontSize: 12,
                }}
              >
                Congenital Glaucoma
              </span>
              <span style={{ fontSize: 13, color: BRAND.textMuted }}>1 / 5</span>
              <span style={{ fontSize: 13, color: BRAND.textPrimary, marginLeft: "auto" }}>14:56</span>
            </div>
            <div style={{ fontSize: 11, color: BRAND.primary, letterSpacing: "0.1em", marginBottom: 8 }}>
              QUESTION 1
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: BRAND.textPrimary, lineHeight: 1.5, marginBottom: 20 }}>
              Which anatomical abnormality is primarily responsible for congenital glaucoma?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                "Malformation of the optic nerve",
                "Abnormal development of the trabecular meshwork",
                "Defect in the lens capsule",
                "Retinal vascular malformation",
                "Corneal endothelial dysfunction",
              ].map((text, i) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    background: BRAND.cardBg,
                    border: `1px solid ${i === 1 && optionBSelected ? BRAND.primary : BRAND.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    color: BRAND.textPrimary,
                  }}
                >
                  {["A", "B", "C", "D", "E"][i]}. {text}
                </div>
              ))}
            </div>
            {!explanationReveal && (
              <button
                style={{
                  width: "100%",
                  padding: 12,
                  background: BRAND.cardBg,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 8,
                  color: BRAND.textMuted,
                  fontSize: 14,
                }}
              >
                Submit Answer
              </button>
            )}
            {explanationReveal && (
              <div
                style={{
                  background: BRAND.tealDim,
                  borderLeft: `4px solid ${BRAND.primary}`,
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  fontSize: 14,
                  color: BRAND.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                Congenital glaucoma is an emergency because increased intraocular pressure can damage the optic nerve and lead to permanent vision loss. The trabecular meshwork is the primary site of developmental abnormality.
              </div>
            )}
            {nextVisible && (
              <button
                style={{
                  width: "100%",
                  padding: 14,
                  background: BRAND.primary,
                  color: BRAND.background,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  opacity: interpolate(frame, [390, 410], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                Next
              </button>
            )}
          </div>
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
          fontSize: 32,
          color: BRAND.textPrimary,
          opacity: overlayOpacity,
        }}
      >
        Synapse knows what you&apos;re <span style={{ color: BRAND.primary }}>forgetting.</span> Before your exam does.
      </div>
    </AbsoluteFill>
  );
};
