// src/modules/dashboard/DashboardWelcome.jsx
import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const DashboardWelcome = ({ profile, onStartTour }) => {
    // Extract first name from full_name
    const getFirstName = () => {
        if (!profile?.full_name) return null;
        const parts = profile.full_name.trim().split(" ");
        return parts[0] || null;
    };

    const firstName = getFirstName();
    const title = firstName ? `Welcome back, ${firstName}` : "Welcome back";

    return (
        <div className="mb-8 flex items-start justify-between gap-6">
            <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                    {title}
                </h1>
                <p className="text-lg text-muted">
                    Pick up where you left off or start something new.
                </p>
            </div>
            
            {/* Tour Entry Point */}
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm text-muted mb-1">New to Synapse?</p>
                    <p className="text-xs text-muted">Take a quick walkthrough</p>
                </div>
                <button
                    onClick={onStartTour}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal/10 border border-teal/30 hover:bg-teal/20 text-teal font-medium transition-all hover:scale-105 group whitespace-nowrap"
                >
                    <Sparkles size={16} />
                    <span>Take a 2-minute tour</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default DashboardWelcome;

