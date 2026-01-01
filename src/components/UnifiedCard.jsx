// src/components/UnifiedCard.jsx
// Unified card component for Summaries, MCQs, and Flashcards
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Edit2, Trash2, Copy, Download } from "lucide-react";

/**
 * UnifiedCard - A consistent card component used across all pages
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.meta - Meta information (e.g., "From: filename.pdf")
 * @param {string} props.contextNote - Context note (e.g., "Medical · Cardiology · Exam prep")
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.status - Status: "idle" | "generating" | "finalizing" | "ready" | "failed"
 * @param {string} props.statusText - Status badge text (e.g., "Summary", "MCQ Deck", "Flashcard Deck")
 * @param {string} props.date - Formatted date string
 * @param {boolean} props.isGenerating - Whether item is currently generating
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onRename - Rename handler
 * @param {Function} props.onExportCode - Export code handler (optional)
 * @param {Array} props.overflowActions - Custom overflow menu actions
 */
export default function UnifiedCard({
    title,
    meta,
    contextNote,
    progress = 0,
    status = "idle", // "idle" | "generating" | "finalizing" | "ready" | "failed"
    statusText,
    date,
    isGenerating = false,
    onClick,
    onDelete,
    onRename,
    onExportCode,
    overflowActions = [],
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [renameValue, setRenameValue] = useState(title);
    const [showExportCode, setShowExportCode] = useState(false);
    const [importCode, setImportCode] = useState(null);
    const [copiedFeedback, setCopiedFeedback] = useState(false);

    // Determine if card is interactive
    const isInteractive = !isGenerating && status !== "failed";
    const isDisabled = isGenerating || status === "failed";

    // Calculate progress percentage
    const progressPercent = Math.min(100, Math.max(0, progress));

    // Get progress bar color based on status
    const getProgressColor = () => {
        if (status === "failed") return "bg-red-500";
        if (status === "ready") return "bg-teal";
        if (status === "finalizing") return "bg-teal";
        if (status === "generating") return "bg-gradient-to-r from-teal-400 to-emerald-500";
        return "bg-white/10";
    };

    // Get status badge color
    const getStatusBadgeColor = () => {
        if (status === "failed") return "bg-red-500/10 border-red-500/30 text-red-400";
        if (status === "generating" || status === "finalizing") return "bg-teal/10 border-teal/30 text-teal";
        return "bg-teal/10 border-teal/30 text-teal";
    };

    // Get status text
    const getStatusDisplayText = () => {
        if (status === "failed") return "Failed";
        if (status === "generating") return "Generating…";
        if (status === "finalizing") return "Finalizing…";
        if (status === "ready") return statusText || "Ready";
        return statusText || "Ready";
    };

    // Default overflow actions
    const defaultActions = [
        ...(onRename ? [{
            label: "Rename",
            icon: Edit2,
            onClick: () => {
                setShowMenu(false);
                setShowRename(true);
            },
        }] : []),
        ...(onExportCode ? [{
            label: "Generate Import Code",
            icon: Copy,
            onClick: () => {
                setShowMenu(false);
                handleExportCode();
            },
        }] : []),
        ...(onDelete ? [{
            label: "Delete",
            icon: Trash2,
            onClick: () => {
                setShowMenu(false);
                onDelete && onDelete();
            },
            destructive: true,
        }] : []),
    ];

    const allActions = [...defaultActions, ...overflowActions];

    // Simple import code generator (if needed) - only used if onExportCode is provided
    const generateImportCode = () => {
        return `SYN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    };

    // Handle export code generation
    const handleExportCode = () => {
        if (onExportCode) {
            const code = generateImportCode();
            setImportCode(code);
            setShowExportCode(true);
            onExportCode(code);
        }
    };

    return (
        <>
            <div
                className={`group rounded-2xl border border-white/10 bg-black/40 p-6 transition-all ${
                    isDisabled
                        ? "opacity-75 cursor-not-allowed"
                        : "cursor-pointer hover:-translate-y-1 hover:border-teal/40"
                }`}
                onClick={isInteractive ? onClick : undefined}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            {title}
                        </h3>
                        {contextNote && (
                            <p className="text-xs text-muted mb-1">
                                {contextNote}
                            </p>
                        )}
                        {meta && (
                            <p className="text-xs text-muted">
                                {meta}
                            </p>
                        )}
                    </div>

                    {isInteractive && allActions.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition text-muted hover:text-white"
                                title="More actions"
                            >
                                <MoreHorizontal size={16} />
                            </button>

                            {showMenu && (
                                <div
                                    className="absolute right-0 top-6 w-48 bg-void border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-1 space-y-0.5">
                                        {allActions.map((action, idx) => {
                                            const Icon = action.icon;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        action.onClick();
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
                                                        action.destructive
                                                            ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                            : "text-gray-300 hover:text-teal hover:bg-teal/10"
                                                    }`}
                                                >
                                                    {Icon && <Icon size={14} />}
                                                    {action.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${getProgressColor()}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted mt-4 pt-4 border-t border-white/5">
                    {isGenerating || status === "generating" || status === "finalizing" ? (
                        <>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                                In progress
                            </span>
                            <span className={`px-2 py-1 rounded-full border text-[10px] ${getStatusBadgeColor()}`}>
                                {getStatusDisplayText()}
                            </span>
                        </>
                    ) : status === "failed" ? (
                        <>
                            <span className="flex items-center gap-2 text-red-400">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                Failed
                            </span>
                            <span className={`px-2 py-1 rounded-full border text-[10px] ${getStatusBadgeColor()}`}>
                                {getStatusDisplayText()}
                            </span>
                        </>
                    ) : (
                        <>
                            <span>{date || ""}</span>
                            <span className={`px-2 py-1 rounded-full border text-[10px] ${getStatusBadgeColor()}`}>
                                {getStatusDisplayText()}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Rename Modal */}
            {showRename && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Rename
                        </h3>
                        <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white mb-6"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (renameValue.trim() && onRename) {
                                        onRename(renameValue.trim());
                                        setShowRename(false);
                                    }
                                }
                                if (e.key === "Escape") {
                                    setShowRename(false);
                                }
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowRename(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (renameValue.trim() && onRename) {
                                        onRename(renameValue.trim());
                                        setShowRename(false);
                                    }
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Code Modal - Portal to document.body for viewport centering */}
            {showExportCode && importCode && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => {
                        setShowExportCode(false);
                        setImportCode(null);
                        setCopiedFeedback(false);
                    }}
                >
                    <div 
                        className="w-full max-w-md mx-4 rounded-2xl bg-black border border-white/10 p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Import Code Generated
                        </h3>
                        <p className="text-sm text-muted mb-4">
                            Share this code to import this item. This code works only inside Synapse.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                            <div className="text-2xl font-mono font-bold text-teal text-center">
                                {importCode}
                            </div>
                        </div>
                        <button
                            className="w-full btn btn-primary mb-2 relative"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(importCode);
                                    setCopiedFeedback(true);
                                    setTimeout(() => setCopiedFeedback(false), 1500);
                                } catch (err) {
                                    console.error("Failed to copy to clipboard:", err);
                                }
                            }}
                        >
                            <Copy size={16} className="mr-2" />
                            {copiedFeedback ? "Copied to clipboard" : "Copy Code"}
                        </button>
                        <button
                            className="w-full btn btn-secondary"
                            onClick={() => {
                                setShowExportCode(false);
                                setImportCode(null);
                                setCopiedFeedback(false);
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

