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
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-teal/20 text-teal hover:bg-teal hover:text-black transition font-medium"
                >
                    <Plus size={16} />
                    {primaryLabel}
                </button>
                <button
                    type="button"
                    onClick={onCreateFolder}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition font-medium"
                >
                    <FolderPlus size={16} />
                    New Folder
                </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
                <button
                    type="button"
                    onClick={() => onSelectFolder(null)}
                    className={`text-left px-3 py-2 rounded-lg transition ${activeFolderId == null ? "bg-teal text-black font-medium" : "text-white/40 hover:text-white"}`}
                >
                    {allLabel}
                </button>
                {folders.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => onSelectFolder(f.id)}
                        className={`text-left px-3 py-2 rounded-lg transition max-w-full truncate ${activeFolderId === f.id ? "bg-teal text-black font-medium" : "text-white/40 hover:text-white"}`}
                        title={f.name}
                    >
                        {f.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
