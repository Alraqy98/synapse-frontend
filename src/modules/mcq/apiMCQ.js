// ===============================================================
// apiMCQ.js — FIXED (uses global authenticated API client)
// ===============================================================

import api from "../../lib/api";

// ===============================================================
// MCQ DECKS
// ===============================================================

export const getMCQDecks = async () => {
    const res = await api.get("/ai/mcq/decks");
    return res.data?.decks || [];
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
    return res.data; // expects { code }
};


// ===============================================================
// DEFAULT EXPORT (module pattern)
// ===============================================================

export const apiMCQ = {
    getMCQDecks,
    createMCQDeck,
    getMCQDeck,
    getMCQQuestions,
    renameMCQDeck,
    deleteMCQDeck,
    shareDeck, // 👈 REQUIRED
    explainMCQSelection,
    explainMCQAll,
    mcqExportToAstra,
};
