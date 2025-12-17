// src/modules/Library/LibraryFilters.jsx

import React from "react";
import { Plus, FolderPlus } from "lucide-react";

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

                {/* Upload Button */}
                <button
                    onClick={onUpload}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-teal/20 text-teal hover:bg-teal hover:text-black transition font-medium"
                >
                    <Plus size={16} />
                    Upload
                </button>

                {/* Folder Button (ONLY here) */}
                <button
                    onClick={onCreateFolder}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition font-medium"
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
                        className={`text-left px-3 py-2 rounded-lg transition ${activeFilter === f
                                ? "bg-teal text-black font-medium"
                                : "text-muted hover:text-white hover:bg-white/5"
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
