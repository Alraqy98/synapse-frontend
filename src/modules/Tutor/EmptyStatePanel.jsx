// src/modules/Tutor/EmptyStatePanel.jsx
import React from "react";
import { Lightbulb, BookOpen, FileText, HelpCircle } from "lucide-react";

const EmptyStatePanel = ({ onCreateSession, onFocusInput }) => {
    const handleQuickAction = (actionType) => {
        // Create new session first
        onCreateSession();
        
        // Small delay to ensure input is ready, then focus
        setTimeout(() => {
            if (onFocusInput) onFocusInput();
        }, 100);
    };

    const quickActions = [
        {
            icon: Lightbulb,
            label: "Explain a concept",
            description: "Get a clear explanation",
            placeholder: "Explain how the cardiovascular system works",
        },
        {
            icon: BookOpen,
            label: "Exam-focused review",
            description: "Study for your exam",
            placeholder: "Help me review for my cardiology exam",
        },
        {
            icon: FileText,
            label: "Use a file",
            description: "Ask about your files",
            placeholder: "I want to discuss my uploaded lecture notes",
        },
        {
            icon: HelpCircle,
            label: "I'm confused — help me",
            description: "Get guidance",
            placeholder: "I'm struggling with this topic, can you help?",
        },
    ];

    return (
        <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-10">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold text-white">
                        What do you want to study now?
                    </h2>
                    <p className="text-muted text-sm">
                        Choose a quick action or type your question below
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickAction(action.label)}
                            className="p-4 bg-[#1a1d24] border border-white/10 rounded-xl hover:border-teal/50 hover:bg-white/5 transition-all text-left group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-teal/10 rounded-lg group-hover:bg-teal/20 transition-colors">
                                    <action.icon
                                        size={20}
                                        className="text-teal"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white mb-1">
                                        {action.label}
                                    </h3>
                                    <p className="text-xs text-muted">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmptyStatePanel;

