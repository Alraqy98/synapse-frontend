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
        <div className="w-60 bg-[#0f1115] border-r border-white/5 flex flex-col">

            {/* Upload + New Folder */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-2">

                {/* Upload Button with Help */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onUpload}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl w-full text-sm font-medium bg-transparent border border-white/[0.08] text-white/70 hover:border-teal/40 hover:text-teal transition-colors"
                    >
                        <Plus size={16} />
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
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl w-full text-sm bg-transparent border border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white/70 transition-colors"
                >
                    <FolderPlus size={16} />
                    New Folder
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col p-4 gap-2">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => onSelectFilter(f)}
                        className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${activeFilter === f
                                ? "text-white bg-white/[0.06]"
                                : "text-white/40 hover:text-white/80"
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
