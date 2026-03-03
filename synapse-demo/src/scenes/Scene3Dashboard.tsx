import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { MemoryRouter } from "react-router-dom";
import { BRAND } from "../brand";
import { Sidebar } from "../components/Sidebar";
import DashboardWelcome from "../../../src/modules/dashboard/DashboardWelcome";
import DashboardQuickActions from "../../../src/modules/dashboard/DashboardQuickActions";
import DashboardRecentActivityStatic from "../demoComponents/DashboardRecentActivityStatic";
import { MOCK_PROFILE, MOCK_DASHBOARD } from "../staticData";

const noop = () => {};

export const Scene3Dashboard: React.FC<{ frame: number }> = ({ frame }) => {
  const slideY = interpolate(frame, [0, 60], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const uploadHighlight = frame >= 480;
  const zoomProgress = interpolate(frame, [540, 600], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 1 + zoomProgress * 0.08;
  const cursorX = interpolate(frame, [480, 510], [800, 380], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [480, 510], [200, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorVisible = frame >= 450 && frame < 570;

  return (
    <AbsoluteFill
      style={{
        background: BRAND.background,
        fontFamily: "Inter, sans-serif",
        opacity: fadeIn,
      }}
    >
      {/* Browser chrome — macOS */}
      <div
        style={{
          height: 28,
          background: "#2d2d2d",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          gap: 8,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        <div
          style={{
            marginLeft: 24,
            padding: "4px 12px",
            background: "#1a1a1a",
            borderRadius: 6,
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          synapse-app.io/dashboard
        </div>
        <div style={{ marginLeft: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Synapse</div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar active="home" />
        <MemoryRouter initialEntries={["/dashboard"]} initialIndex={0}>
          <div
            style={{
              flex: 1,
              padding: "32px 40px",
              overflow: "auto",
              transform: `translateY(${slideY}px) scale(${scale})`,
              transformOrigin: "center 200px",
              background: "#0D0F12",
            }}
          >
            <div className="relative z-10 pt-2 px-2 pb-6 max-w-7xl mx-auto space-y-8" style={{ background: "#0D0F12" }}>
              <DashboardWelcome profile={{ full_name: MOCK_PROFILE.full_name }} onStartTour={noop} />
              <DashboardQuickActions
                onOpenUploadModal={noop}
                onOpenSummaryModal={noop}
                onOpenMCQModal={noop}
                onOpenFlashcardsModal={noop}
              />
              <DashboardRecentActivityStatic
                recentFiles={MOCK_DASHBOARD.recentFiles}
                recentGenerations={MOCK_DASHBOARD.recentGenerations}
                upcomingEvents={MOCK_DASHBOARD.upcomingEvents}
              />
            </div>
          </div>
        </MemoryRouter>
      </div>

      {cursorVisible && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: 28 + cursorY,
            width: 18,
            height: 22,
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 18 22" fill="white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
            <path d="M1 1l6 6 3-4 2 12 3-8 3 6z" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
