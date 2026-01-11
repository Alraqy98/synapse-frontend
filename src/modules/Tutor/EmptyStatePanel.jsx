// src/modules/Tutor/EmptyStatePanel.jsx
import React from "react";
import { Lightbulb, BookOpen, FileText, HelpCircle } from "lucide-react";
import { TUTOR_QUICK_ACTIONS } from "./tutorQuickActions";

const EmptyStatePanel = ({ onQuickAction }) => {
    const handleQuickAction = (actionKey) => {
        if (onQuickAction) {
            onQuickAction(actionKey);
        }
    };

    const quickActions = [
        {
            key: "explain",
            icon: Lightbulb,
            label: "Explain a concept",
            description: "Get a clear explanation",
        },
        {
            key: "exam",
            icon: BookOpen,
            label: "Exam-focused review",
            description: "Study for your exam",
        },
        {
            key: "file",
            icon: FileText,
            label: "Use a file",
            description: "Ask about your files",
        },
        {
            key: "confused",
            icon: HelpCircle,
            label: "I'm confused — help me",
            description: "Get guidance",
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
                    {quickActions.map((action) => (
                        <button
                            key={action.key}
                            onClick={() => handleQuickAction(action.key)}
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

