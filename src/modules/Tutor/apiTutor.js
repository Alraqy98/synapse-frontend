// src/modules/tutor/apiTutor.js
import { supabase } from "../../lib/supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL;

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
    // CRITICAL: Trace all calls to identify global/shared triggers
    console.trace("[GLOBAL_TUTOR_GET_CALLED] getSessionMessages invoked");
    
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
    fileId,
    page,
}) => {
    const token = await getToken();

    // Task 3: Remove silent failure - hard assertion before POST
    // fileId and page are required for FileViewer context, but optional for standalone tutor
    if (!fileId || !page) {
        console.error("[ASTRA FRONTEND BLOCK] Invalid tutor payload", {
            fileId,
            page
        });
        throw new Error("FileViewer Astra requires valid fileId and page");
    }

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

    // Task 4: Verify with runtime log - confirm fileId is UUID string, page is positive integer
    console.log("[FILEVIEWER ASTRA PAYLOAD]", {
        fileId,
        page,
        endpoint: "/ai/tutor/chat",
        fileIdType: typeof fileId,
        pageType: typeof page,
        fileIdIsString: typeof fileId === "string",
        pageIsNumber: typeof page === "number",
        pageIsPositive: typeof page === "number" && page > 0,
        imageIncluded: payload.image ? "present" : "missing",
        screenshotUrlIncluded: payload.screenshotUrl ? "present" : "missing",
    });

    // Diagnostic log: Confirm endpoint and sessionId
    console.log("[TUTOR_POST_FRONTEND]", {
        endpoint: "/ai/tutor/chat",
        sessionId,
        messageLen: message?.length,
        fileId,
        page,
    });

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
        // Surface backend error verbatim - no fallback behavior
        const backendError = data.error || data.message || "Chat failed";
        console.error("[FILEVIEWER ASTRA BACKEND ERROR]", {
            success: data.success,
            error: backendError,
            fullResponse: data,
            fileId,
            page,
        });
        throw new Error(backendError);
    }

    return {
        text: data.answer.answer,
        raw: data.answer,
    };
};

/* --------------------------------------------------
   SUMMARY-AWARE ASTRA CHAT
-------------------------------------------------- */
export const sendSummaryMessageToTutor = async ({
    sessionId,
    message,
    summaryId,
    summaryTitle,
    selectionText = null,
    fileId = null,
    resourceSelection = null,
}) => {
    const token = await getToken();

    // Create structured payload for summary messages
    // If selectionText is provided, it's a selection-based message
    const payload = {
        role: "user",
        type: selectionText ? "selection" : "message",
        source: "summary",
        summaryId: summaryId, // REQUIRED
        title: summaryTitle || null, // OPTIONAL but recommended
        content: selectionText || message, // Selection text if available, otherwise the message
        createdAt: new Date().toISOString(), // REQUIRED
        sessionId: sessionId,
        message: message, // The full message including context
        fileId: fileId,
        resourceSelection: resourceSelection || {
            scope: selectionText ? "selected" : "all",
            file_ids: fileId ? [fileId] : [],
            folder_ids: [],
            include_books: true,
            strictResources: false,
        },
    };

    console.log("[SUMMARY ASTRA PAYLOAD]", {
        summaryId,
        summaryTitle,
        type: payload.type,
        selectionText: selectionText ? selectionText.substring(0, 60) : null,
        createdAt: payload.createdAt,
        source: payload.source,
        endpoint: "/ai/tutor/chat",
    });

    // Diagnostic log: Confirm endpoint and sessionId
    console.log("[TUTOR_POST_FRONTEND]", {
        endpoint: "/ai/tutor/chat",
        sessionId,
        messageLen: message?.length,
        summaryId,
    });

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
        const backendError = data.error || data.message || "Chat failed";
        console.error("[SUMMARY ASTRA BACKEND ERROR]", {
            success: data.success,
            error: backendError,
            fullResponse: data,
            summaryId,
        });
        throw new Error(backendError);
    }

    return {
        text: data.answer?.answer || data.answer || "",
        raw: data.answer,
    };
};

/* --------------------------------------------------
   STANDALONE TUTOR CHAT (NO FILE CONTEXT)
-------------------------------------------------- */
export const sendStandaloneMessageToTutor = async ({
    sessionId,
    message,
    mode = "auto",
    lastAIMessage = "",
    lastUserMessage = "",
}) => {
    const token = await getToken();

    const payload = {
        sessionId,
        message,
        mode,
        lastAIMessage,
        lastUserMessage,
    };

    // Diagnostic log: Confirm endpoint and sessionId
    console.log("[TUTOR_POST_FRONTEND]", {
        endpoint: "/ai/tutor/chat",
        sessionId,
        messageLen: message?.length,
    });

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
        const backendError = data.error || data.message || "Chat failed";
        console.error("[STANDALONE TUTOR BACKEND ERROR]", {
            success: data.success,
            error: backendError,
            fullResponse: data,
            sessionId,
        });
        throw new Error(backendError);
    }

    return {
        text: data.answer?.answer || data.answer || "",
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
