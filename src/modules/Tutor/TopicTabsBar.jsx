// src/modules/Tutor/TopicTabsBar.jsx
import React, { useRef } from "react";
import { useParams } from "react-router-dom";
import { X, Plus, Clock } from "lucide-react";

const TopicTabsBar = ({
    sessions,
    openTabIds,
    onSelectSession,
    onCreateSession,
    onCloseTab,
    onOpenHistory,
    maxVisibleTabs = 5,
    historyButtonRef,
}) => {
    // Derive activeSessionId from URL - URL is authoritative
    const { sessionId: activeSessionId } = useParams();
    // Filter to only show open tabs, preserving order from openTabIds
    // Create a map for quick lookup
    const sessionMap = new Map(sessions.map(s => [s.id, s]));
    
    // Build visibleSessions in the order they appear in openTabIds (NO reordering)
    const visibleSessions = [];
    const overflowSessions = [];
    
    // Add all open sessions in their original order from openTabIds
    const orderedOpenSessions = [];
    openTabIds.forEach(tabId => {
        const session = sessionMap.get(tabId);
        if (session) {
            orderedOpenSessions.push(session);
        }
    });
    
    // If active session is not in openTabIds, add it at the end (but don't reorder existing tabs)
    if (activeSessionId && !openTabIds.includes(activeSessionId)) {
        const activeSession = sessionMap.get(activeSessionId);
        if (activeSession) {
            orderedOpenSessions.push(activeSession);
        }
    }
    
    // Split into visible and overflow based on maxVisibleTabs
    // Preserve order - active tab will be visible if it's within the first maxVisibleTabs
    orderedOpenSessions.forEach((session, index) => {
        if (index < maxVisibleTabs) {
            visibleSessions.push(session);
        } else {
            overflowSessions.push(session);
        }
    });
    
    // Check if there are closed sessions (sessions not in openTabIds)
    const hasClosedSessions = sessions.some((s) => !openTabIds.includes(s.id));

    return (
        <div className="h-14 flex-shrink-0 border-b border-white/10 bg-[#0f1115] flex items-end gap-1 px-4 overflow-x-auto relative">
            {/* Baseline divider - spans full width */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
            
            {/* Visible Tabs */}
            {visibleSessions.map((session) => (
                <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-all
                        min-w-[120px] max-w-[200px] group relative
                        ${
                            activeSessionId === session.id
                                ? "bg-[#1a1d24] border-t-2 border-l border-r border-white/10 border-b-0 text-white rounded-t-lg z-10 mb-[-1px]"
                                : "bg-transparent text-muted hover:text-white hover:bg-white/5 rounded-t-lg"
                        }
                    `}
                >
                    {/* Active tab top accent line */}
                    {activeSessionId === session.id && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-teal rounded-t-lg" />
                    )}
                    <span className={`text-sm truncate flex-1 ${
                        activeSessionId === session.id ? "font-semibold text-white" : "font-medium"
                    }`}>
                        {session.title}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCloseTab(session.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity ${
                            activeSessionId === session.id ? "text-white/60 hover:text-white" : "text-muted hover:text-white"
                        }`}
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

