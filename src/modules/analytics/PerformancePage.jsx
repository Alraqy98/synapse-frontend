import { useState } from "react";
import useLearningState from "./hooks/useLearningState";
import useLearningHistory from "./hooks/useLearningHistory";

// ─── RELATIVE TIME HELPER ──────────────────────────────────────────────────
function getRelativeTime(timestamp) {
  if (!timestamp) return "recently";
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

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
  const overall_state = data.overall?.state || data.overall_state;
  
  // Safely extract momentum (can be object with .dot, number, or null)
  const rawMomentum = data.overall?.momentum || data.momentum;
  const momentum = typeof rawMomentum === 'object' && rawMomentum !== null 
    ? (rawMomentum.dot ?? 0) 
    : (rawMomentum ?? 0);
  
  const chronic_risk = data.chronic_risk;
  const days_in_state = data.days_in_state || 0;
  const transition_history = data.transition || data.transition_history || [];

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
  // Guard against null/undefined/empty data
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

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
    <svg width={w} height={h} className="block">
      <polyline 
        points={pts.join(" ")} 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
        strokeLinecap="round" 
        opacity="0.9" 
      />
      <circle 
        cx={pts[pts.length - 1].split(",")[0]} 
        cy={pts[pts.length - 1].split(",")[1]} 
        r="2.5" 
        fill={color} 
      />
    </svg>
  );
}

// ─── ACCURACY BAR ─────────────────────────────────────────────────────────
function AccuracyBar({ value, trend }) {
  const color = value >= 75 ? "#4E9E7A" : value >= 60 ? "#C4A84F" : "#E55A4E";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[3px] bg-white/[0.06] rounded-sm overflow-hidden">
        <div 
          className="h-full rounded-sm transition-all duration-600 ease-out" 
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="font-mono text-xs min-w-[28px] text-right" style={{ color }}>{value}%</span>
      {trend !== 0 && (
        <span 
          className="text-xs min-w-[24px] text-right" 
          style={{ color: trend > 0 ? "#4E9E7A" : "#E55A4E" }}
        >
          {trend > 0 ? "+" : ""}{trend}
        </span>
      )}
    </div>
  );
}

// ─── TRANSITION TIMELINE ──────────────────────────────────────────────────
function TransitionTimeline({ history }) {
  // Guard against null/undefined/non-array history
  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-0">
      {history.map((item, i) => {
        // Safe: fallback to STABLE if state is not in config
        const cfg = STATE_CONFIG[item?.state] || STATE_CONFIG.STABLE;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  background: i === history.length - 1 ? cfg.dot : "transparent",
                  border: `1.5px solid ${cfg.dot}`,
                }}
              />
              <span className="font-mono text-xs text-white/30 whitespace-nowrap">{item?.date || "—"}</span>
            </div>
            {i < history.length - 1 && (
              <div className="w-7 h-px bg-white/10 mx-0.5 mb-4" />
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
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      <span className="font-mono text-xs tracking-wider" style={{ color: s.color }}>{s.text}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function PerformancePage() {
  const { data, loading, error, status, isUpdating, refresh } = useLearningState();
  const { history: apiHistory, loading: historyLoading } = useLearningHistory();
  const [activeTab, setActiveTab] = useState("status");
  const [expandedConcept, setExpandedConcept] = useState(null);

  console.log("Learning state data:", data);
  console.log("Learning history data:", apiHistory);
  console.log("Status:", status, "isUpdating:", isUpdating);

  // Loading state (initial load only)
  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-[3px] border-white/10 border-t-[#4E9E7A] rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-xs text-white/40">
              Loading learning state...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pending state (computing in background, no previous snapshot)
  if (status === "pending" && !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="panel max-w-2xl mx-auto p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4E9E7A]/10 border border-[#4E9E7A]/25 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#4E9E7A] animate-pulse" />
              <span className="font-mono text-xs text-[#4E9E7A] tracking-wider">COMPUTING</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Computing learning state...
            </h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Analyzing your recent practice sessions and historical patterns.
              This usually takes 5–15 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error" && !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="panel max-w-2xl mx-auto p-8 text-center">
          <p className="text-red-400 mb-2">Failed to load learning state</p>
          <p className="text-sm text-white/40 mb-4">{error || "Please try again."}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-semibold text-sm transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state (shouldn't happen with calibration mode, but keep as fallback)
  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="panel p-8 text-center">
          <p className="text-muted">No learning state data available.</p>
          <p className="text-sm text-white/40 mt-2">Complete some MCQ sessions to generate insights.</p>
        </div>
      </div>
    );
  }

  const overallState = data.overall?.state || data.overall_state;
  
  // Calibration Mode (insufficient data state)
  if (overallState === "INSUFFICIENT_DATA") {
    const debugInputs = data.debug?.inputs ?? {};
    const recentTrendPoints = debugInputs.recent_trend_points ?? 0;
    const minPointsRequired = debugInputs.min_points_required ?? 5;
    const progress = minPointsRequired > 0 ? (recentTrendPoints / minPointsRequired) * 100 : 0;

    return (
      <div className="max-w-7xl mx-auto">
        <div className="panel max-w-2xl mx-auto overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 bg-[#111114]/50 border-b border-white/[0.07]">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#4E9E7A]/10 border border-[#4E9E7A]/25 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4E9E7A]" />
              <span className="font-mono text-xs text-[#4E9E7A] tracking-wider">CALIBRATION MODE</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Learning Calibration Mode
            </h2>
            <p className="text-base text-white/60 leading-relaxed">
              We need at least <span className="font-mono text-white">{minPointsRequired}</span> distinct sessions 
              to measure your learning trajectory and detect patterns.
            </p>
          </div>

          {/* Progress Section */}
          <div className="px-6 py-5 bg-[#111114]/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-white/40 tracking-wider">CALIBRATION PROGRESS</span>
              <span className="font-mono text-sm text-white">
                {recentTrendPoints} / {minPointsRequired}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-[#4E9E7A] to-[#5BAE8C] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            {/* Sessions Needed */}
            {recentTrendPoints < minPointsRequired && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <span className="text-sm text-white/50">
                  {minPointsRequired - recentTrendPoints} more {minPointsRequired - recentTrendPoints === 1 ? 'session' : 'sessions'} needed
                </span>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="px-6 py-5 bg-[#0F1612] border-t border-[#4E9E7A]/20">
            <button 
              className="w-full px-5 py-3 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => {
                // TODO: Navigate to MCQ practice
                console.log("Start calibration session");
              }}
            >
              Start 10-minute calibration session
            </button>
            <p className="text-center text-xs text-white/35 mt-3">
              Complete practice sessions to unlock trajectory analysis
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Extract snapshot metadata
  const snapshotId = data.snapshot_id || data.snapshot?.id || null;
  const generatedAt = data.generated_at || data.snapshot?.generated_at || null;
  
  // Safely extract momentum (can be object with .dot, number, or null)
  const rawMomentum = data.overall?.momentum || data.momentum;
  const momentum = typeof rawMomentum === 'object' && rawMomentum !== null 
    ? (rawMomentum.dot ?? 0) 
    : (rawMomentum ?? 0);
  
  const transitionHistory = Array.isArray(apiHistory) ? apiHistory : (data.transition || data.transition_history || []);
  const chronicRisk = data.chronic_risk;
  const daysInState = data.days_in_state || 0;
  
  const cfg = STATE_CONFIG[overallState] || STATE_CONFIG.STABLE;
  const copy = getMicrocopy(data);
  
  // Extract primary risk fields (handle both old flat structure and new structured)
  const primaryRiskConceptId = data.primary_risk?.concept_id || null;
  const primaryRiskConceptName = data.primary_risk?.concept_name || data.primary_risk_concept || "Unknown";
  const primaryRiskAccuracy = data.primary_risk?.accuracy ?? null;
  const primaryRiskAttempts = data.primary_risk?.attempts ?? null;
  const primaryRiskLevel = data.primary_risk?.risk_level ?? null;
  
  // Handle risk_reasons: can be string (legacy) or array (new)
  const primaryRiskReasons = Array.isArray(data.primary_risk?.risk_reasons)
    ? data.primary_risk.risk_reasons
    : (data.primary_risk?.risk_reasons || data.root_cause || "");
  
  // Extract primary_risk_evidence array (defensive default)
  const primaryRiskEvidenceList = Array.isArray(data.primary_risk_evidence) 
    ? data.primary_risk_evidence 
    : [];
  
  // Extract prescription fields (handle structured object)
  const prescriptionData = typeof data.prescription === 'object' && data.prescription !== null
    ? data.prescription
    : null;
  const prescriptionType = prescriptionData?.type || (typeof data.prescription === 'string' ? data.prescription : "");
  const prescriptionDuration = prescriptionData?.duration_minutes ?? null;
  const prescriptionCtaLabel = prescriptionData?.cta_label || copy.cta;
  const prescriptionTarget = prescriptionData?.target ?? null;
  
  // Extract root cause if present (structured object)
  const rootCause = data.root_cause && typeof data.root_cause === 'object' 
    ? data.root_cause 
    : null;
  
  // Defensive defaults for all arrays
  const conceptBreakdown = Array.isArray(data.concept_breakdown) ? data.concept_breakdown : [];
  const sessionAccuracy = Array.isArray(data.session_accuracy) ? data.session_accuracy : [];
  const cohortPercentile = data.cohort_percentile || 0;
  
  // Handle session_efficiency shape (can be number or object)
  const sessionEfficiencyRaw = data.session_efficiency;
  const sessionEfficiency = typeof sessionEfficiencyRaw === 'object' && sessionEfficiencyRaw !== null
    ? sessionEfficiencyRaw
    : { efficiency: typeof sessionEfficiencyRaw === 'number' ? sessionEfficiencyRaw : null, total_correct: 0, total_time_ms: 0 };
  
  const efficiencyValue = typeof sessionEfficiency?.efficiency === 'number' 
    ? sessionEfficiency.efficiency 
    : null;
  
  // Handler for prescription CTA
  const handlePrescriptionClick = () => {
    if (prescriptionTarget?.kind === "concept") {
      // Switch to concepts tab
      setActiveTab("concepts");
      // Try to find the target concept in breakdown
      const targetConceptIndex = conceptBreakdown.findIndex(
        c => c.concept_id === prescriptionTarget.id || c.concept_id === primaryRiskConceptId || c.concept_name === primaryRiskConceptName
      );
      // Expand either the target or primary risk concept
      if (targetConceptIndex !== -1) {
        setExpandedConcept(targetConceptIndex);
      } else {
        // Default to first concept (likely primary risk)
        setExpandedConcept(0);
      }
    } else {
      // For other kinds, show a placeholder message
      console.log("Prescription action:", prescriptionTarget);
      // Could add a toast here if toast library is available
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <style>{`
        .tab-btn {
          padding: 6px 0; border: none; background: transparent;
          font-size: 11px; letter-spacing: 0.06em;
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

        .cohort-fill {
          height: 100%;
          transition: width 0.8s ease;
        }
      `}</style>

      {/* Main Panel */}
      <div className="anim panel max-w-4xl mx-auto overflow-hidden">

        {/* BLOCK 1: Identity Header */}
        <div className="px-5 py-4 mb-px bg-[#111114]/50 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-white/25 tracking-[0.12em]">
              LEARNING STATUS
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="font-mono text-xs text-white/25">
              Last computed: {getRelativeTime(generatedAt)}
            </span>
            {snapshotId && (
              <>
                <span className="w-px h-3 bg-white/10" />
                <span className="font-mono text-xs text-white/15" title={snapshotId}>
                  {snapshotId.slice(0, 8)}
                </span>
              </>
            )}
            {isUpdating && (
              <>
                <span className="w-px h-3 bg-white/10" />
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4E9E7A]/10 border border-[#4E9E7A]/25">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4E9E7A] animate-pulse" />
                  <span className="font-mono text-xs text-[#4E9E7A] tracking-wider">UPDATING</span>
                </span>
              </>
            )}
          </div>
          <UrgencyBadge urgency={copy.urgency} />
        </div>

        {/* BLOCK 2: State Signal */}
        <div 
          className="px-5 pt-6 pb-5 mb-px bg-[#111114]/50 border-b border-white/[0.07] border-t-2"
          style={{ borderTopColor: cfg.color }}
        >
          <div className="flex items-start justify-between gap-4 mb-3.5">
            <div className="flex-1">
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span 
                  className="font-mono text-2xl font-medium tracking-tight"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
                {momentum !== 0 && (
                  <span 
                    className="font-mono text-xs"
                    style={{ color: momentum > 0 ? "#4E9E7A" : "#E55A4E" }}
                  >
                    {momentum > 0 ? "+" : ""}{momentum}%
                  </span>
                )}
              </div>
              <p className="m-0 text-base font-normal leading-[1.45] max-w-[380px]">
                {copy.headline} <span className="text-white/50">{copy.subline}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-xs text-white/30 mb-0.5">DAY {daysInState}</div>
              {sessionAccuracy.length > 0 && <Sparkline data={sessionAccuracy} color={cfg.color} height={40} />}
            </div>
          </div>

          <TransitionTimeline history={transitionHistory} />
        </div>

        {/* BLOCK 3: Primary Risk */}
        <div 
          className="px-5 py-4 mb-px bg-[#111114]/50 border-b border-white/[0.07] border-l-[3px]"
          style={{ borderLeftColor: cfg.color }}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="font-mono text-xs text-white/30 tracking-widest mb-1.5">PRIMARY RISK</div>
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-sm font-medium" style={{ color: cfg.color }}>
                  {primaryRiskConceptName}
                </div>
                {primaryRiskAccuracy != null && (
                  <span className="font-mono text-xs text-white/40">
                    {primaryRiskAccuracy}%
                  </span>
                )}
                {primaryRiskAttempts != null && (
                  <span className="font-mono text-xs text-white/25">
                    {primaryRiskAttempts} attempts
                  </span>
                )}
                {primaryRiskLevel && (
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.1] text-white/50">
                    {primaryRiskLevel}
                  </span>
                )}
              </div>
              
              {/* Render risk_reasons: handle both string and array */}
              {Array.isArray(primaryRiskReasons) ? (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {primaryRiskReasons.map((reason, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/[0.04] border border-white/[0.08] text-white/50"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/45 leading-[1.5]">{primaryRiskReasons}</div>
              )}
            </div>
            {chronicRisk && (
              <div className="shrink-0 self-start px-2 py-1 rounded-sm bg-[#C4A84F]/10 border border-[#C4A84F]/30">
                <div className="font-mono text-xs text-[#C4A84F] tracking-wider mb-0.5">CHRONIC</div>
                <div className="font-mono text-xs text-[#C4A84F]/70">RECURRING</div>
              </div>
            )}
          </div>
        </div>

        {/* BLOCK 4: Prescription */}
        <div className="px-5 py-3.5 mb-px bg-[#0F1612] border-b border-[#4E9E7A]/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs text-[#4E9E7A]/60 tracking-widest">PRESCRIBED ACTION</span>
            {prescriptionDuration && (
              <span className="font-mono text-xs text-[#4E9E7A]/40">
                {prescriptionDuration} minutes
              </span>
            )}
          </div>
          
          <p className="m-0 text-sm text-[#C8DDD4] leading-[1.55]">
            {prescriptionType || "—"}
          </p>
          
          {/* Render structured target */}
          {prescriptionTarget && typeof prescriptionTarget === 'object' && (
            <div className="mt-2 font-mono text-xs text-[#4E9E7A]/70">
              {prescriptionTarget.kind === "concept" && (
                <>→ Focus concept: {primaryRiskConceptName}</>
              )}
              {prescriptionTarget.kind === "file" && (
                <>→ Review file: {prescriptionTarget.id}</>
              )}
              {prescriptionTarget.kind === "deck" && (
                <>→ Practice deck: {prescriptionTarget.id}</>
              )}
            </div>
          )}
          
          {prescriptionCtaLabel && (
            <button 
              onClick={handlePrescriptionClick}
              className="mt-3 px-3.5 py-1.5 rounded bg-[#4E9E7A]/[0.12] border border-[#4E9E7A]/[0.35] text-[#4E9E7A] font-mono text-xs cursor-pointer tracking-wide hover:bg-[#4E9E7A]/[0.18] transition-colors"
            >
              {prescriptionCtaLabel}
            </button>
          )}
        </div>

        {/* BLOCK 5: Tabs */}
        <div className="bg-[#111114]/50">
          {/* Tab nav */}
          <div className="flex gap-5 px-5 border-b border-white/[0.06]">
            {["status", "concepts", "session"].map(t => (
              <button 
                key={t} 
                className={`tab-btn ${activeTab === t ? "active" : ""}`} 
                onClick={() => setActiveTab(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Tab: STATUS */}
          {activeTab === "status" && (
            <div className="p-4 px-5">
              {/* 3-stat row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "COHORT RANK", value: `${cohortPercentile}th`, sub: "percentile among peers" },
                  { label: "EFFICIENCY", value: efficiencyValue !== null ? efficiencyValue.toFixed(1) : "—", sub: "correct / min this week" },
                  { label: "ATTEMPTS", value: conceptBreakdown.reduce((a, c) => a + c.attempts, 0), sub: "on risk concept cluster" },
                ].map((s, i) => (
                  <div key={i} className="py-3">
                    <div className="font-mono text-xs text-white/25 tracking-widest mb-1.5">{s.label}</div>
                    <div className="font-mono text-xl font-medium mb-0.5">{s.value}</div>
                    <div className="text-xs text-white/30">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cohort bar */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono text-xs text-white/25 tracking-widest">COHORT POSITION</span>
                  <span className="font-mono text-xs text-white/25">vs. students at same study stage</span>
                </div>
                <div className="h-[5px] bg-white/[0.06] rounded-sm overflow-hidden relative">
                  <div 
                    className="cohort-fill rounded-sm" 
                    style={{ 
                      width: `${cohortPercentile}%`, 
                      background: cohortPercentile >= 60 ? "#4E9E7A" : cohortPercentile >= 40 ? "#C4A84F" : "#E55A4E"
                    }} 
                  />
                  <div className="absolute left-1/2 top-0 w-px h-full bg-white/20" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-xs text-white/20">0th</span>
                  <span className="font-mono text-xs text-white/20">median</span>
                  <span className="font-mono text-xs text-white/20">100th</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab: CONCEPTS */}
          {activeTab === "concepts" && (
            <div className="p-3 px-5">
              <div className="font-mono text-xs text-white/25 mb-3 tracking-wide">
                TAP A CONCEPT TO SEE QUESTION-LEVEL EVIDENCE
              </div>
              {conceptBreakdown.length === 0 ? (
                <div className="text-center py-8 text-sm text-white/40">
                  No concept data available yet.
                </div>
              ) : (
                conceptBreakdown.map((concept, i) => (
                <div 
                  key={i} 
                  className="concept-row" 
                  onClick={() => setExpandedConcept(expandedConcept === i ? null : i)}
                >
                  <div className={`flex items-center gap-2.5 ${expandedConcept === i ? "mb-2.5" : ""}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span 
                          className="text-sm font-medium"
                          style={{ color: concept.accuracy < 60 ? "#E55A4E" : concept.accuracy < 75 ? "#C4A84F" : "#4E9E7A" }}
                        >
                          {concept.concept_name || concept.name}
                        </span>
                        <span className="font-mono text-xs text-white/25 px-1.5 py-px border border-white/[0.08] rounded-sm">
                          {concept.facet}
                        </span>
                      </div>
                      <AccuracyBar value={concept.accuracy} trend={concept.trend} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs text-white/25 mb-0.5">{concept.attempts} attempts</div>
                      <div className="text-white/15 text-xs">{expandedConcept === i ? "▲" : "▼"}</div>
                    </div>
                  </div>

                  {/* Drill-down proof layer */}
                  {expandedConcept === i && (
                    <div className="p-2.5 px-3 rounded bg-white/[0.025] border border-white/[0.06]">
                      <div className="font-mono text-xs text-white/30 mb-2 tracking-wide">QUESTION-LEVEL EVIDENCE</div>
                      {concept.concept_id === primaryRiskConceptId && primaryRiskEvidenceList.length > 0 ? (
                        <>
                          {primaryRiskEvidenceList.map((evidence, qi) => (
                            <div 
                              key={qi} 
                              className={qi < primaryRiskEvidenceList.length - 1 ? "mb-2.5 pb-2.5 border-b border-white/[0.05]" : ""}
                            >
                              <p className="m-0 mb-1.5 text-xs text-white/70 leading-[1.45]">
                                {evidence.question_text_preview || "Question text not available"}
                              </p>
                              <div className="flex gap-3">
                                <span className="font-mono text-xs text-[#E55A4E]">
                                  {evidence.miss_count || 0} {evidence.miss_count === 1 ? 'miss' : 'misses'}
                                </span>
                                {evidence.last_missed_at && (
                                  <span className="font-mono text-xs text-white/25">
                                    {getRelativeTime(evidence.last_missed_at)}
                                  </span>
                                )}
                                {evidence.source_page_numbers && (
                                  <span className="font-mono text-xs text-[#4E9E7A]/70">
                                    → p. {evidence.source_page_numbers}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : concept.concept_id === primaryRiskConceptId && primaryRiskEvidenceList.length === 0 ? (
                        <div className="text-xs text-white/40 py-2">
                          No question evidence available yet for this concept.
                        </div>
                      ) : (
                        <div className="text-xs text-white/40 py-2">
                          Evidence drill-down currently available for the primary risk concept only.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ))
              )}
            </div>
          )}

          {/* Tab: SESSION */}
          {activeTab === "session" && (
            <div className="p-4 px-5">
              <div className="font-mono text-xs text-white/25 mb-3.5 tracking-wide">8-SESSION ACCURACY HISTORY</div>
              {sessionAccuracy.length === 0 ? (
                <div className="text-center py-8 text-sm text-white/40">
                  No session history available yet.
                </div>
              ) : (
                <>
                  {/* Session chart */}
                  <div className="flex items-end gap-1.5 h-20 mb-2">
                    {sessionAccuracy.map((session, i) => {
                  // Extract accuracy from object (can be { accuracy, total_attempts, timestamp } or just number)
                  const accuracy = typeof session === 'object' && session !== null 
                    ? (session.accuracy ?? 0) 
                    : (typeof session === 'number' ? session : 0);
                  const isLast = i === sessionAccuracy.length - 1;
                  const color = accuracy >= 75 ? "#4E9E7A" : accuracy >= 60 ? "#C4A84F" : "#E55A4E";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span 
                        className="font-mono text-xs"
                        style={{ color: isLast ? color : "rgba(255,255,255,0.2)" }}
                      >
                        {Math.round(accuracy)}
                      </span>
                      <div 
                        className="w-full rounded-sm transition-all duration-400"
                        style={{ 
                          background: isLast ? color : "rgba(255,255,255,0.08)", 
                          height: `${(accuracy / 100) * 60}px` 
                        }} 
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-white/20">8 sessions ago</span>
                <span className="font-mono text-xs text-white/20">current</span>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06]">
                <div className="font-mono text-xs text-white/25 mb-2.5 tracking-widest">SESSION EFFICIENCY (correct / min)</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl">
                    {efficiencyValue !== null ? efficiencyValue.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-white/35">correct answers per minute</span>
                </div>
                {efficiencyValue !== null && (
                  <p className="mt-2 mb-0 text-xs text-white/35 leading-[1.5]">
                    {efficiencyValue < 2.5
                      ? "Low efficiency suggests extended hesitation or guessing. Speed-accuracy balance is off."
                      : "Efficiency is acceptable. Accuracy is the limiting factor, not cognitive speed."}
                  </p>
                )}
              </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
