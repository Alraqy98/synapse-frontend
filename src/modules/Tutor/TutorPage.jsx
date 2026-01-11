// src/modules/tutor/TutorPage.jsx
import React, { useState, useEffect, useRef } from "react";
// ChatSidebar kept for potential reuse, but visually hidden
// import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import TopicTabsBar from "./TopicTabsBar";
import PreviousTopicsPanel from "./PreviousTopicsPanel";
import EmptyStatePanel from "./EmptyStatePanel";

import {
    getSessions,
    createNewSession,
    deleteSession,
    renameSession,
} from "./apiTutor";

const TutorPage = () => {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [openTabIds, setOpenTabIds] = useState(new Set());
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [historyPanelPosition, setHistoryPanelPosition] = useState({ top: 0, left: 0 });
    const historyButtonRef = useRef(null);
    const chatWindowFocusRef = useRef(null);
    // Track sessions that have been manually renamed (to prevent auto-rename)
    const [manuallyRenamedSessions, setManuallyRenamedSessions] = useState(new Set());

    useEffect(() => {
        loadSessions();
    }, []);

    // When activeSessionId changes, ensure it's in openTabIds
    useEffect(() => {
        if (activeSessionId && !openTabIds.has(activeSessionId)) {
            setOpenTabIds((prev) => new Set([...prev, activeSessionId]));
        }
    }, [activeSessionId, openTabIds]);

    const loadSessions = async () => {
        setIsLoadingSessions(true);

        try {
            const list = await getSessions();

            // ❗ DO NOT auto-select any session
            // ❗ DO NOT override activeSessionId
            setSessions(list || []);

            // If user already had an active session, keep it. Otherwise leave null.
            setActiveSessionId((prev) => {
                if (prev && list.some((s) => s.id === prev)) return prev;
                return null; // tabs start with NO selected chat
            });
        } catch (err) {
            console.error("Failed to load sessions:", err);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleCreateSession = async (title = "New Chat") => {
        try {
            const newSession = await createNewSession(title);
            setSessions((prev) => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
            // Add to open tabs
            setOpenTabIds((prev) => new Set([...prev, newSession.id]));
        } catch (err) {
            console.error("Failed to create session:", err);
        }
    };

    const handleSelectSession = (sessionId) => {
        setActiveSessionId(sessionId);
        // Ensure it's in open tabs, but DON'T reorder - just add if missing
        setOpenTabIds((prev) => {
            if (prev.has(sessionId)) {
                // Already in open tabs - don't change order
                return prev;
            }
            // Not in open tabs - add to end (preserve order)
            return new Set([...prev, sessionId]);
        });
    };

    const handleCloseTab = (sessionId) => {
        // Remove from open tabs, but don't delete the session
        setOpenTabIds((prev) => {
            const next = new Set(prev);
            next.delete(sessionId);
            return next;
        });

        // If closing the active tab, clear activeSessionId
        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
        }
    };

    const handleOpenTab = (sessionId) => {
        // Add back to open tabs and make it active
        setOpenTabIds((prev) => new Set([...prev, sessionId]));
        setActiveSessionId(sessionId);
        setIsHistoryPanelOpen(false);
    };

    const handleOpenHistory = () => {
        // Calculate position relative to history button
        if (historyButtonRef.current) {
            const rect = historyButtonRef.current.getBoundingClientRect();
            setHistoryPanelPosition({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
        setIsHistoryPanelOpen(true);
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            await deleteSession(sessionId);

            const updated = sessions.filter((s) => s.id !== sessionId);
            setSessions(updated);

            // Remove from open tabs
            setOpenTabIds((prev) => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });

            if (activeSessionId === sessionId) {
                setActiveSessionId(null); // ✨ do not auto-select next session
            }
        } catch (err) {
            console.error("Failed to delete session:", err);
        }
    };

    const handleRenameSession = async (sessionId, newTitle, isManual = true) => {
        try {
            const updated = await renameSession(sessionId, newTitle);
            setSessions((prev) =>
                prev.map((s) => (s.id === sessionId ? updated : s))
            );
            
            // Track manual renames to prevent auto-rename
            if (isManual) {
                setManuallyRenamedSessions((prev) => new Set([...prev, sessionId]));
            }
        } catch (err) {
            console.error("Failed to rename session:", err);
        }
    };

    // Auto-rename session based on assistant message metadata
    const handleAutoRenameSession = async (sessionId, messageMeta, messageContent) => {
        // Check if session should be auto-renamed
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return;

        // Only auto-rename if:
        // 1. Title is "New Chat" or "New"
        // 2. User hasn't manually renamed it
        const isDefaultTitle = session.title === "New Chat" || session.title === "New";
        const isManuallyRenamed = manuallyRenamedSessions.has(sessionId);
        
        if (!isDefaultTitle || isManuallyRenamed) {
            return; // Don't auto-rename
        }

        // Generate title from metadata
        let generatedTitle = null;

        // Priority 1: topic_label
        if (messageMeta?.topic_label) {
            generatedTitle = messageMeta.topic_label;
        }
        // Priority 2: first value in detected_topics
        else if (messageMeta?.detected_topics && Array.isArray(messageMeta.detected_topics) && messageMeta.detected_topics.length > 0) {
            generatedTitle = messageMeta.detected_topics[0];
        }
        // Priority 3: inferred from content (extract first meaningful phrase)
        else if (messageContent) {
            // Try to extract a topic from the first sentence or heading
            const firstLine = messageContent.split('\n')[0].trim();
            // Remove markdown formatting
            const cleanLine = firstLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
            // Take first 30 characters or first sentence
            const topic = cleanLine.split('.')[0].trim();
            if (topic && topic.length > 3 && topic.length < 50) {
                generatedTitle = topic;
            }
        }

        // Apply rename if we have a valid title
        if (generatedTitle && generatedTitle.trim()) {
            try {
                await handleRenameSession(sessionId, generatedTitle.trim(), false); // false = not manual
            } catch (err) {
                console.error("Failed to auto-rename session:", err);
            }
        }
    };

    const handleFocusInput = () => {
        // Focus the chat input via ref callback
        if (chatWindowFocusRef.current) {
            chatWindowFocusRef.current();
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full overflow-hidden">
            {/* Topic Tabs Bar */}
            <TopicTabsBar
                sessions={sessions}
                activeSessionId={activeSessionId}
                openTabIds={Array.from(openTabIds)}
                onSelectSession={handleSelectSession}
                onCreateSession={handleCreateSession}
                onCloseTab={handleCloseTab}
                onOpenHistory={handleOpenHistory}
                historyButtonRef={historyButtonRef}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* ChatSidebar is hidden but logic preserved */}
                {/* <ChatSidebar ... /> */}

                {/* Chat Window */}
                <div className="flex flex-col flex-1 h-full">
                    {!activeSessionId ? (
                        <EmptyStatePanel
                            onCreateSession={handleCreateSession}
                            onFocusInput={handleFocusInput}
                        />
                    ) : (
                        <ChatWindow
                            activeSessionId={activeSessionId}
                            onFocusInputRef={chatWindowFocusRef}
                            onAutoRenameSession={handleAutoRenameSession}
                            sessions={sessions}
                        />
                    )}
                </div>
            </div>

            {/* Previous Topics Panel */}
            <PreviousTopicsPanel
                isOpen={isHistoryPanelOpen}
                onClose={() => setIsHistoryPanelOpen(false)}
                sessions={sessions}
                openTabIds={Array.from(openTabIds)}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onOpenTab={handleOpenTab}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                position={historyPanelPosition}
            />
        </div>
    );
};

export default TutorPage;
