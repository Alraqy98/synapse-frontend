import React, { useState } from "react";
import { ArrowRight, Brain, MoreHorizontal } from "lucide-react";

const FAQ_QUICK = [
    "What is Synapse?",
    "Is Synapse free?",
    "How is this different from ChatGPT?",
    "Does Synapse follow my university curriculum?",
];

const STATIC_FAQ = {
    "What is Synapse?":
        "Synapse is a medical education platform built specifically for medical students, focused on exams, structure, and clinical reasoning.",
    "Is Synapse free?":
        "Synapse has a free tier. Advanced features like MCQs, summaries, and clinical cases will be part of premium plans.",
    "How is this different from ChatGPT?":
        "Synapse is not a general chatbot. It is curriculum-aware, exam-oriented, and built specifically for medical education.",
    "Does Synapse follow my university curriculum?":
        "Yes. Synapse adapts to your university, year, and uploaded materials to stay aligned with your curriculum.",
};

const LandingPreviewChat = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "ai",
            text:
                "I’m Synapse — a focused medical tutor and platform guide. Ask me about how Synapse works.",
        },
    ]);
    const [loading, setLoading] = useState(false);

    function sendMessage(text) {
        if (!text || loading) return;

        setMessages((m) => [...m, { role: "user", text }]);
        setInput("");
        setLoading(true);

        setTimeout(() => {
            const reply =
                STATIC_FAQ[text] ||
                "For now, I answer common questions about Synapse. Full AI tutoring is available after signup.";
            setMessages((m) => [...m, { role: "ai", text: reply }]);
            setLoading(false);
        }, 600);
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-6 mb-32 relative z-10">
            <div className="relative rounded-2xl border border-white/10 bg-[#0D0F12]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="p-6 md:p-8 min-h-[450px] flex flex-col">

                    {/* Messages */}
                    <div className="flex-1 space-y-6">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse opacity-80" : ""
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center">
                                    <Brain size={18} className="text-black" />
                                </div>
                                <div className="max-w-2xl p-4 rounded-xl bg-white/5 text-sm text-gray-300">
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick FAQ */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        {FAQ_QUICK.map((q) => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="text-xs bg-black/40 hover:bg-teal/10 border border-white/10 hover:border-teal/30 px-3 py-1.5 rounded-lg transition text-gray-400 hover:text-teal"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="mt-6 flex items-center bg-[#14181D] border border-white/10 rounded-xl p-2">
                        <button className="p-3 text-muted">
                            <MoreHorizontal size={18} />
                        </button>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                            placeholder="Ask about Synapse..."
                            className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none px-2"
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={loading}
                            className="p-3 bg-teal text-black rounded-lg hover:scale-105 transition"
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPreviewChat;
