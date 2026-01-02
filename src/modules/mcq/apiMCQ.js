// ===============================================================
// apiMCQ.js — FIXED (uses global authenticated API client)
// ===============================================================

import api from "../../lib/api";
import { supabase } from "../../lib/supabaseClient";

// ===============================================================
// MCQ DECKS
// ===============================================================

export const getMCQDecks = async () => {
    const res = await api.get("/ai/mcq/decks");
    return res.data?.decks || [];
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
    const res = await api.get(`/ai/mcq/decks/${deck_id}/questions`);
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

// Delete deck
export const deleteMCQDeck = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID missing (deleteMCQDeck)");
    await api.delete(`/ai/mcq/decks/${deck_id}`);
};

export const shareDeck = async (deckId) => {
    if (!deckId) throw new Error("Deck ID missing (shareDeck)");

    const res = await api.post(`/ai/mcq/decks/${deckId}/share`);
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
    renameMCQDeck,
    deleteMCQDeck,
    shareDeck,
    importMcqDeck,
    explainMCQSelection,
    explainMCQAll,
    mcqExportToAstra,
};
