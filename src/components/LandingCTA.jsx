import React from 'react';

const LandingCTA = ({ onSignup, onLogin }) => {
    return (
        <section className="py-32 px-6 text-center relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

            <div className="max-w-4xl mx-auto relative z-10">
                <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-white">
                    Ready to master medicine?
                </h2>
                <p className="text-xl md:text-2xl text-muted mb-12 max-w-2xl mx-auto font-light">
                    Join thousands of medical students using Synapse to study smarter, not harder.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <button
                        onClick={onSignup}
                        className="px-10 py-5 rounded-2xl bg-teal hover:bg-teal-neon text-black font-bold text-xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(0,200,180,0.4)] hover:shadow-[0_0_50px_rgba(0,200,180,0.6)]"
                    >
                        Sign Up Free
                    </button>

                    <button
                        onClick={onLogin}
                        className="px-10 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-xl transition-all backdrop-blur-md"
                    >
                        Log In
                    </button>
                </div>

                <p className="mt-10 text-sm text-muted uppercase tracking-widest opacity-50 font-medium">
                    No credit card required • Free tier available
                </p>
            </div>
        </section>
    );
};

export default LandingCTA;
