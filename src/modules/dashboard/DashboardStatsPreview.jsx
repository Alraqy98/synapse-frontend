// src/modules/dashboard/DashboardStatsPreview.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, ArrowRight, Target } from "lucide-react";
import api from "../../lib/api";

// ─── Mini trend chart ──────────────────────────────────────────────────────────
function MiniTrendChart({ data }) {
  if (!data || data.length < 2) return null;
  const sessions = data.slice(-7);
  const W = 120, H = 44;
  const accuracies = sessions.map(s => s.accuracy);
  const max = Math.max(...accuracies);
  const min = Math.min(...accuracies);
  const range = max - min || 1;
  const x = i => (i / (sessions.length - 1)) * W;
  const y = v => H - ((v - min) / range) * (H - 8) - 4;

  const points = sessions.map((s, i) => [x(i), y(s.accuracy)]);
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

  // Area fill
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  const trend = sessions[sessions.length - 1].accuracy - sessions[0].accuracy;
  const color = trend > 2 ? "#00F5CC" : trend < -2 ? "#FF4B4B" : "#F5A623";
  const colorAlpha = trend > 2 ? "rgba(0,245,204,0.08)" : trend < -2 ? "rgba(255,75,75,0.08)" : "rgba(245,166,35,0.08)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 120, height: 44, flexShrink: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="3" fill={color} />
      </svg>
      <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>
        last 7 sessions
      </span>
    </div>
  );
}

// ─── Risk accent (red/amber) ───────────────────────────────────────────────────
const riskAccuracyColor = (acc) => {
  if (acc >= 50) return { color: "#F5A623", bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)" };
  return { color: "#FF4B4B", bg: "rgba(255,75,75,0.08)", border: "rgba(255,75,75,0.2)" };
};

// ─── Learning state badge colors ─────────────────────────────────────────────────
const stateBadgeStyle = (state) => {
  const s = (state || "").toUpperCase();
  if (s === "IMPROVING") return { color: "#00F5CC", bg: "rgba(0,245,204,0.12)", border: "rgba(0,245,204,0.25)" };
  if (s === "DECLINING") return { color: "#FF4B4B", bg: "rgba(255,75,75,0.12)", border: "rgba(255,75,75,0.25)" };
  return { color: "#F5A623", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" }; // STABLE / default
};

// ─── Primary risk row (single focus item, red/amber accent) ─────────────────────
const PrimaryRiskRow = ({ concept }) => {
  const [hovered, setHovered] = useState(false);
  const colors = riskAccuracyColor(concept.accuracy);

  return (
    <Link
      to={concept.id ? `/analytics/concepts/${concept.id}` : "/learning"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        borderRadius: 12,
        background: hovered ? "rgba(255,75,75,0.06)" : "rgba(255,75,75,0.04)",
        border: `1px solid ${colors.border}`,
        textDecoration: "none",
        transition: "all 0.15s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: hovered ? "#F5F5F7" : "rgba(245,245,247,0.9)", transition: "color 0.15s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {concept.concept_name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>
          {concept.attempts} attempts
        </div>
      </div>
      <div style={{ padding: "4px 10px", borderRadius: 100, background: colors.bg, border: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.color, fontFamily: "'Geist Mono', monospace" }}>
          {Math.round(concept.accuracy)}%
        </span>
      </div>
    </Link>
  );
};

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ navigate }) => (
  <div
    style={{
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(13,15,18,0.6)",
      padding: "36px 24px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Background glow */}
    <div aria-hidden style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,200,180,0.05) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />

    <div
      style={{
        width: 48, height: 48,
        borderRadius: 14,
        background: "rgba(0,200,180,0.08)",
        border: "1px solid rgba(0,200,180,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}
    >
      <Target size={22} style={{ color: "#00C8B4" }} />
    </div>

    <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(245,245,247,0.7)", marginBottom: 6 }}>
      No performance data yet
    </p>
    <p style={{ fontSize: 13, color: "rgba(245,245,247,0.35)", marginBottom: 24, lineHeight: 1.5 }}>
      Complete a few MCQ sessions and Synapse will identify your weakest concepts and track your progress here.
    </p>

    <button
      onClick={() => navigate("/mcq")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        borderRadius: 10,
        background: "rgba(0,200,180,0.1)",
        border: "1px solid rgba(0,200,180,0.2)",
        color: "#00C8B4",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,200,180,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,200,180,0.1)"; }}
    >
      <Zap size={14} />
      Start an MCQ session
    </button>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
const DashboardStatsPreview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/learning/state")
      .then(r => setData(r.data?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const hasData = data && (data.primary_risk || data.overall?.state || (Array.isArray(data.session_accuracy) && data.session_accuracy.length > 0) || data.plannerContext?.activePeriod?.name);

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,245,247,0.3)" }}>
          Focus Today
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
      </div>

      {loading ? (
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,15,18,0.6)", padding: "24px" }}>
          <div style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "40%", marginBottom: 16 }} className="animate-pulse" />
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 48, borderRadius: 10, background: "rgba(255,255,255,0.03)", marginBottom: 8 }} className="animate-pulse" />
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState navigate={navigate} />
      ) : (
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(13,15,18,0.6)",
            padding: "22px 20px",
            backdropFilter: "blur(8px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top glow */}
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,75,75,0.4), transparent)", pointerEvents: "none" }} />

          {/* Rotation context tag */}
          {data.plannerContext?.activePeriod?.name && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,245,247,0.4)", padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {data.plannerContext.activePeriod.name}
              </span>
            </div>
          )}

          {/* Header + state badge + trend */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,245,247,0.3)", marginBottom: 4 }}>
                Focus Today
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7" }}>
                Focus Area
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {data.overall?.state && (
                <span
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    padding: "4px 10px",
                    borderRadius: 100,
                    ...stateBadgeStyle(data.overall.state),
                  }}
                >
                  {data.overall.state}
                </span>
              )}
              {data.session_accuracy && data.session_accuracy.length > 1 && (
                <MiniTrendChart data={data.session_accuracy} />
              )}
            </div>
          </div>

          {/* Primary risk row */}
          {data.primary_risk && (
            <div style={{ marginBottom: 20 }}>
              <PrimaryRiskRow concept={data.primary_risk} />
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 16 }} />

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              to="/learning"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #00C8B4, #00F5CC)",
                color: "#0D0F12",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              View Full Analytics <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStatsPreview;
