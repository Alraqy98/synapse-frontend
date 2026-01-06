// src/modules/mcq/MCQEntryModal.jsx
import React from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Play, RefreshCw, Eye } from "lucide-react";

/**
 * Modal shown when opening an MCQ deck based on progress status
 * Handles: Continue, Start over, Review, Retake mistakes, Restart
 */
export default function MCQEntryModal({
    status,
    onContinue,
    onStartOver,
    onReview,
    onRetakeWrong,
    onRestart,
}) {
    if (!status) return null;

    const isInProgress = status === "in_progress";
    const isCompleted = status === "completed";

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
            <div
                className="bg-void border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                data-demo="mcq-resume-modal"
            >
                <h2 className="text-xl font-semibold text-white mb-4">
                    {isInProgress ? "Continue Practice?" : "Deck Complete"}
                </h2>

                <p className="text-sm text-muted mb-6">
                    {isInProgress
                        ? "You have an in-progress attempt. What would you like to do?"
                        : "You've completed this deck. What would you like to do?"}
                </p>

                <div className="space-y-3">
                    {isInProgress && (
                        <>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-teal/10 border border-teal/30 hover:bg-teal/20 text-white transition"
                                onClick={onContinue}
                            >
                                <Play size={18} className="text-teal" />
                                <span className="flex-1 text-left">Continue</span>
                            </button>

                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition"
                                onClick={onStartOver}
                            >
                                <RotateCcw size={18} className="text-muted" />
                                <span className="flex-1 text-left">Start Over</span>
                            </button>
                        </>
                    )}

                    {isCompleted && (
                        <>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-teal/10 border border-teal/30 hover:bg-teal/20 text-white transition"
                                onClick={onReview}
                            >
                                <Eye size={18} className="text-teal" />
                                <span className="flex-1 text-left">Review All</span>
                            </button>

                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition"
                                onClick={onRetakeWrong}
                                data-demo="mcq-resume-review-mistakes"
                            >
                                <RefreshCw size={18} className="text-muted" />
                                <span className="flex-1 text-left">Retake Mistakes</span>
                            </button>

                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition"
                                onClick={onRestart}
                            >
                                <RotateCcw size={18} className="text-muted" />
                                <span className="flex-1 text-left">Restart Full Deck</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

