// src/modules/tutor/TutorPage.jsx
import React, { useState, useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

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

    useEffect(() => {
        loadSessions();
    }, []);

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
                return null; // sidebar starts with NO selected chat
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
        } catch (err) {
            console.error("Failed to create session:", err);
        }
    };

    const handleSelectSession = (sessionId) => {
        setActiveSessionId(sessionId);
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            await deleteSession(sessionId);

            const updated = sessions.filter((s) => s.id !== sessionId);
            setSessions(updated);

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

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            <ChatSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onCreateSession={handleCreateSession}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                isLoading={isLoadingSessions}
            />

            <ChatWindow activeSessionId={activeSessionId} />
        </div>
    );
};

export default TutorPage;
