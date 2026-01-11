// src/modules/tutor/TutorPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    // URL is the single source of truth for sessionId
    const { sessionId: urlSessionId } = useParams();
    const navigate = useNavigate();
    
    const [sessions, setSessions] = useState([]);
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

    // When URL sessionId changes, ensure it's in openTabIds
    useEffect(() => {
        if (urlSessionId && !openTabIds.has(urlSessionId)) {
            setOpenTabIds((prev) => new Set([...prev, urlSessionId]));
        }
    }, [urlSessionId, openTabIds]);

    const loadSessions = async () => {
        setIsLoadingSessions(true);

        try {
            const list = await getSessions();

            // ❗ DO NOT auto-select any session
            // ❗ URL is authoritative - do NOT override URL sessionId
            setSessions(list || []);
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
            // Add to open tabs
            setOpenTabIds((prev) => new Set([...prev, newSession.id]));
            // Navigate to new session - URL becomes authoritative
            navigate(`/tutor/${newSession.id}`, { replace: false });
        } catch (err) {
            console.error("Failed to create session:", err);
        }
    };

    const handleSelectSession = (sessionId) => {
        // Navigate to session - URL becomes authoritative
        // Do NOT manually set messages before navigation
        navigate(`/tutor/${sessionId}`, { replace: false });
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

        // If closing the active tab, navigate to /tutor (empty state)
        if (urlSessionId === sessionId) {
            navigate("/tutor", { replace: false });
        }
    };

    const handleOpenTab = (sessionId) => {
        // Add back to open tabs and navigate to it
        setOpenTabIds((prev) => new Set([...prev, sessionId]));
        navigate(`/tutor/${sessionId}`, { replace: false });
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

            // If deleting the active session, navigate to /tutor (empty state)
            if (urlSessionId === sessionId) {
                navigate("/tutor", { replace: false });
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
                <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
                    {!urlSessionId ? (
                        <EmptyStatePanel
                            onCreateSession={handleCreateSession}
                            onFocusInput={handleFocusInput}
                        />
                    ) : (
                        <ChatWindow
                            activeSessionId={urlSessionId}
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
