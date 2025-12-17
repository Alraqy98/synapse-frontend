// src/modules/flashcards/apiFlashcards.js

import axios from "axios";

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
    const res = await axios.post(`${API_BASE}/flashcards/decks`, payload, {
        headers: authHeaders(),
    });
    return res.data;
};

// ======================================================
// SHARE DECK
// Backend: POST /flashcards/decks/:id/share
// ======================================================

export const shareDeck = async (deck_id) => {
    if (!deck_id) throw new Error("Deck ID is missing (shareDeck)");
    const res = await axios.post(
        `${API_BASE}/flashcards/decks/${deck_id}/share`,
        {},
        { headers: authHeaders() }
    );
    return res.data;
};

// ======================================================
// IMPORT DECK
// Backend route: POST /flashcards/decks/import
// ======================================================

export const importDeck = async (share_code) => {
    if (!share_code) throw new Error("Share code is missing (importDeck)");
    const res = await axios.post(
        `${API_BASE}/flashcards/decks/import`,
        { share_code },
        { headers: authHeaders() }
    );
    return res.data;
};
// Alias for compatibility with DeckList.jsx
export const getFlashcardDecks = getDecks;
