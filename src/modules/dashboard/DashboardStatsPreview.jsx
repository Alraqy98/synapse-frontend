// src/modules/dashboard/DashboardStatsPreview.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Target } from "lucide-react";
import api from "../../lib/api";

// ─── Format risk_level for display ─────────────────────────────────────────────
const formatRiskLevel = (raw) => {
  if (raw == null || raw === "") return null;
  const key = String(raw).toUpperCase().replace(/\s+/g, "_");
  const map = { HIGH_RISK: "High Risk", MEDIUM_RISK: "Medium Risk", LOW_RISK: "Low Risk" };
  return map[key] ?? raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 24,
            borderTop: "2px solid rgba(239,68,68,0.6)",
          }}
        >
          {/* Rotation tag */}
          {data.plannerContext?.activePeriod?.name && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,245,247,0.5)", padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "inline-block" }}>
                {data.plannerContext.activePeriod.name}
              </span>
            </div>
          )}

          {/* FOCUS AREA label + concept name + red risk pill */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,245,247,0.3)", marginBottom: 6 }}>
              FOCUS AREA
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.02em", margin: 0 }}>
                {data.primary_risk.concept_name}
              </h3>
              <span style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 100, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", fontSize: 13, fontWeight: 700, color: "#f87171", fontFamily: "'Geist Mono', monospace" }}>
                {Math.round(data.primary_risk.accuracy ?? 0)}%
              </span>
            </div>
            {/* Subtext: attempts · risk_level (text-red-400 text-xs font-mono) */}
            <p style={{ fontSize: 12, fontFamily: "'Geist Mono', monospace", color: "#f87171", margin: 0 }}>
              {data.primary_risk.attempts} attempts
              {formatRiskLevel(data.primary_risk.risk_level) && (
                <> · {formatRiskLevel(data.primary_risk.risk_level)}</>
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
              marginTop: 20,
              padding: "12px 20px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #00C8B4, #00F5CC)",
              color: "#0D0F12",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              transition: "opacity 0.15s",
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
