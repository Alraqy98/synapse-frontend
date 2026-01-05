// src/modules/dashboard/DashboardTourCard.jsx
import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const DashboardTourCard = () => {
    const handleStartTour = () => {
        // Stub handler - no implementation yet
        console.log("Start Product Tour clicked");
    };

    return (
        <div className="mb-8">
            <div className="rounded-2xl border border-teal/30 bg-gradient-to-br from-teal/10 to-teal/5 p-8 relative overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 rounded-xl bg-teal/20 border border-teal/30">
                        <Sparkles size={32} className="text-teal" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                            New to Synapse?
                        </h3>
                        <p className="text-muted mb-4">
                            Take a 2-minute walkthrough to see how everything works.
                        </p>
                        <button
                            onClick={handleStartTour}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal hover:bg-teal-neon text-black font-semibold transition-all hover:scale-105 group"
                        >
                            Start Product Tour
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTourCard;

