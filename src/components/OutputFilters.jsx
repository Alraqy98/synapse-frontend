// src/components/OutputFilters.jsx
// Sidebar filters for MCQ / Flashcards / Summaries — same pattern as LibraryFilters
import React from "react";
import { Plus, FolderPlus } from "lucide-react";

export default function OutputFilters({
    primaryLabel,
    onPrimary,
    onCreateFolder,
    folders = [],
    activeFolderId,
    onSelectFolder,
    allLabel = "All",
}) {
    return (
        <div className="w-60 bg-[#0f1115] border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="p-4 flex flex-col gap-2">
                <button
                    type="button"
                    onClick={onPrimary}
                    className="flex items-center justify-start gap-2 py-3 px-3 rounded-xl w-full text-sm font-medium bg-transparent border border-white/[0.08] text-white/70 hover:border-teal/40 hover:text-teal transition-colors backdrop-blur-sm hover:shadow-[inset_0_0_20px_rgba(0,200,180,0.04)]"
                >
                    <Plus size={16} className="text-white/90 shrink-0" />
                    {primaryLabel}
                </button>
                <button
                    type="button"
                    onClick={onCreateFolder}
                    className="flex items-center justify-start gap-2 py-3 px-3 rounded-xl w-full text-sm bg-transparent border border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white/70 transition-colors"
                >
                    <FolderPlus size={16} className="shrink-0" />
                    New Folder
                </button>
            </div>

            <div className="border-t border-white/[0.04] my-3" />

            <div className="flex flex-col px-4 pb-4 gap-2">
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20 px-3 mb-2">
                    FILTERS
                </div>
                <button
                    type="button"
                    onClick={() => onSelectFolder(null)}
                    className={`text-left text-sm py-2 pl-[10px] pr-3 rounded-lg transition-colors border-l-2 ${activeFolderId == null ? "border-teal/60 text-white" : "border-transparent text-white/40 hover:text-white/80"}`}
                >
                    {allLabel}
                </button>
                {folders.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => onSelectFolder(f.id)}
                        className={`flex items-center gap-2 text-left text-sm py-2 pl-[10px] pr-3 rounded-lg transition-colors border-l-2 max-w-full min-w-0 ${activeFolderId === f.id ? "border-teal/60 text-white" : "border-transparent text-white/40 hover:text-white/80"}`}
                        title={f.name}
                    >
                        <span
                            className="shrink-0 rounded-full"
                            style={{ width: 6, height: 6, backgroundColor: f.color || "rgba(255,255,255,0.2)" }}
                        />
                        <span className="truncate">{f.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
