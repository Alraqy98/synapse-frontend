// src/modules/Tutor/PreviousTopicsPanel.jsx
import React, { useState, useRef, useEffect } from "react";
import { X, Edit2, Trash2, MessageSquare } from "lucide-react";

const PreviousTopicsPanel = ({
    isOpen,
    onClose,
    sessions,
    openTabIds,
    activeSessionId,
    onSelectSession,
    onOpenTab,
    onDeleteSession,
    onRenameSession,
    position = { top: 0, left: 0 },
}) => {
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const panelRef = useRef(null);
    const menuRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target) &&
                (!menuRef.current || !menuRef.current.contains(e.target))
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen, onClose]);

    // Close menu on outside click
    useEffect(() => {
        if (!activeMenuId) return;

        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [activeMenuId]);

    const handleMenuAction = async (e, action, sessionId) => {
        e.stopPropagation();
        setActiveMenuId(null);

        if (action === "delete") {
            await onDeleteSession(sessionId);
            return;
        }

        if (action === "rename") {
            const target = sessions.find((s) => s.id === sessionId);
            if (!target) return;
            setRenameTarget(sessionId);
            setRenameValue(target.title || "");
            return;
        }
    };

    const submitRename = async () => {
        if (!renameValue.trim() || !renameTarget) return;
        try {
            await onRenameSession(renameTarget, renameValue.trim());
            // Only close modal after successful rename
            setRenameTarget(null);
            setRenameValue("");
        } catch (err) {
            console.error("Failed to rename session:", err);
            // Keep modal open on error so user can retry
        }
    };

    const cancelRename = () => {
        setRenameTarget(null);
        setRenameValue("");
    };

    if (!isOpen) return null;

    // Separate sessions into open and closed
    const openSessions = sessions.filter((s) => openTabIds.includes(s.id));
    const closedSessions = sessions.filter((s) => !openTabIds.includes(s.id));

    return (
        <>
            {/* Panel */}
            <div
                ref={panelRef}
                className="fixed bg-[#0f1116] border border-white/10 rounded-xl shadow-xl z-50 w-[320px] max-h-[500px] overflow-hidden"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
            >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-medium text-lg">Previous Topics</h3>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[450px]">
                    {/* Open Tabs Section */}
                    {openSessions.length > 0 && (
                        <div className="p-2">
                            <div className="text-xs text-muted uppercase tracking-wider px-2 mb-2">
                                Open Tabs
                            </div>
                            {openSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`
                                        group relative p-3 rounded-lg cursor-pointer transition-all mb-1
                                        ${
                                            activeSessionId === session.id
                                                ? "bg-[#1a1d24] border border-white/10"
                                                : "hover:bg-white/5"
                                        }
                                    `}
                                    onClick={() => onSelectSession(session.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <MessageSquare
                                            size={16}
                                            className={
                                                activeSessionId === session.id
                                                    ? "text-teal"
                                                    : "text-muted"
                                            }
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4
                                                className={`text-sm font-medium truncate ${
                                                    activeSessionId === session.id
                                                        ? "text-white"
                                                        : "text-gray-300"
                                                }`}
                                            >
                                                {session.title}
                                            </h4>
                                            <p className="text-xs text-muted truncate mt-0.5">
                                                {session.lastMessage || "No messages yet"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Menu Trigger */}
                                    <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(
                                                    activeMenuId === session.id
                                                        ? null
                                                        : session.id
                                                );
                                            }}
                                            className="p-1 hover:bg-white/10 rounded text-muted hover:text-white"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>

                                    {/* Menu */}
                                    {activeMenuId === session.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 top-10 w-48 bg-[#0C0F11]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="p-1 space-y-0.5">
                                                <button
                                                    onClick={(e) =>
                                                        handleMenuAction(e, "rename", session.id)
                                                    }
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                                >
                                                    <Edit2 size={14} /> Rename
                                                </button>
                                                <div className="h-px bg-white/10 my-1" />
                                                <button
                                                    onClick={(e) =>
                                                        handleMenuAction(e, "delete", session.id)
                                                    }
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Closed Tabs Section */}
                    {closedSessions.length > 0 && (
                        <div className="p-2 border-t border-white/5">
                            <div className="text-xs text-muted uppercase tracking-wider px-2 mb-2">
                                Closed Tabs
                            </div>
                            {closedSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="group relative p-3 rounded-lg cursor-pointer transition-all mb-1 hover:bg-white/5"
                                    onClick={() => onOpenTab(session.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <MessageSquare size={16} className="text-muted" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate text-gray-300">
                                                {session.title}
                                            </h4>
                                            <p className="text-xs text-muted truncate mt-0.5">
                                                {session.lastMessage || "No messages yet"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Menu Trigger */}
                                    <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(
                                                    activeMenuId === session.id
                                                        ? null
                                                        : session.id
                                                );
                                            }}
                                            className="p-1 hover:bg-white/10 rounded text-muted hover:text-white"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>

                                    {/* Menu */}
                                    {activeMenuId === session.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 top-10 w-48 bg-[#0C0F11]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="p-1 space-y-0.5">
                                                <button
                                                    onClick={(e) =>
                                                        handleMenuAction(e, "rename", session.id)
                                                    }
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                                >
                                                    <Edit2 size={14} /> Rename
                                                </button>
                                                <div className="h-px bg-white/10 my-1" />
                                                <button
                                                    onClick={(e) =>
                                                        handleMenuAction(e, "delete", session.id)
                                                    }
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {sessions.length === 0 && (
                        <div className="p-8 text-center text-muted text-sm">
                            No previous topics
                        </div>
                    )}
                </div>
            </div>

            {/* Rename Modal */}
            {renameTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
                    <div className="bg-[#0f1116] border border-white/10 p-6 rounded-2xl w-[320px] shadow-xl">
                        <h3 className="text-white font-medium text-lg mb-4">Rename Topic</h3>
                        <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") submitRename();
                                if (e.key === "Escape") cancelRename();
                            }}
                            className="w-full px-3 py-2 bg-[#1a1d24] border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-teal/40"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={cancelRename}
                                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRename}
                                className="px-4 py-2 text-sm bg-teal text-black rounded-lg hover:bg-teal/80"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PreviousTopicsPanel;

