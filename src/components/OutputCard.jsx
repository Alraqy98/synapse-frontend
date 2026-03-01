// src/components/OutputCard.jsx
// Library-style card for MCQ decks, Flashcard decks, Summaries, and Folders
import React, { useState, useRef, useEffect } from "react";
import { Folder, CheckSquare, Zap, FileText, MoreVertical, Trash2, Eye, Edit3 } from "lucide-react";

const DEFAULT_FOLDER_COLOR = "#f7c948";

export default function OutputCard({
    type, // "folder" | "mcq" | "flashcard" | "summary"
    id,
    title,
    folderColor = DEFAULT_FOLDER_COLOR,
    category, // e.g. "MCQ", "Flashcard Deck", "Summary"
    sourceFileName, // "From: filename.pdf"
    date,
    isGenerating = false,
    statusText, // e.g. "Ready", "Generating…"
    onClick,
    onDelete,
    onRename,
    onMoveToFolder,
    shareItem,
    itemId,
    dataDemo,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const isFolder = type === "folder";

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    const handleCardClick = (e) => {
        if (e.target.closest(".menu-container")) return;
        onClick?.();
    };

    const getIcon = () => {
        if (isFolder)
            return <Folder size={28} style={{ color: folderColor }} />;
        if (type === "mcq") return <CheckSquare size={24} className="text-teal" />;
        if (type === "flashcard") return <Zap size={24} className="text-amber-400" />;
        return <FileText size={24} className="text-red-400" />;
    };

    const categoryLabel = isFolder ? "Folder" : (category || "Item");

    return (
        <div
            data-demo={dataDemo}
            onClick={handleCardClick}
            className="group bg-[#0D0F12]/60 border border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm hover:border-teal/40 transition-all hover:shadow-[0_0_35px_rgba(0,200,180,0.12)] flex flex-col cursor-pointer relative"
        >
            <div className="flex justify-between items-start mb-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        backgroundColor: isFolder ? `${folderColor}22` : "rgba(255,255,255,0.04)",
                    }}
                >
                    {getIcon()}
                </div>

                <div className="relative menu-container" ref={menuRef}>
                    <button
                        type="button"
                        className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
                    >
                        <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-44 rounded-xl bg-[#11151d] border border-white/10 shadow-xl z-[50]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {onRename && (
                                <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/10 rounded-t-xl"
                                    onClick={() => { onRename(id, title); setMenuOpen(false); }}
                                >
                                    <Edit3 size={14} /> Rename
                                </button>
                            )}
                            {onMoveToFolder && !isFolder && (
                                <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/10"
                                    onClick={() => { onMoveToFolder(id); setMenuOpen(false); }}
                                >
                                    Move to folder
                                </button>
                            )}
                            <div className="h-px bg-white/10 my-1" />
                            {onDelete && (
                                <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-b-xl"
                                    onClick={() => { onDelete(id); setMenuOpen(false); }}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <h3 className="font-medium text-white truncate mb-2 text-base" title={title}>
                {title}
            </h3>

            <div className="flex items-center gap-2 mb-1">
                <span
                    className={isFolder
                        ? "px-2 py-0.5 rounded-full border border-white/[0.06] text-[9px] uppercase tracking-widest"
                        : "px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.04] text-white/40 text-[9px] uppercase tracking-widest"
                    }
                    style={isFolder ? { backgroundColor: `${folderColor}22`, color: folderColor } : undefined}
                >
                    {categoryLabel}
                </span>
                {date && <span className="text-[10px] text-white/30">{date}</span>}
            </div>
            {sourceFileName && (
                <p className="text-[10px] text-white/30 mb-3">From: {sourceFileName}</p>
            )}
            {!sourceFileName && !isFolder && <div className="mb-3" />}

            {isGenerating && (
                <div className="mb-3">
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-2/3 animate-pulse bg-teal rounded-full" />
                    </div>
                    <p className="mt-1 text-[10px] text-white/40">{statusText || "Generating…"}</p>
                </div>
            )}

            <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-transparent border border-white/[0.15] text-white/60 hover:border-teal/40 hover:text-teal transition-colors text-xs"
                onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            >
                <Eye size={14} />
                {isFolder ? "Open Folder" : "Open"}
            </button>
        </div>
    );
}
