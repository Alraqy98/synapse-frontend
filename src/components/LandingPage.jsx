import React, { useEffect } from "react";
import LandingHero from "./LandingHero";
import LandingPreviewChat from "./LandingPreviewChat";
import LandingFeatures from "./LandingFeatures";
import LandingCTA from "./LandingCTA";
import logo from "../assets/synapse-logo.png";

const LandingPage = ({ onLogin, onSignup }) => {
    // Add body class on mount, remove on unmount
    useEffect(() => {
        document.body.classList.add("landing");
        return () => {
            document.body.classList.remove("landing");
        };
    }, []);

    return (
        <div className="landing-page w-full min-h-screen bg-[#0D0F12] text-white overflow-x-hidden selection:bg-teal selection:text-black">

            {/* Navbar */}
            <nav className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto w-full relative z-50">
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="Synapse"
                        className="h-8 w-auto drop-shadow-[0_0_12px_rgba(0,200,180,0.6)]"
                    />
                    <span className="text-xl font-bold tracking-tight">
                        Synapse
                    </span>
                    <span className="text-xs text-muted font-medium px-2 py-0.5 rounded border border-white/10 bg-white/5">
                        Beta
                    </span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onLogin}
                        className="text-sm font-medium text-muted hover:text-white transition-colors"
                    >
                        Log In
                    </button>

                    <button
                        onClick={onSignup}
                        className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
                    >
                        Sign Up
                    </button>
                </div>
            </nav>

            <main className="flex flex-col items-center">
                <LandingHero />
                <LandingPreviewChat />
                <LandingFeatures />
                <LandingCTA onSignup={onSignup} />
            </main>

            <footer className="py-12 text-center text-muted text-sm border-t border-white/5 bg-[#0D0F12]">
                <p className="text-xs text-muted/80 mb-2">
                    Synapse is currently in beta. Best experience on desktop. Some features may change.
                </p>
                <p>&copy; {new Date().getFullYear()} Synapse OS. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
