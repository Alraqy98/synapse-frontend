// src/modules/dashboard/DashboardWelcome.jsx
import React from "react";

const DashboardWelcome = ({ profile }) => {
    // Extract first name from full_name
    const getFirstName = () => {
        if (!profile?.full_name) return null;
        const parts = profile.full_name.trim().split(" ");
        return parts[0] || null;
    };

    const firstName = getFirstName();
    const title = firstName ? `Welcome back, ${firstName}` : "Welcome back";

    return (
        <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                {title}
            </h1>
            <p className="text-lg text-muted">
                Pick up where you left off or start something new.
            </p>
        </div>
    );
};

export default DashboardWelcome;

