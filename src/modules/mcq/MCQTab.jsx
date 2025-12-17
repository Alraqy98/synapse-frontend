// src/modules/mcq/MCQTab.jsx
import { useState, useEffect, useMemo } from "react";
import { apiMCQ } from "./apiMCQ";
import GenerateMCQModal from "./GenerateMCQModal";
import MCQDeckView from "./MCQDeckView";
import { Search, Plus, Upload, Share2, MoreHorizontal } from "lucide-react";

export default function MCQTab() {
    const [view, setView] = useState("list");
    const [deckId, setDeckId] = useState(null);
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    // UI state
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [menuDeck, setMenuDeck] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);

    // --------------------------------------------------
    // Fetch decks
    // --------------------------------------------------
    const loadDecks = async () => {
        try {
            if (!initialLoadDone) setLoading(true);
            const decks = await apiMCQ.getMCQDecks();
            setDecks(decks || []);
        } catch (err) {
            console.error("Failed to load MCQ decks:", err);
            setDecks([]);
        } finally {
            setLoading(false);
            setInitialLoadDone(true);
        }
    };

    useEffect(() => {
        loadDecks();
    }, []);

    useEffect(() => {
        if (!decks.length) return;
        const generating = decks.some((d) => d.generating);
        if (!generating) return;

        const interval = setInterval(loadDecks, 4000);
        return () => clearInterval(interval);
    }, [decks]);

    const openDeck = (id) => {
        setDeckId(id);
        setView("deck");
    };

    // --------------------------------------------------
    // Filtered decks
    // --------------------------------------------------
    const visibleDecks = useMemo(() => {
        let list = [...decks];

        if (search) {
            list = list.filter((d) =>
                d.title?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (sort === "newest") {
            list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        if (sort === "oldest") {
            list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }

        return list;
    }, [decks, search, sort]);

    // --------------------------------------------------
    // Rename / Delete
    // --------------------------------------------------
    const handleRename = async () => {
        if (!menuDeck || !renameValue.trim()) return;

        const updatedTitle = renameValue.trim();
        const id = menuDeck.id;

        setDecks((prev) =>
            prev.map((d) => (d.id === id ? { ...d, title: updatedTitle } : d))
        );

        setMenuDeck(null);

        try {
            await apiMCQ.renameMCQDeck(id, updatedTitle);
        } catch (err) {
            console.error("Rename failed", err);
            loadDecks();
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;

        const id = confirmDelete.id;

        setDecks((prev) => prev.filter((d) => d.id !== id));
        setConfirmDelete(null);

        try {
            await apiMCQ.deleteMCQDeck(id);
        } catch (err) {
            console.error("Delete failed", err);
            loadDecks();
        }
    };

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------
    return (
        <div className="h-full w-full">
            {view === "deck" ? (
                <MCQDeckView deckId={deckId} goBack={() => setView("list")} />
            ) : (
                <>
                    <div className="max-w-7xl mx-auto px-6 pb-28">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8">

                            {/* HEADER */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight text-white">
                                        MCQ Decks
                                    </h1>
                                    <p className="text-sm text-muted mt-1">
                                        Generate, organize, and revise your MCQs
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary gap-2"
                                    onClick={() => setOpenModal(true)}
                                >
                                    <Plus size={16} />
                                    Generate MCQs
                                </button>
                            </div>

                            {/* COMMAND BAR */}
                            <div className="flex flex-wrap items-center gap-3 mb-10 p-3 rounded-2xl bg-black/40 border border-white/10">
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search MCQ decks…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                                    />
                                </div>

                                <select
                                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                </select>

                                <div className="flex gap-2 ml-auto">
                                    <button className="btn btn-secondary gap-2">
                                        <Upload size={14} /> Import
                                    </button>
                                    <button className="btn btn-secondary gap-2">
                                        <Share2 size={14} /> Share
                                    </button>
                                </div>
                            </div>

                            {/* GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {!loading &&
                                    visibleDecks.map((deck) => {
                                        const current = deck.question_count || 0;
                                        const target =
                                            deck.question_count_target ??
                                            deck.question_count ??
                                            1;
                                        const percent = Math.min(
                                            100,
                                            Math.round((current / target) * 100)
                                        );

                                        return (
                                            <div
                                                key={deck.id}
                                                onClick={() => openDeck(deck.id)}
                                                className="group cursor-pointer rounded-2xl border border-white/10 bg-black/40 p-6 transition-all hover:-translate-y-1 hover:border-teal/40"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="text-lg font-semibold text-white">
                                                        {deck.title}
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuDeck(deck);
                                                            setRenameValue(deck.title);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </div>

                                                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-teal-400 to-emerald-500"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>

                                                <div className="flex justify-between text-xs text-muted">
                                                    <span>
                                                        {deck.generating
                                                            ? "In progress"
                                                            : "Ready"}
                                                    </span>
                                                    <span>MCQ Deck</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>

                    {/* ================= RENAME MODAL ================= */}
                    {menuDeck && (
                        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                            <div className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Rename deck
                                </h3>

                                <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) =>
                                        setRenameValue(e.target.value)
                                    }
                                    className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white mb-6"
                                />

                                <div className="flex justify-between">
                                    <button
                                        className="text-red-400 text-sm"
                                        onClick={() => {
                                            setConfirmDelete(menuDeck);
                                            setMenuDeck(null);
                                        }}
                                    >
                                        Delete deck
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setMenuDeck(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleRename}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= DELETE CONFIRM ================= */}
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

                    <GenerateMCQModal
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        onCreated={loadDecks}
                    />
                </>
            )}
        </div>
    );
}
