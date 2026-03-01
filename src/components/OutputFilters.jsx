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
            <div className="p-4 border-b border-white/[0.06] flex flex-col gap-2">
                <button
                    type="button"
                    onClick={onPrimary}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl w-full text-sm font-medium bg-transparent border border-white/[0.08] text-white/70 hover:border-teal/40 hover:text-teal transition-colors"
                >
                    <Plus size={16} />
                    {primaryLabel}
                </button>
                <button
                    type="button"
                    onClick={onCreateFolder}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl w-full text-sm bg-transparent border border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white/70 transition-colors"
                >
                    <FolderPlus size={16} />
                    New Folder
                </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
                <button
                    type="button"
                    onClick={() => onSelectFolder(null)}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${activeFolderId == null ? "text-white bg-white/[0.06]" : "text-white/40 hover:text-white/80"}`}
                >
                    {allLabel}
                </button>
                {folders.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => onSelectFolder(f.id)}
                        className={`text-left text-sm px-3 py-2 rounded-lg transition-colors max-w-full truncate ${activeFolderId === f.id ? "text-white bg-white/[0.06]" : "text-white/40 hover:text-white/80"}`}
                        title={f.name}
                    >
                        {f.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
