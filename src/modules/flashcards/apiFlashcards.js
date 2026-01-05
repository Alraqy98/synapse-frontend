// src/modules/flashcards/apiFlashcards.js

import axios from "axios";
import api from "../../lib/api";
import { supabase } from "../../lib/supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

// ======================================================
// DECKS
// ======================================================

export const getDecks = async () => {
    const res = await axios.get(`${API_BASE}/flashcards/decks`, {
        headers: authHeaders(),
    });
    return res.data?.decks || [];
};

/**
 * Get flashcard decks for a specific file (file-scoped query)
 * Uses Supabase direct query to filter by file_ids array containing the file ID
 */
export const getFlashcardDecksByFile = async (fileId) => {
    if (!fileId) throw new Error("File ID is missing (getFlashcardDecksByFile)");
    
    try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        
        if (!user) {
            throw new Error("User not authenticated");
        }

        // Query flashcard decks where file_ids array contains the fileId
        // Using Postgres array contains operator via Supabase filter
        // The 'cs' operator means "contains" for arrays
        const { data: decks, error } = await supabase
            .from("flashcard_decks")
            .select("*")
            .eq("user_id", user.id)
            .filter("file_ids", "cs", `{${fileId}}`)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching flashcard decks by file:", error);
            throw error;
        }

        return decks || [];
    } catch (err) {
        console.error("Failed to fetch flashcard decks by file:", err);
        // Fallback to API if Supabase query fails
        try {
            const allDecks = await getDecks();
            return allDecks.filter(deck => 
                deck.file_ids && Array.isArray(deck.file_ids) && deck.file_ids.includes(fileId)
            );
        } catch (fallbackErr) {
            console.error("Fallback API fetch also failed:", fallbackErr);
            return [];
        }
    }
};

export const createDeck = async (payload) => {
    const res = await axios.post(`${API_BASE}/flashcards/decks`, payload, {
        headers: authHeaders(),
    });
    return res.data?.deck;
};

export const getDeck = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID is missing (getDeck)");
    const res = await axios.get(`${API_BASE}/flashcards/decks/${deck_id}`, {
        headers: authHeaders(),
    });
    return res.data?.deck || null;
};

// ------------------------------------------------------
// DELETE deck
// ------------------------------------------------------
export const deleteDeck = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID is missing (deleteDeck)");
    const res = await axios.delete(`${API_BASE}/flashcards/decks/${deck_id}`, {
        headers: authHeaders(),
    });
    return res.data || { success: true };
};

// ------------------------------------------------------
// FAVORITE toggle
// ------------------------------------------------------
export const toggleFavorite = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID is missing (toggleFavorite)");
    const res = await axios.patch(
        `${API_BASE}/flashcards/decks/${deck_id}/favorite`,
        {},
        { headers: authHeaders() }
    );
    return res.data;
};

// ======================================================
// CARDS
// ======================================================

export const getDeckCards = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID is missing (getDeckCards)");
    const res = await axios.get(
        `${API_BASE}/flashcards/decks/${deck_id}/cards`,
        { headers: authHeaders() }
    );
    return res.data?.cards || [];
};

// ======================================================
// REVIEW MODE
// ======================================================

export const getNextCard = async (deck_id, mode = "turbo") => {
    if (!deck_id) throw new Error("Deck ID is missing (getNextCard)");
    const res = await axios.get(
        `${API_BASE}/flashcards/decks/${deck_id}/next-card?mode=${mode}`,
        { headers: authHeaders() }
    );
    return res.data?.card || null;
};

export const answerFlashcard = async (card_id, payload) => {
    if (!card_id) throw new Error("Card ID is missing (answerFlashcard)");
    const res = await axios.post(
        `${API_BASE}/flashcards/cards/${card_id}/answer`,
        payload,
        { headers: authHeaders() }
    );
    return res.data;
};

// ======================================================
// AI GENERATOR — FIXED 🚀
// Backend route: POST /flashcards/decks
// ======================================================

export const generateFlashcards = async (payload) => {
    try {
        const res = await axios.post(`${API_BASE}/flashcards/decks`, payload, {
            headers: authHeaders(),
        });
        return res.data;
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

// ======================================================
// SHARE DECK
// Backend: POST /ai/flashcards/:id/share
// ======================================================

export const shareDeck = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID is missing (shareDeck)");
    const res = await api.post(`/ai/flashcards/${deck_id}/share`);
    return res.data; // Backend returns { share_code } or { code }
};

// ======================================================
// IMPORT DECK
// Backend route: POST /ai/flashcards/import
// ======================================================

export const importDeck = async (code) => {
    if (!code) throw new Error("Import code is missing (importDeck)");
    try {
        const res = await api.post("/ai/flashcards/import", { code });
        return res.data; // Backend returns { success, deck } or { success: false, error }
    } catch (err) {
        // Return error in same format for consistent handling
        return {
            success: false,
            error: err.response?.data?.error || err.response?.data?.message || err.message || "Import failed"
        };
    }
};
// Alias for compatibility with DeckList.jsx
export const getFlashcardDecks = getDecks;
