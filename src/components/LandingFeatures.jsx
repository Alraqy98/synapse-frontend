import React from 'react';
import { Brain, Zap, Activity } from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: "Deep Context",
        desc: "Upload entire textbooks and lectures. Synapse understands the full context of your curriculum."
    },
    {
        icon: Zap,
        title: "Instant Mastery",
        desc: "Generate flashcards, quizzes, and summaries in seconds from any medical resource."
    },
    {
        icon: Activity,
        title: "Clinical Simulation",
        desc: "Practice with realistic patient scenarios and OSCE simulations powered by advanced AI."
    }
];

const LandingFeatures = () => {
    return (
        <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">Engineered for Excellence</h2>
                <p className="text-xl text-muted max-w-2xl mx-auto font-light">Everything you need to crush your boards and excel in the wards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, idx) => (
                    <div key={idx} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-teal/20 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-[#0D0F12] border border-white/10 flex items-center justify-center text-teal mb-6 group-hover:scale-110 group-hover:border-teal/30 group-hover:shadow-[0_0_20px_rgba(0,200,180,0.2)] transition-all duration-300">
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-100 group-hover:text-teal-neon transition-colors">{feature.title}</h3>
                            <p className="text-base text-muted leading-relaxed group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default LandingFeatures;
