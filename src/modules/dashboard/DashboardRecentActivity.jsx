// src/modules/dashboard/DashboardRecentActivity.jsx
import React from "react";
import { FileText, BookOpen, CheckSquare, Zap } from "lucide-react";

const DashboardRecentActivity = () => {
    // Mock data - placeholder cards
    const mockUploads = [
        { name: "Cardiology Lecture Notes", type: "Lecture", daysAgo: "2 days ago" },
        { name: "Pathology Study Guide", type: "Notes", daysAgo: "5 days ago" },
        { name: "Anatomy Review Slides", type: "Lecture", daysAgo: "1 week ago" },
    ];

    const mockGenerations = [
        { type: "Summary", fileName: "Cardiology Lecture Notes", status: "Completed" },
        { type: "MCQ Deck", fileName: "Pathology Study Guide", status: "Completed" },
        { type: "Flashcards", fileName: "Anatomy Review Slides", status: "Completed" },
    ];

    const getTypeIcon = (type) => {
        switch (type) {
            case "Summary":
                return BookOpen;
            case "MCQ Deck":
                return CheckSquare;
            case "Flashcards":
                return Zap;
            default:
                return FileText;
        }
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Uploads */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Uploads</h3>
                    
                    {mockUploads.length > 0 ? (
                        <div className="space-y-3">
                            {mockUploads.map((upload, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                                >
                                    <div className="p-2 rounded-lg bg-teal/10 border border-teal/20">
                                        <FileText size={18} className="text-teal" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {upload.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted">{upload.type}</span>
                                            <span className="text-xs text-muted">•</span>
                                            <span className="text-xs text-muted">{upload.daysAgo}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted">
                            <FileText size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No uploads yet.</p>
                            <p className="text-xs mt-1">Upload your first file to get started.</p>
                        </div>
                    )}
                </div>

                {/* Recent Generations */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Generations</h3>
                    
                    {mockGenerations.length > 0 ? (
                        <div className="space-y-3">
                            {mockGenerations.map((gen, idx) => {
                                const Icon = getTypeIcon(gen.type);
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                                    >
                                        <div className="p-2 rounded-lg bg-teal/10 border border-teal/20">
                                            <Icon size={18} className="text-teal" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {gen.type}
                                            </p>
                                            <p className="text-xs text-muted truncate mt-1">
                                                {gen.fileName}
                                            </p>
                                        </div>
                                        <div className="px-2 py-1 rounded-full bg-teal/10 border border-teal/20">
                                            <span className="text-xs text-teal font-medium">
                                                {gen.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted">
                            <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Nothing generated yet.</p>
                            <p className="text-xs mt-1">Generate summaries, MCQs, or flashcards to see them here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardRecentActivity;

