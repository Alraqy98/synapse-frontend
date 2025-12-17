import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const OnboardingComplete = ({ onComplete }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal/20 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />

            <div className="w-full max-w-[600px] flex flex-col items-center justify-center text-center animate-fade-in-up relative z-10">
                <div className="w-24 h-24 rounded-full bg-teal/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,200,180,0.2)]">
                    <CheckCircle size={48} className="text-teal" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">You're All Set!</h1>
                <p className="text-xl text-muted mb-12 max-w-md leading-relaxed">
                    Welcome to Synapse OS. Your personalized medical AI tutor is ready to help you master medicine.
                </p>

                <button
                    onClick={onComplete}
                    className="rounded-xl px-10 py-4 bg-teal hover:bg-teal-neon text-black font-bold text-xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(0,200,180,0.4)] flex items-center gap-3 group"
                >
                    Enter Dashboard
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default OnboardingComplete;
