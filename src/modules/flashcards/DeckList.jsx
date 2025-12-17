// src/modules/flashcards/DeckList.jsx
import React, { useEffect, useState } from "react";
import { getDecks, deleteDeck } from "./apiFlashcards";
import { Pencil, Trash2 } from "lucide-react";

export default function DeckList({ openDeck, search }) {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Rename modal
    const [renaming, setRenaming] = useState(null);
    const [newName, setNewName] = useState("");

    // Delete modal
    const [deleting, setDeleting] = useState(null);

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
    async function confirmDelete() {
        try {
            await deleteDeck(deleting.id);
            setDeleting(null);
            loadDecks();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    function handleDelete(deck) {
        setDeleting(deck);
    }

    // --------------------------
    // RENAME workflow
    // --------------------------
    function handleRename(deck) {
        setRenaming(deck);
        setNewName(deck.title);
    }

    async function saveRename() {
        if (!newName.trim()) return;

        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/flashcards/decks/${renaming.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ title: newName.trim() }),
            });

            setRenaming(null);
            loadDecks();
        } catch (err) {
            console.error("Rename failed:", err);
        }
    }

    const filtered = decks.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full h-full">

            {/* =====================
                RENAME MODAL
            ====================== */}
            {renaming && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-void border border-white/10 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Rename Deck</h2>

                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-white/10 rounded-lg"
                                onClick={() => setRenaming(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="px-4 py-2 bg-teal text-black rounded-lg"
                                onClick={saveRename}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================
                DELETE MODAL
            ====================== */}
            {deleting && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-void border border-white/10 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Delete Deck</h2>

                        <p className="text-sm text-muted mb-6">
                            Are you sure you want to delete{" "}
                            <span className="text-white font-semibold">
                                "{deleting.title}"
                            </span>
                            ?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-white/10 rounded-lg"
                                onClick={() => setDeleting(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded-lg"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================
                GRID ONLY (no top UI)
            ====================== */}
            {loading ? (
                <div className="mt-10 text-muted">Loading…</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {filtered.map((deck) => (
                        <div
                            key={deck.id}
                            className="relative bg-black/20 border border-white/10 rounded-xl p-4 hover:border-teal transition"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">{deck.title}</h3>
                                    <p className="text-xs text-muted mt-1">
                                        {deck.card_count} cards • {deck.mode}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        className="p-1 hover:text-teal"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRename(deck);
                                        }}
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        className="p-1 hover:text-red-400"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(deck);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <span className="text-xs text-muted">
                                    Updated {new Date(deck.updated_at).toLocaleDateString()}
                                </span>

                                <button
                                    className="text-xs text-teal hover:text-white"
                                    onClick={() => openDeck(deck.id)}
                                >
                                    View →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
