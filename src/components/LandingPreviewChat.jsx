import React, { useState } from "react";
import { ArrowRight, Brain, MoreHorizontal } from "lucide-react";

const FAQ_QUICK = [
    "What is Synapse?",
    "Is Synapse free?",
    "How is Synapse different from ChatGPT?",
    "Does Synapse follow my university curriculum?",
];

const FAQ_ANSWERS = {
    "What is Synapse?":
        "Synapse is an AI-powered medical tutor built specifically for medical students. It focuses on understanding, not memorization.",
    "Is Synapse free?":
        "Synapse offers free access during beta. Advanced features will be introduced gradually.",
    "How is Synapse different from ChatGPT?":
        "Synapse is exam-aware, curriculum-aware, and designed only for medicine. No generic answers.",
    "Does Synapse follow my university curriculum?":
        "Yes. Synapse adapts to your university, year, and uploaded materials once you’re inside the platform.",
};

const LandingPreviewChat = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "ai",
            text:
                "I’m Synapse — a focused medical tutor. I answer briefly and help you understand how this platform works.",
        },
    ]);

    function sendMessage(text) {
        if (!text) return;

        setMessages((m) => [
            ...m,
            { role: "user", text },
            {
                role: "ai",
                text:
                    FAQ_ANSWERS[text] ||
                    "This preview answers common questions. Sign up to unlock the full AI tutor.",
            },
        ]);

        setInput("");
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

                    {/* Input (Preview Only) */}
                    <div className="mt-6 flex items-center bg-[#14181D] border border-white/10 rounded-xl p-2">
                        <button className="p-3 text-muted cursor-not-allowed">
                            <MoreHorizontal size={18} />
                        </button>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                            placeholder="Ask a medical or platform question..."
                            className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none px-2"
                        />
                        <button
                            onClick={() => sendMessage(input)}
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
