// ===============================================================
// apiMCQ.js — FIXED (uses global authenticated API client)
// ===============================================================

import api from "../../lib/api";
import { demoApiIntercept } from "../demo/demoApiRuntime";
import { supabase } from "../../lib/supabaseClient";

// ===============================================================
// MCQ DECKS
// ===============================================================

export const getMCQDecks = async (folderId = null) => {
    const query = folderId ? `?folder_id=${encodeURIComponent(folderId)}` : "";
    const url = `/ai/mcq/decks${query}`;
    const demoRes = demoApiIntercept({
        method: "GET",
        url,
    });
    if (demoRes.handled) {
        return demoRes.data?.decks || [];
    }

    const res = await api.get(url);
    return res.data?.decks || [];
};

// ===============================================================
// MCQ FOLDERS
// ===============================================================

export const getMCQFolders = async () => {
    const demoRes = demoApiIntercept({
        method: "GET",
        url: "/ai/mcq/folders",
    });
    if (demoRes.handled) {
        return demoRes.data?.folders || [];
    }

    const res = await api.get("/ai/mcq/folders");
    if (Array.isArray(res.data)) return res.data;
    return res.data?.folders || [];
};

export const createMCQFolder = async (name) => {
    if (!name?.trim()) throw new Error("Folder name required");
    const res = await api.post("/ai/mcq/folders", { name: name.trim() });
    return res.data?.folder || res.data;
};

export const renameMCQFolder = async (folderId, name) => {
    if (!folderId) throw new Error("Folder ID missing (renameMCQFolder)");
    const res = await api.patch(`/ai/mcq/folders/${folderId}`, { name });
    return res.data?.folder || res.data;
};

export const deleteMCQFolder = async (folderId) => {
    if (!folderId) throw new Error("Folder ID missing (deleteMCQFolder)");
    const res = await api.delete(`/ai/mcq/folders/${folderId}`);
    return res.data;
};

/**
 * Get MCQ decks for a specific file (file-scoped query)
 * Uses Supabase direct query to filter by file_ids array containing the file ID
 */
export const getMCQDecksByFile = async (fileId) => {
    if (!fileId) throw new Error("File ID is missing (getMCQDecksByFile)");
    
    try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        
        if (!user) {
            throw new Error("User not authenticated");
        }

        // Query MCQ decks where file_ids array contains the fileId
        // Using Postgres array contains operator via Supabase filter
        // The 'cs' operator means "contains" for arrays
        const { data: decks, error } = await supabase
            .from("mcq_decks")
            .select("*")
            .eq("user_id", user.id)
            .filter("file_ids", "cs", `{${fileId}}`)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching MCQ decks by file:", error);
            throw error;
        }

        return decks || [];
    } catch (err) {
        console.error("Failed to fetch MCQ decks by file:", err);
        // Fallback to API if Supabase query fails
        try {
            const allDecks = await getMCQDecks();
            return allDecks.filter(deck => 
                deck.file_ids && Array.isArray(deck.file_ids) && deck.file_ids.includes(fileId)
            );
        } catch (fallbackErr) {
            console.error("Fallback API fetch also failed:", fallbackErr);
            return [];
        }
    }
};

export const createMCQDeck = async (payload) => {
    try {
        const res = await api.post("/ai/mcq/decks", payload);
        return res.data?.deck;
    } catch (err) {
        // Handle FILE_NOT_READY gracefully
        if (err.response?.status === 422 && 
            (err.response?.data?.code === "FILE_NOT_READY" || 
             err.response?.data?.error_code === "FILE_NOT_READY" ||
             err.response?.data?.error?.includes("FILE_NOT_READY"))) {
            const fileNotReadyError = new Error("Preparing content. This usually takes a few seconds.");
            fileNotReadyError.code = "FILE_NOT_READY";
            throw fileNotReadyError;
        }
        throw err;
    }
};

export const getMCQDeck = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID missing (getMCQDeck)");
    const res = await api.get(`/ai/mcq/decks/${deck_id}`);
    return res.data?.deck || null;
};

// ===============================================================
// MCQ QUESTIONS
// ===============================================================

export const getMCQQuestions = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID missing (getMCQQuestions)");
    const demoRes = demoApiIntercept({
        method: "GET",
        url: `/ai/mcq/decks/${deck_id}/questions`,
    });
    if (demoRes.handled) {
        return demoRes.data?.questions || [];
    }

    const res = await api.get(`/ai/mcq/decks/${deck_id}/questions`);
    return res.data?.questions || [];
};

// ===============================================================
// MCQ PROGRESS PERSISTENCE
// ===============================================================

/**
 * Start an MCQ deck session
 * POST /ai/mcq/decks/:id/start
 * Returns: { progress: {...}, deck: {...} }
 */
export const startMCQDeck = async (deckId) => {
    if (!deckId) throw new Error("Deck ID missing (startMCQDeck)");
    const demoRes = demoApiIntercept({
        method: "POST",
        url: `/ai/mcq/decks/${deckId}/start`,
        body: {},
    });
    if (demoRes.handled) {
        return demoRes.data;
    }

    const res = await api.post(`/ai/mcq/decks/${deckId}/start`);
    return res.data;
};

/**
 * Submit an answer to a question
 * POST /ai/mcq/questions/:id/answer
 * Body: { selected_option_letter, time_ms }
 * Returns: { progress: {...}, question: {...} }
 */
export const answerMCQQuestion = async (questionId, selectedOptionLetter, timeMs) => {
    if (!questionId) throw new Error("Question ID missing (answerMCQQuestion)");
    const body = {
        selected_option_letter: selectedOptionLetter,
        time_ms: timeMs,
    };
    const demoRes = demoApiIntercept({
        method: "POST",
        url: `/ai/mcq/questions/${questionId}/answer`,
        body,
    });
    if (demoRes.handled) {
        return demoRes.data;
    }

    const res = await api.post(`/ai/mcq/questions/${questionId}/answer`, body);
    return res.data;
};

/**
 * Reset a deck's progress
 * POST /ai/mcq/decks/:id/reset
 * Returns: { success: true }
 */
export const resetMCQDeck = async (deckId) => {
    if (!deckId) throw new Error("Deck ID missing (resetMCQDeck)");
    const demoRes = demoApiIntercept({
        method: "POST",
        url: `/ai/mcq/decks/${deckId}/reset`,
        body: {},
    });
    if (demoRes.handled) {
        return demoRes.data;
    }

    const res = await api.post(`/ai/mcq/decks/${deckId}/reset`);
    return res.data;
};

/**
 * Retake only wrong questions
 * POST /ai/mcq/decks/:id/retake-wrong
 * Returns: { progress: {...}, deck: {...} }
 */
export const retakeWrongMCQ = async (deckId) => {
    if (!deckId) throw new Error("Deck ID missing (retakeWrongMCQ)");
    const demoRes = demoApiIntercept({
        method: "POST",
        url: `/ai/mcq/decks/${deckId}/retake-wrong`,
        body: {},
    });
    if (demoRes.handled) {
        return demoRes.data;
    }

    const res = await api.post(`/ai/mcq/decks/${deckId}/retake-wrong`);
    return res.data;
};

/**
 * Get deck with progress
 * GET /ai/mcq/decks/:id
 * Returns: { deck: {...}, progress: {...} }
 */
export const getMCQDeckWithProgress = async (deckId) => {
    if (!deckId) throw new Error("Deck ID missing (getMCQDeckWithProgress)");
    const demoRes = demoApiIntercept({
        method: "GET",
        url: `/ai/mcq/decks/${deckId}`,
    });
    if (demoRes.handled) {
        return demoRes.data;
    }

    const res = await api.get(`/ai/mcq/decks/${deckId}`);
    return res.data;
};

/**
 * Get review questions
 * GET /ai/mcq/decks/:id/review?attempt=X&scope=wrong|all
 * Returns: { questions: [...] }
 */
export const getMCQReview = async (deckId, scope = "all", attempt = null) => {
    if (!deckId) throw new Error("Deck ID missing (getMCQReview)");
    let url = `/ai/mcq/decks/${deckId}/review?scope=${scope}`;
    if (attempt !== null) {
        url += `&attempt=${attempt}`;
    }
    const res = await api.get(url);
    return res.data?.questions || [];
};

export const explainMCQSelection = async (question_id, user_answer) => {
    const res = await api.post(
        `/ai/mcq/questions/${question_id}/explain-selection`,
        {
            answer: user_answer,
            selected: user_answer,
            selected_answer: user_answer,
            userAnswer: user_answer,
        }
    );
    return res.data;
};

export const explainMCQAll = async (question_id) => {
    const res = await api.post(
        `/ai/mcq/questions/${question_id}/explain-all`,
        {}
    );
    return res.data;
};

export const mcqExportToAstra = async (question_id) => {
    const res = await api.post(
        `/ai/mcq/questions/${question_id}/export-to-astra`,
        {}
    );
    return res.data;
};
// Rename deck
export const renameMCQDeck = async (deck_id, title) => {
    if (!deck_id) throw new Error("Deck ID missing (renameMCQDeck)");
    const res = await api.patch(`/ai/mcq/decks/${deck_id}`, { title });
    return res.data?.deck;
};

export const updateMCQDeck = async (deck_id, payload) => {
    if (!deck_id) throw new Error("Deck ID missing (updateMCQDeck)");
    const res = await api.patch(`/ai/mcq/decks/${deck_id}`, payload);
    return res.data?.deck;
};

// Delete deck
export const deleteMCQDeck = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID missing (deleteMCQDeck)");
    await api.delete(`/ai/mcq/decks/${deck_id}`);
};

export const shareDeck = async (deckId) => {
    if (!deckId) throw new Error("Deck ID missing (shareDeck)");

    const res = await api.post(`/ai/mcq/${deckId}/share`);
    return res.data; // expects { share_code } or { code }
};

/**
 * Import an MCQ deck by code
 * POST /ai/mcq/import
 * Body: { code: "SYN-XXXXX" }
 * Returns: { success: true, deck: {...} } or { success: false, error: "..." }
 */
export const importMcqDeck = async (code) => {
    if (!code) throw new Error("Import code is missing");
    try {
        const res = await api.post("/ai/mcq/import", { code });
        return res.data; // Backend returns { success, deck } or { success: false, error }
    } catch (err) {
        // Return error in same format for consistent handling
        return {
            success: false,
            error: err.response?.data?.error || err.response?.data?.message || err.message || "Import failed"
        };
    }
};


// ===============================================================
// DEFAULT EXPORT (module pattern)
// ===============================================================

export const apiMCQ = {
    getMCQDecks,
    getMCQDecksByFile,
    createMCQDeck,
    getMCQDeck,
    getMCQQuestions,
    getMCQFolders,
    createMCQFolder,
    renameMCQFolder,
    deleteMCQFolder,
    renameMCQDeck,
    updateMCQDeck,
    deleteMCQDeck,
    shareDeck,
    importMcqDeck,
    explainMCQSelection,
    explainMCQAll,
    mcqExportToAstra,
    // Progress persistence
    startMCQDeck,
    answerMCQQuestion,
    resetMCQDeck,
    retakeWrongMCQ,
    getMCQDeckWithProgress,
    getMCQReview,
};
