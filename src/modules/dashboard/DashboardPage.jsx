// src/modules/dashboard/DashboardPage.jsx
import React from "react";
import DashboardWelcome from "./DashboardWelcome";
import DashboardQuickActions from "./DashboardQuickActions";
import DashboardRecentActivity from "./DashboardRecentActivity";
import DashboardStatsPreview from "./DashboardStatsPreview";
import DashboardTourCard from "./DashboardTourCard";

const DashboardPage = ({ profile }) => {
    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Welcome Section */}
                <DashboardWelcome profile={profile} />

                {/* Quick Actions */}
                <DashboardQuickActions />

                {/* Recent Activity */}
                <DashboardRecentActivity />

                {/* Stats Preview */}
                <DashboardStatsPreview />

                {/* Welcome Tour Entry Point */}
                <DashboardTourCard />
            </div>
        </div>
    );
};

export default DashboardPage;

