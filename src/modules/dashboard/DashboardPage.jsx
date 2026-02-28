// src/modules/dashboard/DashboardPage.jsx
import React from "react";
import { useDemo } from "../demo/DemoContext";
import DashboardWelcome from "./DashboardWelcome";
import DashboardQuickActions from "./DashboardQuickActions";
import DashboardRecentActivity from "./DashboardRecentActivity";
import DashboardStatsPreview from "./DashboardStatsPreview";

const DashboardPage = ({
  profile,
  onOpenUploadModal,
  onOpenSummaryModal,
  onOpenMCQModal,
  onOpenFlashcardsModal,
}) => {
  const { startDemo } = useDemo() || {};

  const handleStartTour = () => {
    if (startDemo) startDemo("dashboard_cta");
  };

  return (
    <div className="flex-1 overflow-y-auto relative" style={{ background: "#0D0F12" }}>
      {/* Ambient glow — top centre */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: -180,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,200,180,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 pt-2 px-6 pb-6 max-w-7xl mx-auto space-y-8">
        <DashboardWelcome profile={profile} onStartTour={handleStartTour} />
        <DashboardQuickActions
          onOpenUploadModal={onOpenUploadModal}
          onOpenSummaryModal={onOpenSummaryModal}
          onOpenMCQModal={onOpenMCQModal}
          onOpenFlashcardsModal={onOpenFlashcardsModal}
        />
        <DashboardRecentActivity />
        <DashboardStatsPreview />
      </div>
    </div>
  );
};

export default DashboardPage;
