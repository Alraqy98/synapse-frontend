// src/modules/dashboard/DashboardStatsPreview.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Target } from "lucide-react";
import api from "../../lib/api";

// ─── Compact sparkline (no labels) ─────────────────────────────────────────────
function CompactSparkline({ data }) {
  if (!data || data.length < 2) return null;
  const sessions = data.slice(-7);
  const W = 80;
  const H = 28;
  const accuracies = sessions.map(s => s.accuracy);
  const max = Math.max(...accuracies);
  const min = Math.min(...accuracies);
  const range = max - min || 1;
  const x = i => (i / (sessions.length - 1)) * W;
  const y = v => H - ((v - min) / range) * (H - 6) - 3;

  const points = sessions.map((s, i) => [x(i), y(s.accuracy)]);
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const trend = sessions[sessions.length - 1].accuracy - sessions[0].accuracy;
  const color = trend > 2 ? "#00F5CC" : trend < -2 ? "#FF4B4B" : "#F5A623";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: 28, flexShrink: 0 }}>
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2" fill={color} />
    </svg>
  );
}

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
    <div aria-hidden style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,200,180,0.05) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />
    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(0,200,180,0.08)", border: "1px solid rgba(0,200,180,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
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

  const hasData = data && data.primary_risk;

  return (
    <div style={{ paddingBottom: 32 }}>
      {loading ? (
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,15,18,0.6)", padding: "24px" }}>
          <div style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "40%", marginBottom: 16 }} className="animate-pulse" />
          <div style={{ height: 56, borderRadius: 10, background: "rgba(255,255,255,0.03)", marginBottom: 12 }} className="animate-pulse" />
          <div style={{ height: 44, borderRadius: 10, background: "rgba(255,255,255,0.03)" }} className="animate-pulse" />
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
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,75,75,0.4), transparent)", pointerEvents: "none" }} />

          {/* Top row: rotation tag (left) + sparkline (right) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            {data.plannerContext?.activePeriod?.name ? (
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,245,247,0.5)", padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {data.plannerContext.activePeriod.name}
              </span>
            ) : (
              <span />
            )}
            {data.session_accuracy && data.session_accuracy.length > 1 && (
              <CompactSparkline data={data.session_accuracy} />
            )}
          </div>

          {/* Main: large concept name + red risk pill */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#F5F5F7", margin: 0, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                {data.primary_risk.concept_name}
              </h3>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 100,
                  background: "rgba(255,75,75,0.12)",
                  border: "1px solid rgba(255,75,75,0.25)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FF4B4B",
                  fontFamily: "'Geist Mono', monospace",
                  flexShrink: 0,
                }}
              >
                {Math.round(data.primary_risk.accuracy ?? 0)}%
              </span>
            </div>
            {/* Subtext: attempts · risk_level */}
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.45)", fontFamily: "'Geist Mono', monospace", margin: 0 }}>
              {data.primary_risk.attempts} attempts
              {data.primary_risk.risk_level != null && data.primary_risk.risk_level !== "" && (
                <> · {String(data.primary_risk.risk_level).toUpperCase().replace(/\s+/g, " ")}</>
              )}
            </p>
          </div>

          {/* Single teal CTA */}
          <Link
            to="/learning"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "12px 20px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #00C8B4, #00F5CC)",
              color: "#0D0F12",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              transition: "opacity 0.15s",
              marginTop: 20,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {data.prescription?.cta_label || "Start Focus Session"}
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardStatsPreview;
