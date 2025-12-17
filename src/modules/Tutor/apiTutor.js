// src/modules/tutor/apiTutor.js
import { supabase } from "../../lib/supabaseClient";

const API_BASE = "http://localhost:3000";

/* --------------------------------------------------
   TOKEN
-------------------------------------------------- */
async function getToken() {
    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;
    if (!token) throw new Error("Missing Supabase token");
    return token;
}

/* --------------------------------------------------
   SESSIONS
-------------------------------------------------- */
export const getSessions = async () => {
    const token = await getToken();

    const res = await fetch(`${API_BASE}/ai/tutor/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    return (data.sessions || []).map((s) => ({
        id: s.id, // uuid string
        title: s.title || "New Chat",
        lastMessage: s.last_message || "",
        updatedAt: s.last_message_at || s.updated_at || s.created_at,
    }));
};

export const createNewSession = async (title = "New Chat") => {
    const token = await getToken();

    console.log("🔥 createNewSession() called with title:", title);

    const res = await fetch(`${API_BASE}/ai/tutor/sessions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
    });

    const data = await res.json();
    if (!data.success) {
        console.error("❌ createNewSession failed:", data);
        throw new Error(data.error || "createNewSession failed");
    }

    const s = data.session;
    return {
        id: String(s.id),
        title: s.title,
        lastMessage: s.last_message || "",
        updatedAt: s.last_message_at || s.updated_at || s.created_at,
    };
};

export const getSessionMessages = async (sessionId) => {
    const token = await getToken();

    console.log("📥 getSessionMessages for", sessionId);

    const res = await fetch(`${API_BASE}/ai/tutor/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!data.success) {
        console.error("❌ getSessionMessages failed:", data);
        throw new Error(data.error || "Failed to load messages");
    }

    return (data.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
    }));
};

/* --------------------------------------------------
   DELETE / RENAME
-------------------------------------------------- */
export const deleteSession = async (sessionId) => {
    const token = await getToken();

    const res = await fetch(`${API_BASE}/ai/tutor/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return true;
};

export const renameSession = async (sessionId, title) => {
    const token = await getToken();

    const res = await fetch(`${API_BASE}/ai/tutor/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const s = data.session;
    return {
        id: String(s.id),
        title: s.title,
        lastMessage: s.last_message,
        updatedAt: s.last_message_at || s.updated_at,
    };
};

/* --------------------------------------------------
   FILE + PAGE-AWARE ASTRA CHAT
-------------------------------------------------- */
export const sendMessageToTutor = async ({
    sessionId,
    message,
    mode = "auto",
    lastAIMessage = "",
    lastUserMessage = "",
    resourceSelection,
    fileId = null,
    page = null,
}) => {
    const token = await getToken();

    const payload = {
        sessionId,
        message,
        mode,
        lastAIMessage,
        lastUserMessage,
        fileId,
        page,
        resourceSelection: resourceSelection || {
            scope: "all",
            file_ids: [],
            folder_ids: [],
            include_books: true,
            strictResources: false,
        },
    };

    console.log("📤 sendMessageToTutor payload:", payload);

    const res = await fetch(`${API_BASE}/ai/tutor/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) {
        console.error("❌ sendMessageToTutor failed:", data);
        throw new Error(data.error || "Chat failed");
    }

    return {
        text: data.answer.answer,
        raw: data.answer,
    };
};

/* --------------------------------------------------
   DUMMY uploadFile EXPORT (FIXES FRONTEND CRASH)
-------------------------------------------------- */
export const uploadFile = async () => {
    console.warn("uploadFile() called — not implemented. Returning null.");
    return null;
};
