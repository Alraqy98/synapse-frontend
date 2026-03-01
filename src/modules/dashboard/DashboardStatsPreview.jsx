// src/modules/dashboard/DashboardStatsPreview.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Target, ArrowRight } from "lucide-react";
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
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,15,18,0.6)", padding: "22px 20px", backdropFilter: "blur(8px)" }}>
          <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "35%", marginBottom: 16 }} className="animate-pulse" />
          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 12 }} />
          <div style={{ height: 20, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "70%", marginBottom: 8 }} className="animate-pulse" />
          <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.04)", width: "45%" }} className="animate-pulse" />
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
          }}
        >
          {/* Header row: FOCUS TODAY (left) + rotation tag (right) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,245,247,0.3)" }}>
              FOCUS TODAY
            </div>
            {data.plannerContext?.activePeriod?.name && (
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,245,247,0.35)", padding: "3px 8px", borderRadius: 100, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {data.plannerContext.activePeriod.name}
              </span>
            )}
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 12 }} />

          {/* Body: concept name + red accuracy pill, then subtext */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff", lineHeight: 1.3, margin: "0 0 4px 0" }}>
                {data.primary_risk.concept_name}
              </h3>
              <p style={{ fontSize: 12, fontFamily: "'Geist Mono', monospace", color: "#f87171", margin: 0 }}>
                {data.primary_risk.attempts} attempts
                {formatRiskLevel(data.primary_risk.risk_level) && (
                  <> · {formatRiskLevel(data.primary_risk.risk_level)}</>
                )}
              </p>
            </div>
            <div style={{ padding: "3px 9px", borderRadius: 100, background: "rgba(255,75,75,0.12)", border: "1px solid rgba(255,75,75,0.3)", flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "#f87171", fontFamily: "'Geist Mono', monospace", letterSpacing: "0.05em" }}>
                {Math.round(data.primary_risk.accuracy ?? 0)}%
              </span>
            </div>
          </div>

          {/* Small outlined CTA button */}
          <Link
            to={`/learning/reinforce/${data.primary_risk.concept_id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              color: "#00C8B4",
              background: "transparent",
              border: "1px solid rgba(0,200,180,0.3)",
              textDecoration: "none",
              fontFamily: "'Geist Mono', monospace",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(0,200,180,0.6)";
              e.currentTarget.style.background = "rgba(0,200,180,0.05)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(0,200,180,0.3)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {data.prescription?.cta_label || "Recover Accuracy (20 mins)"}
            <ArrowRight size={12} style={{ flexShrink: 0 }} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardStatsPreview;
