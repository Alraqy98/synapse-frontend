// src/modules/flashcards/DeckList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { getDecks, deleteDeck } from "./apiFlashcards";
import UnifiedCard from "../../components/UnifiedCard";

export default function DeckList({ openDeck, search, sortMode = "date" }) {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Delete confirmation
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        loadDecks();
        const int = setInterval(loadDecks, 4000);
        return () => clearInterval(int);
    }, []);

    async function loadDecks() {
        try {
            const d = await getDecks();
            setDecks(d || []);
        } catch (err) {
            console.error("Failed to load decks:", err);
        } finally {
            setLoading(false);
        }
    }

    // --------------------------
    // DELETE workflow
    // --------------------------
    const handleDelete = async () => {
        if (!confirmDelete) return;

        const id = confirmDelete.id;
        setConfirmDelete(null);

        try {
            await deleteDeck(id);
            loadDecks();
        } catch (err) {
            console.error("Delete failed:", err);
            loadDecks();
        }
    };

    // --------------------------
    // RENAME workflow
    // --------------------------
    const handleRename = async (deckId, newTitle) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/flashcards/decks/${deckId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ title: newTitle.trim() }),
            });

            // Update local state
            setDecks((prev) =>
                prev.map((d) => (d.id === deckId ? { ...d, title: newTitle } : d))
            );
        } catch (err) {
            console.error("Rename failed:", err);
            loadDecks();
        }
    };

    // Filtered and sorted decks
    const visibleDecks = useMemo(() => {
        let list = decks.filter((d) =>
            d.title?.toLowerCase().includes(search.toLowerCase())
        );

        if (sortMode === "date") {
            list.sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at));
        } else if (sortMode === "name") {
            list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        }

        return list;
    }, [decks, search, sortMode]);

    return (
        <>
            {/* GRID */}
            {loading ? (
                <div className="text-sm text-muted">Loading flashcard decks…</div>
            ) : visibleDecks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-sm text-muted mb-4">
                        {search
                            ? "No flashcard decks match your search."
                            : "No flashcard decks available. Generate a flashcard deck from a file to get started."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visibleDecks.map((deck) => {
                        const isGenerating = deck.generating === true || deck.status === "generating";
                        
                        // Determine status and progress
                        let status = "ready";
                        let progress = 100;
                        
                        if (isGenerating) {
                            status = "generating";
                            progress = 60; // Simulated progress during generation
                        } else if (deck.status === "failed") {
                            status = "failed";
                            progress = 0;
                        }

                        return (
                            <UnifiedCard
                                key={deck.id}
                                title={deck.title}
                                meta={deck.card_count ? `${deck.card_count} cards • ${deck.mode || ""}` : null}
                                progress={progress}
                                status={status}
                                statusText="Flashcard Deck"
                                date={deck.updated_at || deck.created_at ? new Date(deck.updated_at || deck.created_at).toLocaleDateString() : null}
                                isGenerating={isGenerating}
                                onClick={() => openDeck(deck.id)}
                                onDelete={() => setConfirmDelete({ id: deck.id, title: deck.title })}
                                onRename={(newTitle) => handleRename(deck.id, newTitle)}
                            />
                        );
                    })}
                </div>
            )}

            {/* DELETE CONFIRM */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl bg-black border border-red-500/20 p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Delete deck
                        </h3>
                        <p className="text-sm text-muted mb-6">
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setConfirmDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
