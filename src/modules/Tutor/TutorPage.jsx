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
        // Ensure it's in open tabs
        setOpenTabIds((prev) => new Set([...prev, sessionId]));
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

    const handleRenameSession = async (sessionId, newTitle) => {
        try {
            const updated = await renameSession(sessionId, newTitle);
            setSessions((prev) =>
                prev.map((s) => (s.id === sessionId ? updated : s))
            );
        } catch (err) {
            console.error("Failed to rename session:", err);
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
