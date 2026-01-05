// src/modules/mcq/MCQTab.jsx
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { apiMCQ } from "./apiMCQ";
import GenerateMCQModal from "./GenerateMCQModal";
import MCQDeckView from "./MCQDeckView";
import UnifiedCard from "../../components/UnifiedCard";
import { Search, Plus, Upload, Share2 } from "lucide-react";
import { isValidCodeFormat } from "../summaries/utils/summaryCode";
import { sanitizeErrorMessage } from "../utils/errorSanitizer";

export default function MCQTab() {
    const { deckId: urlDeckId } = useParams();
    const navigate = useNavigate();
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
    const [showImport, setShowImport] = useState(false);
    const [importCode, setImportCode] = useState("");
    const [importError, setImportError] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

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

    // Handle deep link from URL
    useEffect(() => {
        if (urlDeckId && urlDeckId !== deckId) {
            setDeckId(urlDeckId);
            setView("deck");
        } else if (!urlDeckId && view !== "list") {
            // URL changed to remove deckId, reset to list
            setView("list");
            setDeckId(null);
        }
    }, [urlDeckId]);

    const openDeck = (id) => {
        setDeckId(id);
        setView("deck");
        navigate(`/mcq/${id}`, { replace: true });
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
                <MCQDeckView deckId={deckId} goBack={() => {
                    setView("list");
                    setDeckId(null);
                    navigate("/mcq", { replace: true });
                }} />
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
                                    <button 
                                        className="btn btn-secondary gap-2"
                                        onClick={() => setShowImport(true)}
                                    >
                                        <Upload size={14} /> Import
                                    </button>
                                </div>
                            </div>

                            {/* GRID */}
                            {loading ? (
                                <div className="text-sm text-muted">Loading MCQ decks…</div>
                            ) : visibleDecks.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-muted mb-4">
                                        {search
                                            ? "No MCQ decks match your search."
                                            : "No MCQ decks available. Generate an MCQ deck from a file to get started."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {visibleDecks.map((deck) => {
                                        const isGenerating = deck.generating === true || deck.status === "generating";
                                        
                                        // Determine status and progress
                                        let status = "ready";
                                        let progress = 100;
                                        let statusLabel = "MCQ Deck";
                                        
                                        if (isGenerating) {
                                            status = "generating";
                                            progress = 60; // Simulated progress during generation
                                        } else if (deck.status === "failed") {
                                            status = "failed";
                                            progress = 0;
                                        } else {
                                            // For ready decks, show 100% progress
                                            const current = deck.question_count || 0;
                                            const target = deck.question_count_target ?? deck.question_count ?? 1;
                                            progress = Math.min(100, Math.round((current / target) * 100));
                                            
                                            // Add progress status label if available
                                            if (deck.progress?.status === "completed") {
                                                statusLabel = "Completed";
                                            } else if (deck.progress?.status === "in_progress") {
                                                statusLabel = "In progress";
                                            }
                                        }

                                        return (
                                            <UnifiedCard
                                                key={deck.id}
                                                title={deck.title}
                                                progress={progress}
                                                status={status}
                                                statusText={statusLabel}
                                                date={deck.created_at ? new Date(deck.created_at).toLocaleDateString() : null}
                                                isGenerating={isGenerating}
                                                onClick={() => openDeck(deck.id)}
                                                onDelete={() => setConfirmDelete({ id: deck.id, title: deck.title })}
                                                onRename={(newTitle) => {
                                                    setDecks((prev) =>
                                                        prev.map((d) => (d.id === deck.id ? { ...d, title: newTitle } : d))
                                                    );
                                                    apiMCQ.renameMCQDeck(deck.id, newTitle).catch((err) => {
                                                        console.error("Rename failed", err);
                                                        loadDecks();
                                                    });
                                                }}
                                                itemId={deck.id}
                                                shareItem={apiMCQ.shareDeck}
                                            />
                                        );
                                    })}
                                </div>
                            )}
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

                    {/* Import Modal - Portal to document.body for viewport centering */}
                    {showImport && createPortal(
                        <div 
                            className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" 
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                            onClick={() => {
                                if (!isImporting) {
                                    setShowImport(false);
                                    setImportCode("");
                                    setImportError(null);
                                }
                            }}
                        >
                            <div 
                                className="w-full max-w-md mx-4 rounded-2xl bg-black border border-white/10 p-6 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Import MCQ Deck
                                </h3>
                                <p className="text-sm text-muted mb-4">
                                    Enter the import code to import an MCQ deck.
                                </p>
                                <input
                                    autoFocus
                                    value={importCode}
                                    onChange={(e) => {
                                        setImportCode(e.target.value.toUpperCase());
                                        setImportError(null); // Clear error on input change
                                    }}
                                    placeholder="SYN-XXXXX"
                                    className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white mb-2 font-mono"
                                    maxLength={9}
                                    disabled={isImporting}
                                />
                                {importCode && !isValidCodeFormat(importCode) && (
                                    <p className="text-xs text-red-400 mb-4">
                                        Invalid code format. Expected: SYN-XXXXX
                                    </p>
                                )}
                                {importError && (
                                    <p className="text-xs text-red-400 mb-4">
                                        {importError}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowImport(false);
                                            setImportCode("");
                                            setImportError(null);
                                        }}
                                        disabled={isImporting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={async () => {
                                            if (!isValidCodeFormat(importCode)) return;
                                            
                                            setIsImporting(true);
                                            setImportError(null);
                                            
                                            try {
                                                // Call backend import endpoint
                                                const res = await apiMCQ.importMcqDeck(importCode);
                                                
                                                if (res?.success) {
                                                    // Success - reload decks and close modal
                                                    await loadDecks();
                                                    setShowImport(false);
                                                    setImportCode("");
                                                    setImportError(null);
                                                } else {
                                                    // Backend returned error - sanitize and display
                                                    const rawError = res?.error || res?.message || "Import failed";
                                                    setImportError(sanitizeErrorMessage(rawError, "MCQ deck"));
                                                }
                                            } catch (err) {
                                                // Backend error - sanitize and display
                                                const rawError = err.response?.data?.error || 
                                                               err.response?.data?.message || 
                                                               err.message || 
                                                               "Failed to import MCQ deck";
                                                setImportError(sanitizeErrorMessage(rawError, "MCQ deck"));
                                            } finally {
                                                setIsImporting(false);
                                            }
                                        }}
                                        disabled={!isValidCodeFormat(importCode) || isImporting}
                                    >
                                        {isImporting ? "Importing..." : "Import"}
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </>
            )}
        </div>
    );
}
