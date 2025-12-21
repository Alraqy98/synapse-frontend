// src/modules/summaries/SummaryCard.jsx
import React, { useState } from "react";
import { Trash2, MoreHorizontal, Edit2, Download, Copy } from "lucide-react";
import { generateImportCode } from "./utils/summaryCode";

export default function SummaryCard({
    summary,
    onClick,
    onDelete,
    onRename,
    onExportCode,
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [renameValue, setRenameValue] = useState(summary.title);
    const [showExportCode, setShowExportCode] = useState(false);
    const [importCode, setImportCode] = useState(null);
    const {
        id,
        title,
        academic_stage,
        specialty,
        goal,
        file_name,
        created_at,
    } = summary;

    // Format context note
    const contextParts = [];
    if (academic_stage) contextParts.push(academic_stage);
    if (specialty) contextParts.push(specialty);
    if (goal) contextParts.push(goal);
    const contextNote = contextParts.length > 0 ? contextParts.join(" · ") : null;

    return (
        <>
        <div
            className="group cursor-pointer rounded-2xl border border-white/10 bg-black/40 p-6 transition-all hover:-translate-y-1 hover:border-teal/40"
            onClick={onClick}
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
                    {file_name && (
                        <p className="text-xs text-muted">
                            From: {file_name}
                        </p>
                    )}
                </div>

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
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        setShowRename(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                >
                                    <Edit2 size={14} /> Rename
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        const code = generateImportCode();
                                        setImportCode(code);
                                        setShowExportCode(true);
                                        onExportCode && onExportCode(id, code);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                >
                                    <Copy size={14} /> Generate Import Code
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        // Export PDF - UI only for now
                                        alert("PDF export with Synapse template coming soon");
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition opacity-50 cursor-not-allowed"
                                    title="PDF export with Synapse template coming soon"
                                >
                                    <Download size={14} /> Export as PDF
                                </button>

                                <div className="h-px bg-white/10 my-1" />

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        onDelete && onDelete(id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted mt-4 pt-4 border-t border-white/5">
                <span>
                    {created_at
                        ? new Date(created_at).toLocaleDateString()
                        : ""}
                </span>
                <span className="px-2 py-1 rounded-full bg-teal/10 border border-teal/30 text-teal text-[10px]">
                    Summary
                </span>
            </div>
        </div>

        {/* Rename Modal */}
        {showRename && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                <div className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Rename Summary
                    </h3>
                    <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white mb-6"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (renameValue.trim() && onRename) {
                                    onRename(id, renameValue.trim());
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
                                    onRename(id, renameValue.trim());
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

        {/* Export Code Modal */}
        {showExportCode && importCode && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                <div className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Import Code Generated
                    </h3>
                    <p className="text-sm text-muted mb-4">
                        Share this code to import this summary. This code works only inside Synapse.
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                        <div className="text-2xl font-mono font-bold text-teal text-center">
                            {importCode}
                        </div>
                    </div>
                    <button
                        className="w-full btn btn-primary mb-2"
                        onClick={() => {
                            navigator.clipboard.writeText(importCode);
                            alert("Code copied to clipboard!");
                        }}
                    >
                        <Copy size={16} className="mr-2" />
                        Copy Code
                    </button>
                    <button
                        className="w-full btn btn-secondary"
                        onClick={() => {
                            setShowExportCode(false);
                            setImportCode(null);
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        )}
        </>
    );
}

