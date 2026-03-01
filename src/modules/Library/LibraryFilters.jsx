// src/modules/Library/LibraryFilters.jsx

import React from "react";
import { Plus, FolderPlus } from "lucide-react";
import HelpPopup from "../../components/HelpPopup";

const filters = ["All", "Lecture", "Notes", "Exams", "Book"];

const LibraryFilters = ({
    activeFilter,
    onSelectFilter,
    onUpload,
    onCreateFolder,
}) => {
    return (
        <div className="w-60 bg-[#0f1115] bg-white/[0.01] border-r border-white/5 flex flex-col">

            {/* Upload + New Folder */}
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onUpload}
                        className="flex-1 flex items-center justify-start gap-2 py-3 px-3 rounded-xl w-full text-sm font-medium bg-white/[0.03] border border-white/[0.08] text-white/70 hover:border-teal/40 hover:text-teal transition-colors backdrop-blur-sm hover:shadow-[inset_0_0_20px_rgba(0,200,180,0.04)]"
                    >
                        <Plus size={16} className="text-white/90 shrink-0" />
                        Upload
                    </button>
                    <HelpPopup
                        title="How Synapse Works"
                        content={[
                            "Upload a file",
                            "Open it in File Viewer",
                            "OCR & rendering run automatically",
                            "When finished, Summaries / MCQs / Flashcards unlock"
                        ]}
                        footer="Processing runs in the background."
                        storageKey="hasSeenFileFlowHelp"
                        placement="bottom"
                        autoShow={true}
                    />
                </div>

                {/* Folder Button (ONLY here) */}
                <button
                    onClick={onCreateFolder}
                    className="flex items-center justify-start gap-2 py-3 px-3 rounded-xl w-full text-sm bg-white/[0.02] border border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white/70 transition-colors"
                >
                    <FolderPlus size={16} className="shrink-0" />
                    New Folder
                </button>
            </div>

            <div className="border-t border-white/[0.04] my-3" />

            {/* Filters */}
            <div className="flex flex-col px-4 pb-4 gap-2">
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20 px-3 mb-2">
                    FILTERS
                </div>
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => onSelectFilter(f)}
                        className={`text-left text-sm py-2 pl-[10px] pr-3 rounded-lg transition-colors border-l-2 ${activeFilter === f
                                ? "border-teal/60 text-white bg-white/[0.04]"
                                : "border-transparent text-white/40 hover:text-white/80"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LibraryFilters;
