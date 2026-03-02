import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import GenerateFlashcardsModal from "./GenerateFlashcardsModal";
import OutputCard from "../../components/OutputCard";
import OutputFilters from "../../components/OutputFilters";
import InlinePromptModal from "../../components/InlinePromptModal";
import ConfirmModal from "../../components/ConfirmModal";
import {
    getDecks,
    getFlashcardFolders,
    createFlashcardFolder,
    updateFlashcardFolder,
    deleteDeck,
    deleteFlashcardFolder,
    shareDeck,
    importDeck,
} from "./apiFlashcards";
import { isValidCodeFormat } from "../summaries/utils/summaryCode";
import { sanitizeErrorMessage } from "../utils/errorSanitizer";
import { Upload } from "lucide-react";

export default function FlashcardsTab({ openDeck }) {
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortMode, setSortMode] = useState("date");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const [importCode, setImportCode] = useState("");
    const [importError, setImportError] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);

    const loadFolders = async () => {
        try {
            const list = await getFlashcardFolders();
            setFolders(list || []);
        } catch (err) {
            console.error("Failed to load flashcard folders:", err);
        }
    };

    const loadDecks = async (folderId = null) => {
        try {
            setLoading(true);
            const list = await getDecks(folderId);
            setDecks(list || []);
        } catch (err) {
            console.error("Failed to load decks:", err);
            setDecks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFolders();
    }, []);

    useEffect(() => {
        loadDecks(selectedFolderId ?? null);
    }, [selectedFolderId]);

    useEffect(() => {
        if (!decks.length) return;
        const generating = decks.some((d) => d.generating || d.status === "generating");
        if (!generating) return;
        const interval = setInterval(() => loadDecks(selectedFolderId ?? null), 4000);
        return () => clearInterval(interval);
    }, [decks, selectedFolderId]);

    const visibleDecks = useMemo(() => {
        let list = [...decks];

        // When a folder is selected, show only decks in that folder
        if (selectedFolderId != null) {
            list = list.filter(
                (d) => (d.folder_id ?? d.flashcard_folder_id) === selectedFolderId
            );
        }

        list = list.filter((d) =>
            d.title?.toLowerCase().includes(search.toLowerCase())
        );
        if (sortMode === "date") {
            list.sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at));
        } else if (sortMode === "name") {
            list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        }
        return list;
    }, [decks, search, sortMode, selectedFolderId]);

    const handleCreateFolder = async (name) => {
        const trimmed = name?.trim();
        if (!trimmed) return null;
        try {
            const created = await createFlashcardFolder(trimmed);
            if (created?.id) {
                setFolders((prev) => [...prev, created]);
                return created;
            }
        } catch (err) {
            console.error(err);
        }
        return null;
    };

    const handleDeleteDeck = async () => {
        if (!confirmDelete) return;
        const id = confirmDelete.id;
        setConfirmDelete(null);
        try {
            await deleteDeck(id);
            loadDecks(selectedFolderId ?? null);
        } catch (err) {
            console.error(err);
            loadDecks(selectedFolderId ?? null);
        }
    };

    const handleRenameDeck = async (deckId, newTitle) => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/flashcards/decks/${deckId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                    body: JSON.stringify({ title: newTitle.trim() }),
                }
            );
            if (res.ok) {
                setDecks((prev) =>
                    prev.map((d) => (d.id === deckId ? { ...d, title: newTitle } : d))
                );
            }
        } catch (err) {
            console.error(err);
            loadDecks(selectedFolderId ?? null);
        }
    };

    const activeFolder = selectedFolderId != null ? folders.find((f) => f.id === selectedFolderId) : null;

    return (
        <div className="flex flex-1 h-full overflow-hidden bg-[#0D0F12]">
            <OutputFilters
                primaryLabel="Generate Flashcards"
                onPrimary={() => setShowGenerateModal(true)}
                onCreateFolder={() => setShowNewFolderModal(true)}
                folders={folders}
                activeFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                allLabel="All Decks"
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="h-12 flex items-center px-6 border-b border-white/[0.06] bg-[#0f1115] text-xs shrink-0">
                    <nav className="flex items-center gap-1 text-white/50">
                        <button
                            type="button"
                            onClick={() => setSelectedFolderId(null)}
                            className={selectedFolderId == null ? "text-white font-medium cursor-default" : "hover:text-teal"}
                        >
                            All Decks
                        </button>
                        {activeFolder && (
                            <>
                                <span className="mx-1 text-white/30">/</span>
                                <span className="text-white font-medium truncate max-w-[180px]" title={activeFolder.name}>
                                    {activeFolder.name}
                                </span>
                            </>
                        )}
                    </nav>
                    <button
                        type="button"
                        className="ml-auto px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
                        onClick={() => setShowImport(true)}
                    >
                        <Upload size={12} className="inline mr-1" /> Import
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-sm text-white/40">Loading…</div>
                    ) : (() => {
                        const showFolders = selectedFolderId == null && folders.length > 0;
                        const hasDecks = visibleDecks.length > 0;
                        if (!showFolders && !hasDecks) {
                            return (
                                <div className="text-center py-12 text-white/40 text-sm">
                                    {search ? "No decks match your search." : "No flashcard decks here. Generate one or select a folder."}
                                </div>
                            );
                        }
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {showFolders && folders.map((folder) => (
                                    <OutputCard
                                        key={folder.id}
                                        type="folder"
                                        id={folder.id}
                                        title={folder.name}
                                        folderColor={folder.color || "#f7c948"}
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        onDelete={() => setFolderToDelete(folder)}
                                        onRename={async (id, newTitle) => {
                                            try {
                                                await updateFlashcardFolder(id, newTitle);
                                                setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: newTitle } : f)));
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                    />
                                ))}
                                {visibleDecks.map((deck) => {
                                    const isGenerating = deck.generating === true || deck.status === "generating";
                                    const sourceName = deck.file_name ?? deck.source_file_name ?? null;
                                    return (
                                        <OutputCard
                                            key={deck.id}
                                            type="flashcard"
                                            id={deck.id}
                                            title={deck.title}
                                            category="Flashcard Deck"
                                            sourceFileName={sourceName}
                                            date={deck.updated_at || deck.created_at ? new Date(deck.updated_at || deck.created_at).toLocaleDateString() : null}
                                            isGenerating={isGenerating}
                                            statusText={isGenerating ? "Generating…" : null}
                                            onClick={() => openDeck(deck.id)}
                                            onDelete={() => setConfirmDelete({ id: deck.id, title: deck.title })}
                                            onRename={(id, newTitle) => handleRenameDeck(id, newTitle)}
                                            onMoveToFolder={null}
                                            shareItem={shareDeck}
                                            itemId={deck.id}
                                            dataDemo={deck.id === "demo-flashcard-ct" ? "flashcard-deck-card" : undefined}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {showGenerateModal && (
                <GenerateFlashcardsModal
                    open={true}
                    onClose={() => setShowGenerateModal(false)}
                    onCreated={() => {
                        setShowGenerateModal(false);
                        loadDecks(selectedFolderId ?? null);
                    }}
                />
            )}

            {confirmDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl bg-black border border-red-500/20 p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete deck</h3>
                        <p className="text-sm text-white/50 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteDeck}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showImport && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center"
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => {
                        if (!isImporting) {
                            setShowImport(false);
                            setImportCode("");
                            setImportError(null);
                        }
                    }}
                >
                    <div className="w-full max-w-md mx-4 rounded-2xl bg-black border border-white/10 p-6 relative" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-white mb-4">Import Flashcard Deck</h3>
                        <p className="text-sm text-white/50 mb-4">Enter the import code to import a flashcard deck.</p>
                        <input
                            autoFocus
                            value={importCode}
                            onChange={(e) => {
                                setImportCode(e.target.value.toUpperCase());
                                setImportError(null);
                            }}
                            placeholder="SYN-XXXXX"
                            className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white mb-2 font-mono"
                            maxLength={9}
                            disabled={isImporting}
                        />
                        {importCode && !isValidCodeFormat(importCode) && (
                            <p className="text-xs text-red-400 mb-4">Invalid code format. Expected: SYN-XXXXX</p>
                        )}
                        {importError && <p className="text-xs text-red-400 mb-4">{importError}</p>}
                        <div className="flex justify-end gap-2">
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setShowImport(false); setImportCode(""); setImportError(null); }}
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
                                        const res = await importDeck(importCode);
                                        if (res?.success) {
                                            await loadDecks(selectedFolderId ?? null);
                                            setShowImport(false);
                                            setImportCode("");
                                            setImportError(null);
                                        } else {
                                            setImportError(sanitizeErrorMessage(res?.error || res?.message || "Import failed", "flashcard deck"));
                                        }
                                    } catch (err) {
                                        setImportError(sanitizeErrorMessage(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to import", "flashcard deck"));
                                    } finally {
                                        setIsImporting(false);
                                    }
                                }}
                                disabled={!isValidCodeFormat(importCode) || isImporting}
                            >
                                {isImporting ? "Importing…" : "Import"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <InlinePromptModal
                open={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                onSubmit={async (name) => {
                    const created = await handleCreateFolder(name);
                    if (created?.id) setSelectedFolderId(created.id);
                }}
                title="New Folder"
                inputLabel="Folder name"
                submitLabel="Create"
            />
            <ConfirmModal
                open={!!folderToDelete}
                onClose={() => setFolderToDelete(null)}
                onConfirm={async () => {
                    if (!folderToDelete) return;
                    try {
                        await deleteFlashcardFolder(folderToDelete.id);
                        setFolders((prev) => prev.filter((f) => f.id !== folderToDelete.id));
                        if (selectedFolderId === folderToDelete.id) setSelectedFolderId(null);
                    } catch (e) {
                        console.error(e);
                    }
                }}
                title="Delete folder"
                message="Delete this folder?"
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
