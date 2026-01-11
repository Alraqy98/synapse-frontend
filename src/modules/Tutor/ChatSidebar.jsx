// src/modules/tutor/ChatSidebar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus,
    MessageSquare,
    MoreHorizontal,
    Trash2,
    Edit2,
    Layers,
} from 'lucide-react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const ChatSidebar = ({
    sessions,
    onSelectSession,
    onCreateSession,
    onDeleteSession,
    onRenameSession,
    isLoading = false,
}) => {
    // Derive activeSessionId from URL - URL is authoritative
    const { sessionId: activeSessionId } = useParams();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const [renameTarget, setRenameTarget] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleMenuAction = async (e, action, sessionId) => {
        e.stopPropagation();
        setActiveMenuId(null);

        if (action === "delete") {
            await onDeleteSession(sessionId);
            return;
        }

        if (action === "rename") {
            const target = sessions.find(s => s.id === sessionId);
            if (!target) return;
            setRenameTarget(sessionId);
            setRenameValue(target.title || "");
            return;
        }

        if (action === "duplicate") {
            const base = sessions.find(s => s.id === sessionId);
            if (!base) return;
            const newTitle = base.title + " (Copy)";
            await onCreateSession(newTitle);
            return;
        }
    };

    const submitRename = async () => {
        if (!renameValue.trim()) return;
        await onRenameSession(renameTarget, renameValue.trim());
        setRenameTarget(null);
        setRenameValue("");
    };

    const cancelRename = () => {
        setRenameTarget(null);
        setRenameValue("");
    };

    const renderSkeleton = () => {
        return (
            <div className="flex flex-col gap-2 px-2 py-2">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="h-12 rounded-xl bg-white/5 animate-pulse"
                    />
                ))}
            </div>
        );
    };

    return (
        <div
            className={`h-full border-r border-white/5 bg-[#0f1115] flex flex-col transition-all duration-200 relative
        ${isCollapsed ? 'w-[70px]' : 'w-[300px]'}`}
        >
            {/* Collapse Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 w-6 h-6 bg-[#1a1d24] border border-white/10 rounded-full flex items-center justify-center text-muted hover:text-teal hover:border-teal transition-all z-50"
            >
                {isCollapsed ? <HiChevronRight size={14} /> : <HiChevronLeft size={14} />}
            </button>

            {/* Header */}
            <div className="p-4 border-b border-white/5">
                <button
                    onClick={() => onCreateSession()}
                    className={`w-full py-3 ${isCollapsed ? 'px-0' : 'px-4'}
            bg-teal/10 hover:bg-teal/20 border border-teal/20 text-teal rounded-xl
            flex items-center justify-center gap-2 transition-all font-medium`}
                    title="New Chat"
                >
                    <Plus size={18} />
                    {!isCollapsed && "New Chat"}
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading && sessions.length === 0 && renderSkeleton()}

                {!isLoading && sessions.map((session) => (
                    <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`
              group relative p-3 rounded-xl cursor-pointer transition-all border
              ${activeSessionId === session.id
                                ? 'bg-[#1a1d24] border-white/10'
                                : 'border-transparent hover:bg-white/5'}
              ${isCollapsed ? 'flex justify-center' : ''}
            `}
                        title={isCollapsed ? session.title : ''}
                    >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                            <MessageSquare
                                size={18}
                                className={`${activeSessionId === session.id ? 'text-teal' : 'text-muted'}`}
                            />

                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-white' : 'text-gray-400'
                                            }`}
                                    >
                                        {session.title}
                                    </h3>
                                    <p className="text-xs text-muted truncate mt-1">
                                        {session.lastMessage || "No messages yet"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Menu Trigger */}
                        {!isCollapsed && (
                            <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(activeMenuId === session.id ? null : session.id);
                                    }}
                                    className={`p-1 hover:bg-white/10 rounded text-muted hover:text-white
                    ${activeMenuId === session.id ? 'opacity-100 bg-white/10 text-white' : ''}`}
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        )}

                        {/* Floating Menu */}
                        {activeMenuId === session.id && !isCollapsed && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-8 w-48 bg-[#0C0F11]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-1 space-y-0.5">
                                    <button
                                        onClick={(e) => handleMenuAction(e, 'rename', session.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300
                      hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                    >
                                        <Edit2 size={14} /> Rename Chat
                                    </button>

                                    <button
                                        onClick={(e) => handleMenuAction(e, 'duplicate', session.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300
                      hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                    >
                                        <Layers size={14} /> Duplicate Chat
                                    </button>

                                    <div className="h-px bg-white/10 my-1" />

                                    <button
                                        onClick={(e) => handleMenuAction(e, 'delete', session.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
                      hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                    >
                                        <Trash2 size={14} /> Delete Chat
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Rename Modal */}
            {renameTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
                    <div className="bg-[#0f1116] border border-white/10 p-6 rounded-2xl w-[320px] shadow-xl">
                        <h3 className="text-white font-medium text-lg mb-4">Rename Chat</h3>

                        <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
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
        </div>
    );
};

export default ChatSidebar;
