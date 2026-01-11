// src/modules/Tutor/TopicTabsBar.jsx
import React, { useRef } from "react";
import { X, Plus, Clock } from "lucide-react";

const TopicTabsBar = ({
    sessions,
    activeSessionId,
    openTabIds,
    onSelectSession,
    onCreateSession,
    onCloseTab,
    onOpenHistory,
    maxVisibleTabs = 5,
    historyButtonRef,
}) => {
    // Filter to only show open tabs
    const openSessions = sessions.filter((s) => openTabIds.includes(s.id));
    
    // Ensure active session is always visible
    const visibleSessions = [];
    const overflowSessions = [];
    
    // Always include active session first if it exists and is open
    if (activeSessionId) {
        const activeSession = openSessions.find((s) => s.id === activeSessionId);
        if (activeSession) {
            visibleSessions.push(activeSession);
        } else {
            // Active session not in open tabs - add it from all sessions
            const activeSession = sessions.find((s) => s.id === activeSessionId);
            if (activeSession) {
                visibleSessions.push(activeSession);
            }
        }
    }
    
    // Add other open sessions up to maxVisibleTabs
    openSessions.forEach((session) => {
        if (session.id === activeSessionId) return; // Already added
        if (visibleSessions.length < maxVisibleTabs) {
            visibleSessions.push(session);
        } else {
            overflowSessions.push(session);
        }
    });
    
    // Check if there are closed sessions (sessions not in openTabIds)
    const hasClosedSessions = sessions.some((s) => !openTabIds.includes(s.id));

    return (
        <div className="h-14 border-b border-white/5 bg-[#0f1115] flex items-center gap-1 px-4 overflow-x-auto">
            {/* Visible Tabs */}
            {visibleSessions.map((session) => (
                <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-t-lg cursor-pointer transition-all
                        min-w-[120px] max-w-[200px] group relative
                        ${
                            activeSessionId === session.id
                                ? "bg-[#1a1d24] border-t-2 border-x border-white/10 text-white shadow-sm"
                                : "bg-transparent hover:bg-white/5 text-muted hover:text-white"
                        }
                    `}
                >
                    {activeSessionId === session.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal rounded-r" />
                    )}
                    <span className={`text-sm truncate flex-1 ${
                        activeSessionId === session.id ? "font-semibold" : "font-medium"
                    }`}>
                        {session.title}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCloseTab(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity"
                        title="Close tab"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}

            {/* History Button - always show if there are any sessions */}
            {sessions.length > 0 && (
                <button
                    ref={historyButtonRef}
                    onClick={onOpenHistory}
                    className="px-3 py-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Previous topics"
                >
                    <Clock size={16} />
                </button>
            )}

            {/* New Topic Button */}
            <button
                onClick={() => onCreateSession()}
                className="ml-auto px-3 py-2 bg-teal/10 hover:bg-teal/20 border border-teal/20 text-teal rounded-lg transition-all font-medium flex items-center gap-2"
                title="New topic"
            >
                <Plus size={16} />
                <span className="text-sm">New Topic</span>
            </button>
        </div>
    );
};

export default TopicTabsBar;

