import React, { useState } from "react";
import { ArrowRight, Brain, MoreHorizontal } from "lucide-react";

const FAQ_RESPONSES = {
    "What is Synapse?":
        "Synapse is an AI-powered medical learning system built to help students understand, not memorize. It adapts to your training stage and materials.",
    "What can Synapse do?":
        "Synapse can explain topics, generate MCQs, create flashcards, and simulate clinical cases using your own lectures and files.",
    "Is Synapse for USMLE?":
        "Yes. Synapse is designed around exam logic, including USMLE-style case questions and high-yield reasoning.",
    "Does Synapse replace studying?":
        "No. It replaces inefficient studying. You still learn — just faster, deeper, and with structure.",
};

const LandingPreviewChat = () => {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState(null);

    const handleSend = (text) => {
        if (!text.trim()) return;
        const reply =
            FAQ_RESPONSES[text] ||
            "This is a live preview. Full interactive tutoring unlocks after sign up.";
        setResponse(reply);
        setInput("");
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-6 mb-32 relative z-10">
            {/* Glow */}
            <div className="absolute inset-0 bg-teal/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />

            <div className="relative rounded-2xl border border-white/10 bg-[#0D0F12]/80 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <Brain size={14} className="text-teal" />
                    <span className="text-xs text-muted mx-auto">
                        synapse_ai_preview.exe
                    </span>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 min-h-[420px] flex flex-col">
                    {/* AI intro */}
                    <div className="flex gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-teal-neon flex items-center justify-center">
                            <Brain size={20} className="text-black" />
                        </div>

                        <div className="max-w-2xl">
                            <div className="text-sm font-bold mb-1">Synapse AI</div>
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-gray-300">
                                <p className="mb-3">
                                    I’m a preview of Synapse. Ask about features, exams, or how the
                                    platform works.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(FAQ_RESPONSES).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => handleSend(q)}
                                            className="text-xs bg-black/40 border border-white/10 hover:border-teal/40 px-3 py-1.5 rounded-lg transition text-gray-400 hover:text-teal"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User question */}
                    {response && (
                        <div className="flex flex-col items-end gap-3 mb-6">
                            <div className="bg-teal/10 border border-teal/30 px-4 py-2 rounded-xl text-sm text-teal">
                                {response}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="mt-auto">
                        <div className="flex items-center bg-[#14181D] border border-white/10 rounded-xl p-2">
                            <button className="p-3 text-muted">
                                <MoreHorizontal size={18} />
                            </button>

                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                                placeholder="Ask about Synapse..."
                                className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none px-2"
                            />

                            <button
                                onClick={() => handleSend(input)}
                                className="p-3 bg-teal hover:bg-teal-neon text-black rounded-lg transition"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPreviewChat;
