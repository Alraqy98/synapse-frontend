// src/modules/dashboard/DashboardWelcome.jsx
import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const DashboardWelcome = ({ profile, onStartTour }) => {
  const firstName = profile?.full_name?.trim().split(" ")[0] || null;
  const greeting = getGreeting();

  return (
    <div style={{ position: "relative" }}>
      {/* Subtle glow behind heading */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -40,
          left: -60,
          width: 420,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,200,180,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(30px)",
        }}
      />

      <div className="flex items-start justify-between gap-6 mb-2" style={{ position: "relative", zIndex: 1 }}>
        <div className="flex-1">
          {/* Mono label */}
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(0,200,180,0.7)",
              marginBottom: 10,
            }}
          >
            {greeting}
          </div>

          {/* Main heading — DM Serif for the name */}
          <h1 style={{ lineHeight: 1.1, marginBottom: 10 }}>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(28px, 3.5vw, 44px)",
                color: "#F5F5F7",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back,{" "}
            </span>
            {firstName && (
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontStyle: "italic",
                  fontSize: "clamp(32px, 4vw, 50px)",
                  background: "linear-gradient(135deg, #00C8B4, #00F5CC)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {firstName}.
              </span>
            )}
          </h1>

          <p style={{ fontSize: 15, color: "rgba(245,245,247,0.5)", marginTop: 4 }}>
            Pick up where you left off or start something new.
          </p>
        </div>

        {/* Tour CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", marginBottom: 2 }}>
              New to Synapse?
            </p>
            <p style={{ fontSize: 11, color: "rgba(245,245,247,0.3)" }}>
              Take a quick walkthrough
            </p>
          </div>
          <button
            onClick={onStartTour}
            className="group"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 12,
              background: "rgba(0,200,180,0.08)",
              border: "1px solid rgba(0,200,180,0.2)",
              color: "#00C8B4",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(0,200,180,0.15)";
              e.currentTarget.style.borderColor = "rgba(0,200,180,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(0,200,180,0.08)";
              e.currentTarget.style.borderColor = "rgba(0,200,180,0.2)";
            }}
          >
            <Sparkles size={14} />
            <span>Take a 2-minute tour</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Divider line */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, rgba(0,200,180,0.2), rgba(0,200,180,0.05) 60%, transparent)",
          marginTop: 24,
        }}
      />
    </div>
  );
};

export default DashboardWelcome;
