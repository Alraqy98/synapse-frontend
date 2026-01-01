// src/modules/Library/LibraryCard.jsx
import React, { useState, useRef, useEffect } from "react";
import {
    FileText,
    Book,
    File,
    Folder,
    MoreVertical,
    Trash2,
    Eye,
    FolderOpen,
    Edit3,
    ArrowLeftRight,
} from "lucide-react";
import { getFileProcessingStatus } from "./utils/fileReadiness";

const LibraryCard = ({
    item,
    onOpen,
    onDelete,
    onMoveToFolder,
    onChangeCategory,
    onRename,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const isFolder =
        item.is_folder === true ||
        item.type === "folder" ||
        item.kind === "folder";

    const folderColor = item.folder_color || "#f7c948"; // fallback yellow

    // Calculate progress for processing files
    let progress = 0;
    let isProcessing = false;
    
    if (!isFolder) {
        const processingStatus = getFileProcessingStatus(item);
        isProcessing = processingStatus === "Processing";
        
        if (isProcessing) {
            // Calculate progress based on render_state
            const renderState = item.render_state || item.file_render_state;
            if (renderState) {
                const total = item.total_pages || 0;
                const rendered = item.rendered_pages || 0;
                if (total > 0) {
                    progress = Math.min(90, Math.round((rendered / total) * 100));
                } else {
                    progress = 30; // Default progress for files without page count
                }
            } else {
                progress = 30; // Default progress when render_state is missing
            }
        }
    }

    /* ---------------------------
       ICON LOGIC (color-coded)
    --------------------------- */
    const getIcon = () => {
        if (isFolder)
            return (
                <Folder
                    size={28}
                    style={{ color: folderColor }}
                />
            );

        if (item.category === "books" || item.uiCategory === "Book")
            return <Book size={24} className="text-orange-400" />;

        if (item.mime_type?.includes("pdf"))
            return <FileText size={24} className="text-red-400" />;

        return <File size={24} className="text-teal" />;
    };

    const formattedDate = item.updated_at
        ? new Date(item.updated_at).toLocaleDateString()
        : "";

    /* ---------------------------
       CLOSE MENU OUTSIDE CLICK
    --------------------------- */
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    /* ---------------------------
       ACTION HANDLERS
    --------------------------- */
    const handleOpen = () => {
        if (!isProcessing) {
            onOpen?.(item);
        }
    };

    const handleDelete = () => {
        onDelete?.(item.id);
        setMenuOpen(false);
    };

    const handleRename = () => {
        onRename?.(item);
        setMenuOpen(false);
    };

    const handleMoveToFolder = () => {
        onMoveToFolder?.(item);
        setMenuOpen(false);
    };

    const handleChangeCategoryClick = () => {
        onChangeCategory?.(item);
        setMenuOpen(false);
    };

    /* ---------------------------
       RENDER
    --------------------------- */
    return (
        <div
            className={`
                group bg-[#1a1d24] border border-white/5 rounded-2xl p-4
                hover:border-teal/40 transition-all hover:shadow-[0_0_35px_rgba(0,200,180,0.12)]
                flex flex-col cursor-pointer relative
                ${isProcessing ? "opacity-90" : ""}
            `}
        >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        backgroundColor: isFolder ? `${folderColor}22` : "rgba(255,255,255,0.05)",
                    }}
                >
                    {getIcon()}
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        className="p-1 text-muted hover:text-white rounded hover:bg-white/10 transition"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((prev) => !prev);
                        }}
                    >
                        <MoreVertical size={16} />
                    </button>

                    {menuOpen && (
                        <div
                            className="
                                absolute right-0 mt-2 w-44 rounded-xl bg-[#11151d]
                                border border-white/10 shadow-xl z-[50]
                            "
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Rename */}
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/10 rounded-t-xl"
                                onClick={handleRename}
                            >
                                <Edit3 size={14} />
                                Rename
                            </button>

                            {/* Move */}
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/10"
                                onClick={handleMoveToFolder}
                            >
                                <FolderOpen size={14} />
                                {isFolder ? "Move folder" : "Move to folder"}
                            </button>

                            {/* Change category — files only */}
                            {!isFolder && (
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/10"
                                    onClick={handleChangeCategoryClick}
                                >
                                    <ArrowLeftRight size={14} />
                                    Change category
                                </button>
                            )}

                            <div className="h-px bg-white/10 my-1" />

                            {/* Delete */}
                            <button
                                className="
                                    w-full flex items-center gap-2 px-3 py-2 text-xs
                                    text-red-400 hover:bg-red-500/10 rounded-b-xl
                                "
                                onClick={handleDelete}
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TITLE */}
            <h3
                className="font-medium text-white truncate mb-2 text-sm"
                onClick={handleOpen}
                title={item.title}
            >
                {item.title}
            </h3>

            {/* PROGRESS BAR - Only show when processing */}
            {isProcessing && (
                <div className="mb-2">
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* META */}
            <div className="flex items-center gap-2 text-[11px] text-muted mb-3">
                <span
                    className="px-2 py-0.5 rounded-full border border-white/5 capitalize"
                    style={{
                        backgroundColor: isFolder ? `${folderColor}33` : "rgba(255,255,255,0.05)",
                        color: isFolder ? folderColor : "#ccc",
                    }}
                >
                    {isFolder ? "Folder" : item.uiCategory || "File"}
                </span>

                {formattedDate && <span>{formattedDate}</span>}
            </div>

            {/* PRIMARY ACTION BUTTON */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleOpen();
                }}
                disabled={isProcessing}
                className={`
                    w-full flex items-center justify-center gap-2 py-2 rounded-xl
                    transition-colors text-sm font-medium
                    ${isProcessing
                        ? "bg-white/5 text-muted cursor-not-allowed"
                        : "bg-teal/10 text-teal hover:bg-teal hover:text-black"
                    }
                `}
            >
                <Eye size={14} />
                {isProcessing ? "Processing…" : (isFolder ? "Open Folder" : "Open")}
            </button>
        </div>
    );
};

export default LibraryCard;
