import { useState } from "react";
import useLearningState from "./hooks/useLearningState";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_STATES = {
  declining: {
    overall_state: "DECLINING",
    momentum: -18,
    primary_risk_concept: "Acid-Base Regulation",
    root_cause: "High-exposure, low-retention: answered 34 times, accuracy trending -22% over 12 days",
    prescription: "Stop repeating. Switch to mechanism-first review of Henderson-Hasselbalch before next attempt.",
    chronic_risk: false,
    days_in_state: 5,
    transition_history: [
      { date: "Jan 28", state: "STABLE" },
      { date: "Feb 3", state: "IMPROVING" },
      { date: "Feb 10", state: "STABLE" },
      { date: "Feb 14", state: "DECLINING" },
    ],
    concept_breakdown: [
      { name: "Acid-Base Regulation", accuracy: 41, attempts: 34, trend: -22, facet: "Mechanism" },
      { name: "Renal Tubular Transport", accuracy: 58, attempts: 21, trend: -8, facet: "Application" },
      { name: "Cardiac Output", accuracy: 73, attempts: 18, trend: +4, facet: "Physiology" },
      { name: "Loop Diuretics", accuracy: 62, attempts: 15, trend: -3, facet: "Pharmacology" },
      { name: "GFR Regulation", accuracy: 79, attempts: 12, trend: +11, facet: "Physiology" },
    ],
    session_accuracy: [52, 49, 61, 55, 48, 43, 44, 41],
    cohort_percentile: 31,
    session_efficiency: 2.1,
  },
  accelerating: {
    overall_state: "DECLINING",
    momentum: -34,
    primary_risk_concept: "Pulmonary Mechanics",
    root_cause: "Accelerating decline: accuracy dropped 34% in 6 days across 3 decks simultaneously. Pattern suggests conceptual gap, not fatigue.",
    prescription: "Pause MCQ. Read Costanzo Ch. 5 pp. 201–218 before attempting further questions on this concept cluster.",
    chronic_risk: true,
    days_in_state: 9,
    transition_history: [
      { date: "Feb 1", state: "STABLE" },
      { date: "Feb 5", state: "DECLINING" },
      { date: "Feb 9", state: "DECLINING" },
    ],
    concept_breakdown: [
      { name: "Pulmonary Mechanics", accuracy: 33, attempts: 41, trend: -34, facet: "Mechanism" },
      { name: "V/Q Mismatch", accuracy: 39, attempts: 28, trend: -27, facet: "Pathophysiology" },
      { name: "Lung Compliance", accuracy: 45, attempts: 19, trend: -18, facet: "Physics" },
      { name: "Surfactant Function", accuracy: 51, attempts: 14, trend: -9, facet: "Biochemistry" },
      { name: "Hypoxic Vasoconstriction", accuracy: 67, attempts: 9, trend: +2, facet: "Physiology" },
    ],
    session_accuracy: [68, 61, 55, 51, 44, 39, 35, 33],
    cohort_percentile: 18,
    session_efficiency: 1.4,
  },
  stable_low: {
    overall_state: "STABLE",
    momentum: +1,
    primary_risk_concept: "Pharmacokinetics",
    root_cause: "Persistent plateau: 61% accuracy maintained for 18 days with no upward trajectory. Practice volume is adequate; comprehension depth is not.",
    prescription: "Add spaced retrieval: after each correct answer, generate a 1-sentence mechanistic explanation before moving on.",
    chronic_risk: false,
    days_in_state: 18,
    transition_history: [
      { date: "Jan 10", state: "DECLINING" },
      { date: "Jan 20", state: "STABLE" },
      { date: "Feb 7", state: "STABLE" },
    ],
    concept_breakdown: [
      { name: "Pharmacokinetics", accuracy: 61, attempts: 56, trend: +1, facet: "Calculation" },
      { name: "Drug Metabolism", accuracy: 64, attempts: 38, trend: 0, facet: "Biochemistry" },
      { name: "Receptor Pharmacology", accuracy: 58, attempts: 31, trend: +2, facet: "Mechanism" },
      { name: "Antibiotic Classes", accuracy: 71, attempts: 24, trend: +3, facet: "Classification" },
      { name: "Autonomic Drugs", accuracy: 59, attempts: 22, trend: -1, facet: "Application" },
    ],
    session_accuracy: [60, 62, 61, 59, 63, 61, 62, 61],
    cohort_percentile: 44,
    session_efficiency: 3.2,
  },
  chronic: {
    overall_state: "STABLE",
    momentum: -3,
    primary_risk_concept: "Immunology",
    root_cause: "Chronic risk pattern: this concept cluster has returned to <65% accuracy 4 times in 90 days. Each recovery has been followed by regression within 3 weeks.",
    prescription: "This concept requires a structured review session, not incremental MCQ repetition. Schedule 2 hours: read → self-test → explain-back.",
    chronic_risk: true,
    days_in_state: 11,
    transition_history: [
      { date: "Nov 15", state: "DECLINING" },
      { date: "Dec 1", state: "STABLE" },
      { date: "Dec 20", state: "DECLINING" },
      { date: "Jan 4", state: "STABLE" },
      { date: "Jan 25", state: "DECLINING" },
      { date: "Feb 8", state: "STABLE" },
    ],
    concept_breakdown: [
      { name: "Immunology", accuracy: 64, attempts: 89, trend: -3, facet: "Mechanism" },
      { name: "MHC & Presentation", accuracy: 61, attempts: 54, trend: -5, facet: "Cell Biology" },
      { name: "Complement System", accuracy: 58, attempts: 41, trend: -2, facet: "Biochemistry" },
      { name: "Hypersensitivity", accuracy: 69, attempts: 37, trend: +4, facet: "Pathophysiology" },
      { name: "Autoimmune Markers", accuracy: 72, attempts: 28, trend: +1, facet: "Diagnostics" },
    ],
    session_accuracy: [67, 65, 63, 66, 64, 63, 65, 64],
    cohort_percentile: 39,
    session_efficiency: 2.8,
  },
};

// ─── STATE CONFIG ──────────────────────────────────────────────────────────
const STATE_CONFIG = {
  DECLINING: {
    label: "DECLINING",
    color: "#E55A4E",
    colorDim: "#7A2D28",
    colorBg: "rgba(229,90,78,0.08)",
    colorBorder: "rgba(229,90,78,0.25)",
    dot: "#E55A4E",
  },
  STABLE: {
    label: "STABLE",
    color: "#C4A84F",
    colorDim: "#7A6520",
    colorBg: "rgba(196,168,79,0.08)",
    colorBorder: "rgba(196,168,79,0.25)",
    dot: "#C4A84F",
  },
  IMPROVING: {
    label: "IMPROVING",
    color: "#4E9E7A",
    colorDim: "#2A5C47",
    colorBg: "rgba(78,158,122,0.08)",
    colorBorder: "rgba(78,158,122,0.25)",
    dot: "#4E9E7A",
  },
};

// ─── MICROCOPY ENGINE ──────────────────────────────────────────────────────
function getMicrocopy(data) {
  // Extract values with fallback to old structure for backward compatibility
  const overall_state = data.overall?.state || data.overall_state;
  const momentum = data.overall?.momentum || data.momentum;
  const chronic_risk = data.chronic_risk;
  const days_in_state = data.days_in_state;
  const transition_history = data.transition || data.transition_history;

  if (overall_state === "DECLINING" && momentum <= -30) {
    return {
      headline: "Accelerating decline detected.",
      subline: `Accuracy dropped ${Math.abs(momentum)}% in ${days_in_state} days across multiple concepts. This is a pattern, not noise.`,
      urgency: "URGENT",
      cta: "Stop repeating. Fix the gap.",
    };
  }
  if (overall_state === "DECLINING") {
    return {
      headline: "Performance is declining.",
      subline: `${days_in_state} days on a downward trajectory. More practice on the same material will not reverse this.`,
      urgency: "HIGH",
      cta: "Change your approach.",
    };
  }
  if (overall_state === "STABLE" && chronic_risk) {
    return {
      headline: "Chronic risk pattern.",
      subline: `This concept cluster has regressed ${transition_history.filter(t => t.state === "DECLINING").length} times. Repetition is not building retention.`,
      urgency: "MODERATE",
      cta: "Structured review required.",
    };
  }
  if (overall_state === "STABLE" && momentum <= 2) {
    return {
      headline: "Stable, but not improving.",
      subline: `${days_in_state} days without meaningful gain. Volume is there. Depth is not.`,
      urgency: "WATCH",
      cta: "Adjust study method.",
    };
  }
  return {
    headline: "Performance is improving.",
    subline: `Momentum: +${momentum}%. Keep the current approach.`,
    urgency: "LOW",
    cta: null,
  };
}

// ─── MINI SPARKLINE ────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 36 }) {
  const w = 120, h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="2.5" fill={color} />
    </svg>
  );
}

// ─── ACCURACY BAR ─────────────────────────────────────────────────────────
function AccuracyBar({ value, trend }) {
  const color = value >= 75 ? "#4E9E7A" : value >= 60 ? "#C4A84F" : "#E55A4E";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color, minWidth: 28, textAlign: "right" }}>{value}%</span>
      {trend !== 0 && (
        <span style={{ fontSize: 10, color: trend > 0 ? "#4E9E7A" : "#E55A4E", minWidth: 24, textAlign: "right" }}>
          {trend > 0 ? "+" : ""}{trend}
        </span>
      )}
    </div>
  );
}

// ─── TRANSITION TIMELINE ──────────────────────────────────────────────────
function TransitionTimeline({ history }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {history.map((item, i) => {
        const cfg = STATE_CONFIG[item.state];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i === history.length - 1 ? cfg.dot : "transparent",
                border: `1.5px solid ${cfg.dot}`,
              }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{item.date}</span>
            </div>
            {i < history.length - 1 && (
              <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 2px", marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const map = {
    URGENT: { bg: "rgba(229,90,78,0.15)", color: "#E55A4E", border: "rgba(229,90,78,0.4)", text: "URGENT" },
    HIGH:   { bg: "rgba(229,90,78,0.1)",  color: "#E55A4E", border: "rgba(229,90,78,0.3)", text: "HIGH RISK" },
    MODERATE: { bg: "rgba(196,168,79,0.12)", color: "#C4A84F", border: "rgba(196,168,79,0.35)", text: "CHRONIC RISK" },
    WATCH:  { bg: "rgba(196,168,79,0.08)", color: "#C4A84F", border: "rgba(196,168,79,0.25)", text: "WATCH" },
    LOW:    { bg: "rgba(78,158,122,0.1)",  color: "#4E9E7A", border: "rgba(78,158,122,0.3)", text: "ON TRACK" },
  };
  const s = map[urgency] || map.LOW;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 9px", borderRadius: 3,
      background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: s.color, letterSpacing: "0.08em" }}>{s.text}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function PerformancePage() {
  const { data: apiData, loading } = useLearningState();
  const [activeScenario, setActiveScenario] = useState("declining");
  const [activeTab, setActiveTab] = useState("status");
  const [expandedConcept, setExpandedConcept] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // Use API data if available, otherwise fall back to mock data
  const data = apiData || MOCK_STATES[activeScenario];
  
  // Debug logging
  console.log("Learning state data:", data);

  // Extract values with fallback to old structure for backward compatibility
  const overallState = data.overall?.state || data.overall_state;
  const momentum = data.overall?.momentum || data.momentum;
  const transitionHistory = data.transition || data.transition_history;
  const chronicRisk = data.chronic_risk;
  const daysInState = data.days_in_state;

  const cfg = STATE_CONFIG[overallState];
  const copy = getMicrocopy(data);

  const handleScenario = (s) => {
    setActiveScenario(s);
    setAnimKey(k => k + 1);
    setExpandedConcept(null);
  };

  // Show loading state while fetching API data
  if (loading && !apiData) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0C0C0E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#E8E8E8",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#4E9E7A",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Loading learning state...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0C0C0E",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "#E8E8E8",
      padding: "24px 20px 60px",
      boxSizing: "border-box",
    }}>
      {/* Google Fonts load */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .scenario-btn {
          padding: 5px 12px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.4); cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.05em;
          transition: all 0.15s;
        }
        .scenario-btn:hover { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.7); }
        .scenario-btn.active { border-color: rgba(255,255,255,0.4); color: #E8E8E8; background: rgba(255,255,255,0.05); }

        .tab-btn {
          padding: 6px 0; border: none; background: transparent;
          font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.06em;
          cursor: pointer; transition: all 0.15s; border-bottom: 1.5px solid transparent;
          color: rgba(255,255,255,0.35);
        }
        .tab-btn.active { color: #E8E8E8; border-bottom-color: #E8E8E8; }
        .tab-btn:hover:not(.active) { color: rgba(255,255,255,0.6); }

        .concept-row {
          padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer; transition: background 0.1s;
        }
        .concept-row:hover { background: rgba(255,255,255,0.02); }
        .concept-row:last-child { border-bottom: none; }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim { animation: fadeSlide 0.3s ease both; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .cohort-fill {
          height: 100%;
          transition: width 0.8s ease;
        }
      `}</style>

      {/* ── Scenario Switcher ── */}
      <div style={{ maxWidth: 620, margin: "0 auto 32px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", marginRight: 4 }}>SCENARIO</span>
        {[
          { key: "declining", label: "DECLINING" },
          { key: "accelerating", label: "ACCEL. DECLINE" },
          { key: "stable_low", label: "STABLE / LOW" },
          { key: "chronic", label: "CHRONIC RISK" },
        ].map(s => (
          <button key={s.key} className={`scenario-btn ${activeScenario === s.key ? "active" : ""}`} onClick={() => handleScenario(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── PANEL ── */}
      <div key={animKey} className="anim" style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* ── BLOCK 1: Identity Header ── */}
        <div style={{
          padding: "16px 20px", marginBottom: 1,
          background: "#111114", borderRadius: "8px 8px 0 0",
          border: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>
              LEARNING STATUS
            </span>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
            </span>
          </div>
          <UrgencyBadge urgency={copy.urgency} />
        </div>

        {/* ── BLOCK 2: State Signal ── */}
        <div style={{
          padding: "24px 20px 20px",
          background: "#111114",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: `2px solid ${cfg.color}`,
          marginBottom: 1,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500,
                  color: cfg.color, letterSpacing: "-0.01em",
                }}>
                  {cfg.label}
                </span>
                {momentum !== 0 && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 12,
                    color: momentum > 0 ? "#4E9E7A" : "#E55A4E",
                  }}>
                    {momentum > 0 ? "+" : ""}{momentum}%
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 400, color: "#E8E8E8", lineHeight: 1.45, maxWidth: 380 }}>
                {copy.headline} <span style={{ color: "rgba(255,255,255,0.5)" }}>{copy.subline}</span>
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 2, fontFamily: "'DM Mono', monospace" }}>DAY {daysInState}</div>
              <Sparkline data={data.session_accuracy} color={cfg.color} height={40} />
            </div>
          </div>

          {/* State timeline */}
          <TransitionTimeline history={transitionHistory} />
        </div>

        {/* ── BLOCK 3: Primary Risk ── */}
        <div style={{
          padding: "16px 20px", marginBottom: 1,
          background: "#111114",
          border: "1px solid rgba(255,255,255,0.07)",
          borderLeft: `3px solid ${cfg.color}`,
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 5 }}>PRIMARY RISK</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: cfg.color, marginBottom: 4 }}>{data.primary_risk_concept}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{data.root_cause}</div>
            </div>
            {chronicRisk && (
              <div style={{
                flexShrink: 0, alignSelf: "flex-start",
                padding: "4px 8px", borderRadius: 3,
                background: "rgba(196,168,79,0.1)", border: "1px solid rgba(196,168,79,0.3)",
              }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#C4A84F", letterSpacing: "0.08em", marginBottom: 2 }}>CHRONIC</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(196,168,79,0.7)" }}>RECURRING</div>
              </div>
            )}
          </div>
        </div>

        {/* ── BLOCK 4: Prescription ── */}
        <div style={{
          padding: "14px 20px", marginBottom: 1,
          background: "#0F1612",
          border: "1px solid rgba(78,158,122,0.2)",
        }}>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "rgba(78,158,122,0.6)", letterSpacing: "0.1em", marginBottom: 5 }}>PRESCRIBED ACTION</div>
          <p style={{ margin: 0, fontSize: 13, color: "#C8DDD4", lineHeight: 1.55 }}>
            {data.prescription}
          </p>
          {copy.cta && (
            <button style={{
              marginTop: 12, padding: "7px 14px", borderRadius: 4,
              background: "rgba(78,158,122,0.12)", border: "1px solid rgba(78,158,122,0.35)",
              color: "#4E9E7A", fontFamily: "'DM Mono', monospace", fontSize: 11,
              cursor: "pointer", letterSpacing: "0.05em",
            }}>
              {copy.cta}
            </button>
          )}
        </div>

        {/* ── BLOCK 5: Tabs — Concepts / Session / Cohort ── */}
        <div style={{
          background: "#111114",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "0 0 8px 8px",
          marginBottom: 0,
        }}>
          {/* Tab nav */}
          <div style={{
            display: "flex", gap: 20, padding: "0 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {["status", "concepts", "session"].map(t => (
              <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── Tab: STATUS ── */}
          {activeTab === "status" && (
            <div style={{ padding: "16px 20px" }}>
              {/* 3-stat row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "COHORT RANK", value: `${data.cohort_percentile}th`, sub: "percentile among peers" },
                  { label: "EFFICIENCY", value: `${data.session_efficiency.toFixed(1)}`, sub: "correct / min this week" },
                  { label: "ATTEMPTS", value: data.concept_breakdown.reduce((a, c) => a + c.attempts, 0), sub: "on risk concept cluster" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "12px 0" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", marginBottom: 5 }}>{s.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: "#E8E8E8", marginBottom: 3 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cohort bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>COHORT POSITION</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>vs. students at same study stage</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                  <div className="cohort-fill" style={{ width: `${data.cohort_percentile}%`, background: data.cohort_percentile >= 60 ? "#4E9E7A" : data.cohort_percentile >= 40 ? "#C4A84F" : "#E55A4E", borderRadius: 3 }} />
                  <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.2)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>0th</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>median</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>100th</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: CONCEPTS ── */}
          {activeTab === "concepts" && (
            <div style={{ padding: "12px 20px" }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.25)", marginBottom: 12, letterSpacing: "0.08em" }}>
                TAP A CONCEPT TO SEE QUESTION-LEVEL EVIDENCE
              </div>
              {data.concept_breakdown.map((concept, i) => (
                <div key={i} className="concept-row" onClick={() => setExpandedConcept(expandedConcept === i ? null : i)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: expandedConcept === i ? 10 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: concept.accuracy < 60 ? "#E55A4E" : concept.accuracy < 75 ? "#C4A84F" : "#4E9E7A" }}>
                          {concept.name}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", padding: "1px 5px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
                          {concept.facet}
                        </span>
                      </div>
                      <AccuracyBar value={concept.accuracy} trend={concept.trend} />
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>{concept.attempts} attempts</div>
                      <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>{expandedConcept === i ? "▲" : "▼"}</div>
                    </div>
                  </div>

                  {/* Drill-down proof layer */}
                  {expandedConcept === i && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 4,
                      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.3)", marginBottom: 8, letterSpacing: "0.08em" }}>QUESTION-LEVEL EVIDENCE</div>
                      {[
                        { q: "A 22-year-old presents with pH 7.28, PCO₂ 18 mmHg, HCO₃ 8 mEq/L. What is the primary disorder?", attempts: 5, correct: 1, time: "3.2 min avg", page: "Costanzo p. 302" },
                        { q: "Which buffer system provides the fastest response to acute acidosis?", attempts: 3, correct: 0, time: "4.1 min avg", page: "Costanzo p. 289" },
                      ].map((q, qi) => (
                        <div key={qi} style={{ marginBottom: qi === 0 ? 10 : 0, paddingBottom: qi === 0 ? 10 : 0, borderBottom: qi === 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>{q.q}</p>
                          <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: q.correct === 0 ? "#E55A4E" : "#C4A84F" }}>
                              {q.correct}/{q.attempts} correct
                            </span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{q.time}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(78,158,122,0.7)" }}>→ {q.page}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: SESSION ── */}
          {activeTab === "session" && (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.25)", marginBottom: 14, letterSpacing: "0.08em" }}>8-SESSION ACCURACY HISTORY</div>
              {/* Session chart - manual bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 8 }}>
                {data.session_accuracy.map((v, i) => {
                  const isLast = i === data.session_accuracy.length - 1;
                  const color = v >= 75 ? "#4E9E7A" : v >= 60 ? "#C4A84F" : "#E55A4E";
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: isLast ? color : "rgba(255,255,255,0.2)" }}>{v}</span>
                      <div style={{ width: "100%", background: isLast ? color : "rgba(255,255,255,0.08)", borderRadius: 2, height: `${(v / 100) * 60}px`, transition: "height 0.4s ease" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>8 sessions ago</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>current</span>
              </div>

              <div style={{ marginTop: 20, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 10, letterSpacing: "0.1em" }}>SESSION EFFICIENCY (correct / min)</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, color: "#E8E8E8" }}>{data.session_efficiency.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>correct answers per minute</span>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                  {data.session_efficiency < 2.5
                    ? "Low efficiency suggests extended hesitation or guessing. Speed-accuracy balance is off."
                    : "Efficiency is acceptable. Accuracy is the limiting factor, not cognitive speed."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SPEC ANNOTATIONS (below panel) ── */}
      <div style={{ maxWidth: 620, margin: "48px auto 0" }}>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", marginBottom: 20 }}>DESIGN SPEC — COMPONENT BLUEPRINT</div>

          {[
            { block: "BLOCK 1", name: "Identity Header", source: "analytics_snapshots.created_at, urgency computed from state + momentum", note: "Always visible. Date grounds the data in time. Badge communicates triage level before anything else is read." },
            { block: "BLOCK 2", name: "State Signal", source: "overall_state, momentum, session_accuracy[], days_in_state", note: "Largest type on the panel. State + momentum is the only thing that matters for opening read. Sparkline shows trajectory, not just position." },
            { block: "BLOCK 3", name: "Primary Risk", source: "primary_risk_concept, root_cause, chronic_risk", note: "Left border color matches state. Chronic badge only appears when chronic_risk=true. Root cause explains why — not just what." },
            { block: "BLOCK 4", name: "Prescription", source: "prescription", note: "Distinct background color. Green = forward action, not alarm. CTA is a soft directive, not a CTA button. Medical tone, not growth-hacking tone." },
            { block: "BLOCK 5a", name: "Status Tab", source: "cohort_percentile, session_efficiency, concept_breakdown[].attempts", note: "Three numbers. Cohort bar shows relative position with median marker. Context is everything — 62% means nothing without the median." },
            { block: "BLOCK 5b", name: "Concepts Tab", source: "concept_breakdown[], mcq_user_answers, mcq_question_concept_mentions", note: "Every concept is tappable. Drill-down shows actual question text + attempt history + source page. This is the proof layer." },
            { block: "BLOCK 5c", name: "Session Tab", source: "session_accuracy[], session_efficiency", note: "8-session bar chart. No line chart — bars communicate discreteness of sessions. Efficiency metric contextualizes accuracy." },
          ].map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>{s.block}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{s.name}</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(78,158,122,0.6)", marginBottom: 4 }}>{s.source}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
