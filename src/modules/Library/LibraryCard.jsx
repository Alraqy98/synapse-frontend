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
    Check,
} from "lucide-react";
// Processing logic kept for backend/AI features but not used for UI blocking

const LibraryCard = ({
    item,
    onOpen,
    onDelete,
    onMoveToFolder,
    onChangeCategory,
    onRename,
    onToggleDone,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const isFolder =
        item.is_folder === true ||
        item.type === "folder" ||
        item.kind === "folder";

    const folderColor = item.color || "#f7c948"; // fallback yellow

    // Processing logic kept for backend/AI features but not used for UI blocking
    // Files are always accessible regardless of processing state

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
        onOpen?.(item);
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
            data-demo="demo-file-card"
            className={`
                group bg-[#1a1d24] border border-white/5 rounded-2xl p-4
                hover:border-teal/40 transition-all hover:shadow-[0_0_35px_rgba(0,200,180,0.12)]
                flex flex-col cursor-pointer relative
                ${item.is_done ? "opacity-75" : ""}
            `}
        >
            {/* DONE MARKER - Top-left (files only) */}
            {!isFolder && (
                <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleDone?.(item.id, !item.is_done);
                    }}
                >
                    <div
                        className={`
                            w-6 h-6 rounded-full flex items-center justify-center border transition-colors cursor-pointer
                            ${item.is_done
                                ? "bg-teal-500 border-teal-500 text-black"
                                : "border-gray-600 text-transparent hover:border-teal-400"
                            }
                        `}
                    >
                        <Check className="w-4 h-4" />
                    </div>
                </div>
            )}

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
                className="
                    w-full flex items-center justify-center gap-2 py-2 rounded-xl
                    bg-teal/10 text-teal hover:bg-teal hover:text-black
                    transition-colors text-sm font-medium
                "
            >
                <Eye size={14} />
                {isFolder ? "Open Folder" : "Open"}
            </button>
        </div>
    );
};

export default LibraryCard;
