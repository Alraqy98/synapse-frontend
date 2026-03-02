// src/modules/mcq/MCQTab.jsx
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { apiMCQ } from "./apiMCQ";
import GenerateMCQModal from "./GenerateMCQModal";
import MCQDeckView from "./MCQDeckView";
import OutputCard from "../../components/OutputCard";
import OutputFilters from "../../components/OutputFilters";
import InlinePromptModal from "../../components/InlinePromptModal";
import ConfirmModal from "../../components/ConfirmModal";
import { Upload, Folder, Edit2, Copy, Trash2 } from "lucide-react";
import { isValidCodeFormat } from "../summaries/utils/summaryCode";
import { sanitizeErrorMessage } from "../utils/errorSanitizer";
import { useDemo } from "../demo/DemoContext";
import { DEMO_MCQ_DECK_ID } from "../demo/demoData/demoMcq";

function FolderDropdown({
    label,
    value,
    onChange,
    folders,
    includeAll = false,
    allowCreate = false,
    onCreateFolder,
}) {
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        function handleClickOutside() {
            setOpen(false);
            setCreating(false);
        }
        if (open) {
            window.addEventListener("click", handleClickOutside);
        }
        return () => window.removeEventListener("click", handleClickOutside);
    }, [open]);

    const selectedLabel = (() => {
        if (value === "all") return "All MCQs";
        const match = folders.find((f) => f.id === value);
        return match?.name || "All MCQs";
    })();

    const handleCreate = async () => {
        const trimmed = newName.trim();
        if (!trimmed || !onCreateFolder) {
            setCreating(false);
            setNewName("");
            return;
        }
        try {
            const created = await onCreateFolder(trimmed);
            if (created?.id) {
                onChange(created.id);
            }
        } finally {
            setCreating(false);
            setNewName("");
            setOpen(false);
        }
    };

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            {label && <div className="text-xs text-muted mb-1">{label}</div>}
            <button
                type="button"
                className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white min-w-[180px] text-left"
                onClick={() => setOpen((prev) => !prev)}
            >
                {selectedLabel}
            </button>
            {open && (
                <div className="absolute left-0 right-0 mt-2 bg-void border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-1 space-y-0.5">
                        {includeAll && (
                            <button
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10"
                                onClick={() => {
                                    onChange("all");
                                    setOpen(false);
                                }}
                            >
                                All MCQs
                            </button>
                        )}
                        {folders.map((folder) => (
                            <button
                                key={folder.id}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10"
                                onClick={() => {
                                    onChange(folder.id);
                                    setOpen(false);
                                }}
                            >
                                {folder.name}
                            </button>
                        ))}
                        {allowCreate && (
                            <>
                                <div className="border-t border-white/10 my-1" />
                                {!creating ? (
                                    <button
                                        className="w-full text-left px-3 py-2 text-sm text-teal hover:bg-white/10"
                                        onClick={() => setCreating(true)}
                                    >
                                        + New Folder
                                    </button>
                                ) : (
                                    <div className="px-3 py-2">
                                        <input
                                            autoFocus
                                            className="w-full px-2 py-1 rounded-md bg-black/40 border border-white/10 text-sm"
                                            placeholder="Folder name"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleCreate();
                                                }
                                                if (e.key === "Escape") {
                                                    setCreating(false);
                                                    setNewName("");
                                                }
                                            }}
                                            onBlur={handleCreate}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MCQTab() {
    const { deckId: urlDeckId } = useParams();
    const navigate = useNavigate();
    const { isDemo } = useDemo() || {};
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
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [folderAssignDeck, setFolderAssignDeck] = useState(null);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);

    // --------------------------------------------------
    // Fetch decks
    // --------------------------------------------------
    const loadDecks = async (folderId = null) => {
        try {
            if (!initialLoadDone) setLoading(true);
            const decks = await apiMCQ.getMCQDecks(folderId);
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
        loadDecks(selectedFolderId ?? null);
    }, [selectedFolderId]);

    const loadFolders = async () => {
        try {
            const list = await apiMCQ.getMCQFolders();
            setFolders(list || []);
        } catch (err) {
            console.error("Failed to load MCQ folders:", err);
        } finally {
        }
    };

    useEffect(() => {
        loadFolders();
    }, []);

    useEffect(() => {
        if (openModal) {
            loadFolders();
        }
    }, [openModal]);

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
    // Filtered decks (by selected folder + search + sort)
    // --------------------------------------------------
    const visibleDecks = useMemo(() => {
        let list = [...decks];

        // When a folder is selected, show only decks in that folder
        if (selectedFolderId != null) {
            list = list.filter(
                (d) => (d.mcq_folder_id ?? d.folder_id) === selectedFolderId
            );
        }

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
    }, [decks, search, sort, selectedFolderId]);

    const handleAssignFolder = async (deck, folderId) => {
        const nextFolderId = folderId === "all" ? null : folderId;
        const previousFolderId = deck.mcq_folder_id ?? null;

        setDecks((prev) =>
            prev.map((d) =>
                d.id === deck.id ? { ...d, mcq_folder_id: nextFolderId } : d
            )
        );

        try {
            await apiMCQ.updateMCQDeck(deck.id, { mcq_folder_id: nextFolderId });
        } catch (err) {
            console.error("Failed to update MCQ folder:", err);
            setDecks((prev) =>
                prev.map((d) =>
                    d.id === deck.id ? { ...d, mcq_folder_id: previousFolderId } : d
                )
            );
        }
    };

    const handleCreateFolder = async (name) => {
        const trimmed = name?.trim();
        if (!trimmed) return null;
        const created = await apiMCQ.createMCQFolder(trimmed);
        if (!created?.id) return null;
        setFolders((prev) => [...prev, created]);
        return created;
    };


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
                    <div className="flex flex-1 h-full overflow-hidden bg-[#0D0F12]">
                        <OutputFilters
                            primaryLabel="Generate MCQs"
                            onPrimary={() => setOpenModal(true)}
                            onCreateFolder={() => setShowNewFolderModal(true)}
                            folders={folders}
                            activeFolderId={selectedFolderId}
                            onSelectFolder={setSelectedFolderId}
                            allLabel="All MCQs"
                        />
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            {/* Breadcrumbs */}
                            <div className="h-12 flex items-center px-6 border-b border-white/[0.06] bg-[#0f1115] text-xs shrink-0">
                                <nav className="flex items-center gap-1 text-white/50">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFolderId(null)}
                                        className={selectedFolderId == null ? "text-white font-medium cursor-default" : "hover:text-teal"}
                                    >
                                        All MCQs
                                    </button>
                                    {selectedFolderId != null && (() => {
                                        const folder = folders.find((f) => f.id === selectedFolderId);
                                        return (
                                            <>
                                                <span className="mx-1 text-white/30">/</span>
                                                <span className="text-white font-medium truncate max-w-[180px]" title={folder?.name}>
                                                    {folder?.name ?? "Folder"}
                                                </span>
                                            </>
                                        );
                                    })()}
                                </nav>
                                <button
                                    type="button"
                                    className="ml-auto px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
                                    onClick={() => setShowImport(true)}
                                >
                                    <Upload size={12} className="inline mr-1" /> Import
                                </button>
                            </div>
                            {/* Grid */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {loading ? (
                                    <div className="text-sm text-white/40">Loading…</div>
                                ) : (() => {
                                    const showFolders = selectedFolderId == null && folders.length > 0;
                                    const hasDecks = visibleDecks.length > 0;
                                    if (!showFolders && !hasDecks) {
                                        return (
                                            <div className="text-center py-12 text-white/40 text-sm">
                                                {search ? "No MCQ decks match your search." : "No MCQ decks here. Generate one or select a folder."}
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
                                                            await apiMCQ.renameMCQFolder(id, newTitle);
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
                                                        type="mcq"
                                                        id={deck.id}
                                                        title={deck.title}
                                                        category="MCQ"
                                                        sourceFileName={sourceName}
                                                        date={deck.created_at ? new Date(deck.created_at).toLocaleDateString() : null}
                                                        isGenerating={isGenerating}
                                                        statusText={isGenerating ? "Generating…" : null}
                                                        onClick={() => openDeck(deck.id)}
                                                        onDelete={() => setConfirmDelete({ id: deck.id, title: deck.title })}
                                                        onRename={(id, newTitle) => {
                                                            setDecks((prev) => prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d)));
                                                            apiMCQ.renameMCQDeck(id, newTitle).catch(() => loadDecks(selectedFolderId ?? null));
                                                        }}
                                                        onMoveToFolder={() => setFolderAssignDeck(deck)}
                                                        dataDemo={isDemo && deck.id === DEMO_MCQ_DECK_ID ? "mcq-deck-card" : undefined}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
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

                    {/* ================= ASSIGN FOLDER ================= */}
                    {folderAssignDeck && (
                        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                            <div className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Move to folder
                                </h3>
                                <p className="text-sm text-muted mb-4">
                                    {folderAssignDeck.title}
                                </p>
                                <FolderDropdown
                                    value={folderAssignDeck.mcq_folder_id ?? "all"}
                                    onChange={(value) => {
                                        handleAssignFolder(folderAssignDeck, value);
                                        setFolderAssignDeck(null);
                                    }}
                                    folders={folders}
                                    includeAll
                                />
                                <div className="mt-4">
                                    {!creatingFolder ? (
                                        <button
                                            className="text-sm text-teal hover:text-teal-300"
                                            onClick={() => setCreatingFolder(true)}
                                        >
                                            + Create new folder
                                        </button>
                                    ) : (
                                        <input
                                            autoFocus
                                            className="w-full px-3 py-2 rounded-md bg-black/40 border border-white/10 text-sm"
                                            placeholder="Folder name"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            onKeyDown={async (e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const created = await handleCreateFolder(newFolderName);
                                                    if (created?.id) {
                                                        handleAssignFolder(folderAssignDeck, created.id);
                                                        setFolderAssignDeck(null);
                                                    }
                                                    setCreatingFolder(false);
                                                    setNewFolderName("");
                                                }
                                                if (e.key === "Escape") {
                                                    setCreatingFolder(false);
                                                    setNewFolderName("");
                                                }
                                            }}
                                            onBlur={async () => {
                                                const created = await handleCreateFolder(newFolderName);
                                                if (created?.id) {
                                                    handleAssignFolder(folderAssignDeck, created.id);
                                                    setFolderAssignDeck(null);
                                                }
                                                setCreatingFolder(false);
                                                setNewFolderName("");
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setFolderAssignDeck(null);
                                            setCreatingFolder(false);
                                            setNewFolderName("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <GenerateMCQModal
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        onCreated={loadDecks}
                        folders={folders}
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
                                await apiMCQ.deleteMCQFolder(folderToDelete.id);
                                setFolders((prev) => prev.filter((f) => f.id !== folderToDelete.id));
                                if (selectedFolderId === folderToDelete.id) setSelectedFolderId(null);
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                        title="Delete folder"
                        message="Delete this folder? Decks inside will move to All MCQs."
                        confirmLabel="Delete"
                        variant="danger"
                    />
                </>
            )}
        </div>
    );
}
