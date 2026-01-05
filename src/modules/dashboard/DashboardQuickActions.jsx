// src/modules/dashboard/DashboardQuickActions.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Folder, Brain, CheckSquare, Zap } from "lucide-react";

const DashboardQuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        {
            label: "Upload files",
            icon: Upload,
            route: "/library",
            description: "Add new study materials",
        },
        {
            label: "Open Library",
            icon: Folder,
            route: "/library",
            description: "Browse your files",
        },
        {
            label: "Ask Astra",
            icon: Brain,
            route: "/tutor",
            description: "Chat with your AI tutor",
        },
        {
            label: "Generate MCQs",
            icon: CheckSquare,
            route: "/library",
            description: "Create practice questions",
        },
        {
            label: "Generate Flashcards",
            icon: Zap,
            route: "/library",
            description: "Build flashcard decks",
        },
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.route)}
                            className="group rounded-2xl border border-white/10 bg-black/40 p-6 text-left transition-all hover:-translate-y-1 hover:border-teal/40 cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-teal/10 border border-teal/20 group-hover:bg-teal/20 transition">
                                    <Icon size={24} className="text-teal" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white mb-1">
                                        {action.label}
                                    </h3>
                                    <p className="text-sm text-muted">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardQuickActions;

