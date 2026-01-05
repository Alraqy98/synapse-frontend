// src/modules/dashboard/DashboardRecentActivity.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, BookOpen, CheckSquare, Zap } from "lucide-react";
import { getRecentFiles } from "../Library/apiLibrary";
import { getAllSummaries } from "../summaries/apiSummaries";
import { getMCQDecks } from "../mcq/apiMCQ";
import { getDecks } from "../flashcards/apiFlashcards";

// Format relative time helper (reused from App.jsx)
const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;

    return date.toLocaleDateString();
};

const DashboardRecentActivity = () => {
    const navigate = useNavigate();
    const [recentFiles, setRecentFiles] = useState([]);
    const [recentGenerations, setRecentGenerations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch recent uploads (files only, sorted by created_at DESC, limit 5)
    const fetchRecentUploads = async () => {
        try {
            // Backend already returns files only, sorted by created_at DESC, limited to 5
            const files = await getRecentFiles(5);
            setRecentFiles(files);
        } catch (err) {
            console.error("Failed to fetch recent uploads:", err);
            setRecentFiles([]);
        }
    };

    // Fetch recent generations (summaries, MCQs, flashcards)
    const fetchRecentGenerations = async () => {
        try {
            // Fetch all three types in parallel
            const [summaries, mcqDecks, flashcardDecks] = await Promise.all([
                getAllSummaries().catch(() => []),
                getMCQDecks().catch(() => []),
                getDecks().catch(() => []),
            ]);

            // Normalize summaries (filter completed, map to common format)
            const normalizedSummaries = (summaries || [])
                .filter(s => s.status === "completed" || (!s.generating && s.status !== "generating"))
                .map(s => ({
                    type: "summary",
                    id: s.id,
                    title: s.title || "Untitled Summary",
                    created_at: s.created_at,
                }));

            // Normalize MCQ decks (filter completed)
            const normalizedMCQs = (mcqDecks || [])
                .filter(d => !d.generating)
                .map(d => ({
                    type: "mcq",
                    id: d.id,
                    title: d.title || "Untitled MCQ Deck",
                    created_at: d.created_at,
                }));

            // Normalize flashcard decks (filter completed)
            const normalizedFlashcards = (flashcardDecks || [])
                .filter(d => !d.generating)
                .map(d => ({
                    type: "flashcards",
                    id: d.id,
                    title: d.title || "Untitled Flashcard Deck",
                    created_at: d.created_at,
                }));

            // Combine all, sort by created_at DESC, limit to 5
            const allGenerations = [
                ...normalizedSummaries,
                ...normalizedMCQs,
                ...normalizedFlashcards,
            ]
                .sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA;
                })
                .slice(0, 5);

            setRecentGenerations(allGenerations);
        } catch (err) {
            console.error("Failed to fetch recent generations:", err);
            setRecentGenerations([]);
        }
    };

    // Fetch all data on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchRecentUploads(),
                fetchRecentGenerations(),
            ]);
            setLoading(false);
        };
        loadData();
    }, []);

    const getTypeIcon = (type) => {
        switch (type) {
            case "summary":
                return BookOpen;
            case "mcq":
                return CheckSquare;
            case "flashcards":
                return Zap;
            default:
                return FileText;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case "summary":
                return "Summary";
            case "mcq":
                return "MCQ Deck";
            case "flashcards":
                return "Flashcards";
            default:
                return "Generation";
        }
    };

    const handleFileClick = (fileId) => {
        navigate(`/library/${fileId}`);
    };

    const handleGenerationClick = (generation) => {
        if (generation.type === "summary") {
            navigate(`/summaries/${generation.id}`);
        } else if (generation.type === "mcq") {
            navigate(`/mcq/${generation.id}`);
        } else if (generation.type === "flashcards") {
            navigate(`/flashcards/${generation.id}`);
        }
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Uploads */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Uploads</h3>
                    
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 animate-pulse"
                                >
                                    <div className="p-2 rounded-lg bg-white/10 w-10 h-10" />
                                    <div className="flex-1 min-w-0">
                                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-white/10 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentFiles.length > 0 ? (
                        <div className="space-y-3">
                            {recentFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => handleFileClick(file.id)}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                                >
                                    <div className="p-2 rounded-lg bg-teal/10 border border-teal/20">
                                        <FileText size={18} className="text-teal" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {file.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted">{file.uiCategory || "File"}</span>
                                            <span className="text-xs text-muted">•</span>
                                            <span className="text-xs text-muted">
                                                {formatRelativeTime(file.created_at || file.updated_at)}
                                            </span>
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
                    
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 animate-pulse"
                                >
                                    <div className="p-2 rounded-lg bg-white/10 w-10 h-10" />
                                    <div className="flex-1 min-w-0">
                                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-white/10 rounded w-1/2" />
                                    </div>
                                    <div className="w-16 h-6 bg-white/10 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : recentGenerations.length > 0 ? (
                        <div className="space-y-3">
                            {recentGenerations.map((gen) => {
                                const Icon = getTypeIcon(gen.type);
                                return (
                                    <div
                                        key={`${gen.type}-${gen.id}`}
                                        onClick={() => handleGenerationClick(gen)}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                                    >
                                        <div className="p-2 rounded-lg bg-teal/10 border border-teal/20">
                                            <Icon size={18} className="text-teal" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {getTypeLabel(gen.type)}
                                            </p>
                                            <p className="text-xs text-muted truncate mt-1">
                                                {gen.title}
                                            </p>
                                        </div>
                                        <div className="px-2 py-1 rounded-full bg-teal/10 border border-teal/20">
                                            <span className="text-xs text-teal font-medium">
                                                Completed
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

