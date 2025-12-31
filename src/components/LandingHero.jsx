import React from 'react';

const LandingHero = () => {
    return (
        <section className="flex flex-col items-center text-center py-24 px-6 animate-fade-in relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-teal mb-8 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
                </span>
                Beta Access
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 text-white">
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-teal-neon drop-shadow-[0_0_25px_rgba(0,200,180,0.4)]">Synapse</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl font-light leading-relaxed mb-12">
                An AI study system that works directly with your medical lectures.
                <br className="hidden md:block" /> Understand concepts, generate questions, and revise efficiently.
            </p>
        </section>
    );
};

export default LandingHero;
