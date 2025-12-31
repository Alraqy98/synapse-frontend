import React from 'react';
import logo from '../../assets/synapse-logo.png';

const OnboardingLayout = ({ currentStep, totalSteps, children, title, subtitle }) => {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="min-h-screen w-full bg-[#0D0F12] text-white flex flex-col items-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal/10 blur-[120px] rounded-full pointer-events-none opacity-40" />

            {/* Header / Progress */}
            <div className="w-full max-w-3xl px-6 py-8 z-10">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
                        <img
                            src={logo}
                            alt="Synapse Logo"
                            className="h-8 w-auto drop-shadow-[0_0_12px_rgba(0,200,180,0.6)]"
                        />
                        Synapse
                    </div>
                    <div className="text-sm text-muted font-medium">
                        Step {currentStep + 1} of {totalSteps}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-12">
                    <div
                        className="h-full bg-teal transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,200,180,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content Wrapper */}
                <div className="animate-fade-in-up">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
                        <p className="text-lg text-muted">{subtitle}</p>
                    </div>

                    <div className="w-full max-w-xl mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingLayout;
