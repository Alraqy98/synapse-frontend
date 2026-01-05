// src/modules/dashboard/DashboardPage.jsx
import React from "react";
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
    const handleStartTour = () => {
        // Stub handler - no implementation yet
        console.log("Start Product Tour clicked");
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Welcome Section */}
                <DashboardWelcome 
                    profile={profile}
                    onStartTour={handleStartTour}
                />

                {/* Quick Actions */}
                <DashboardQuickActions
                    onOpenUploadModal={onOpenUploadModal}
                    onOpenSummaryModal={onOpenSummaryModal}
                    onOpenMCQModal={onOpenMCQModal}
                    onOpenFlashcardsModal={onOpenFlashcardsModal}
                />

                {/* Recent Activity */}
                <DashboardRecentActivity />

                {/* Stats Preview */}
                <DashboardStatsPreview />
            </div>
        </div>
    );
};

export default DashboardPage;

