// src/modules/summaries/SummariesTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Plus, Upload } from "lucide-react";
import { apiSummaries } from "./apiSummaries";
import OutputCard from "../../components/OutputCard";
import OutputFilters from "../../components/OutputFilters";
import GenerateSummaryModal from "./GenerateSummaryModal";
import InlinePromptModal from "../../components/InlinePromptModal";
import ConfirmModal from "../../components/ConfirmModal";
import { isValidCodeFormat } from "./utils/summaryCode";
import SummaryFailurePopup from "../../components/SummaryFailurePopup";

// Clean error messages - remove SQL error strings and show user-friendly messages
const sanitizeErrorMessage = (errorMsg) => {
    if (!errorMsg || typeof errorMsg !== 'string') {
        return "Import failed";
    }
    
    // Remove SQL error patterns
    const sqlPatterns = [
        /SQLSTATE\[\d+\]:/gi,
        /SQLSTATE/gi,
        /ERROR:\s*\d+/gi,
        /at line \d+/gi,
        /column "[^"]+"/gi,
        /relation "[^"]+"/gi,
        /duplicate key value violates unique constraint/gi,
        /violates foreign key constraint/gi,
    ];
    
    let cleaned = errorMsg;
    sqlPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up common SQL error messages and convert to user-friendly
    if (cleaned.includes('duplicate') || cleaned.includes('already exists')) {
        return "This summary has already been imported";
    }
    if (cleaned.includes('not found') || cleaned.includes('does not exist')) {
        return "Invalid import code";
    }
    if (cleaned.includes('permission') || cleaned.includes('unauthorized')) {
        return "You don't have permission to import this summary";
    }
    if (cleaned.includes('expired')) {
        return "This import code has expired";
    }
    
    // If message is too technical or contains SQL remnants, show generic message
    if (cleaned.length < 10 || /[{}[\]]/.test(cleaned) || cleaned.includes('SQL')) {
        return "Invalid import code";
    }
    
    // Return cleaned message, trimmed
    return cleaned.trim() || "Invalid import code";
};

export default function SummariesTab() {
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const [importCode, setImportCode] = useState("");
    const [importError, setImportError] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [failurePopup, setFailurePopup] = useState({ isOpen: false, isProcessing: false, onRetry: null });
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);

    const loadFolders = async () => {
        try {
            const list = await apiSummaries.getSummaryFolders();
            setFolders(list || []);
        } catch (err) {
            console.error("Failed to load summary folders:", err);
        }
    };

    const loadSummaries = async (folderId = null) => {
        try {
            if (!initialLoadDone) setLoading(true);
            const list = await apiSummaries.getAllSummaries(folderId);
            setSummaries(list || []);
        } catch (err) {
            console.error("Failed to load summaries:", err);
            setSummaries([]);
        } finally {
            setLoading(false);
            setInitialLoadDone(true);
        }
    };

    useEffect(() => {
        loadFolders();
    }, []);

    useEffect(() => {
        loadSummaries(selectedFolderId ?? null);
    }, [selectedFolderId]);

    // Poll for all summaries every 15 seconds to catch backend updates
    useEffect(() => {
        if (!initialLoadDone) return; // Don't poll until initial load is done
        
        const interval = setInterval(() => {
            loadSummaries(selectedFolderId ?? null);
        }, 15000);

        return () => clearInterval(interval);
    }, [initialLoadDone]);

    // Poll for generating summaries (matching MCQ pattern exactly)
    useEffect(() => {
        if (!summaries.length) return;
        // Check for both generating flag and status === "generating"
        const generating = summaries.some((s) => s.generating || s.status === "generating");
        if (!generating) return;

        const pollAllGenerating = async () => {
            // Filter for both generating flag and status === "generating"
            const generatingJobs = summaries.filter(s => s.generating || s.status === "generating");
            
            for (const summary of generatingJobs) {
                try {
                    const status = await apiSummaries.getSummaryJobStatus(summary.id);
                    
                    if (status.status === "completed" && status.summaryId) {
                        // Fetch the completed summary from backend (persisted)
                        const completedSummary = await apiSummaries.getSummary(status.summaryId);
                        
                        // Remove generating placeholder and add completed summary at top
                        // Deduplication: if summary already exists (from backend fetch), replace it
                        setSummaries(prev => {
                            const filtered = prev.filter(s => s.id !== summary.id && s.id !== status.summaryId);
                            return [completedSummary, ...filtered];
                        });
                        
                        // Show subtle toast notification
                        console.log("Summary ready");
                    } else if (status.status === "failed") {
                        // Remove generating placeholder
                        setSummaries(prev => prev.filter(s => s.id !== summary.id));
                        
                        // Show in-app failure popup instead of browser alert
                        // Check if file is still processing (would need file data, but for now assume not processing on failure)
                        setFailurePopup({
                            isOpen: true,
                            isProcessing: false,
                            onRetry: () => {
                                // Retry by opening generate modal with same file
                                setFailurePopup({ isOpen: false, isProcessing: false, onRetry: null });
                                // Could store file info for retry, but for now just close and let user retry manually
                            }
                        });
                    }
                    // If pending, continue polling
                } catch (err) {
                    console.error(`Failed to poll job ${summary.id}:`, err);
                    // On error, continue polling (don't remove job)
                }
            }
        };

        const interval = setInterval(pollAllGenerating, 4000);
        return () => clearInterval(interval);
    }, [summaries]);

    const openSummary = (id) => {
        // Don't open generating summaries - check both generating flag and status
        const summary = summaries.find(s => s.id === id);
        if (summary?.generating || summary?.status === "generating") return;
        
        // Navigate to dedicated route instead of modal view
        navigate(`/summaries/${id}`);
    };

    // Filtered and sorted summaries (by selected folder + search + sort)
    const visibleSummaries = useMemo(() => {
        let list = [...summaries];

        // When a folder is selected, show only summaries in that folder
        if (selectedFolderId != null) {
            list = list.filter(
                (s) => (s.folder_id ?? s.summary_folder_id) === selectedFolderId
            );
        }

        if (search) {
            list = list.filter((s) =>
                s.title?.toLowerCase().includes(search.toLowerCase()) ||
                s.file_name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (sort === "newest") {
            list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        if (sort === "oldest") {
            list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }

        return list;
    }, [summaries, search, sort, selectedFolderId]);

    const handleDelete = async () => {
        if (!confirmDelete) return;

        const id = confirmDelete.id;
        setSummaries((prev) => prev.filter((s) => s.id !== id));
        setConfirmDelete(null);

        try {
            await apiSummaries.deleteSummary(id);
        } catch (err) {
            console.error("Delete failed", err);
            loadSummaries();
        }
    };

    const handleRename = async (id, newTitle) => {
        // Update local state immediately
        setSummaries((prev) =>
            prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
        );
        // TODO: Backend rename endpoint when available
        // For now, this is UI-only
    };

    const handleExportCode = (id, code) => {
        // Code is generated and shown in modal
        // Store in local state if needed
        console.log(`Export code for summary ${id}: ${code}`);
    };

    const activeFolder = selectedFolderId != null ? folders.find((f) => f.id === selectedFolderId) : null;

    return (
        <div className="flex flex-1 h-full overflow-hidden bg-[#0D0F12]">
            <OutputFilters
                primaryLabel="Generate Summary"
                onPrimary={() => setOpenModal(true)}
                onCreateFolder={() => setShowNewFolderModal(true)}
                folders={folders}
                activeFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                allLabel="All Summaries"
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="h-12 flex items-center px-6 border-b border-white/[0.06] bg-[#0f1115] text-xs shrink-0">
                    <nav className="flex items-center gap-1 text-white/50">
                        <button
                            type="button"
                            onClick={() => setSelectedFolderId(null)}
                            className={selectedFolderId == null ? "text-white font-medium cursor-default" : "hover:text-teal"}
                        >
                            All Summaries
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
                        const hasSummaries = visibleSummaries.length > 0;
                        if (!showFolders && !hasSummaries) {
                            return (
                                <div className="text-center py-12 text-white/40 text-sm">
                                    {search ? "No summaries match your search." : "No summaries here. Generate one or select a folder."}
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
                                                await apiSummaries.updateSummaryFolder(id, newTitle);
                                                setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: newTitle } : f)));
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                    />
                                ))}
                                {visibleSummaries.map((summary) => {
                                    const isGenerating = summary.generating === true || summary.status === "generating";
                                    return (
                                        <OutputCard
                                            key={summary.id}
                                            type="summary"
                                            id={summary.id}
                                            title={summary.title}
                                            category="Summary"
                                            sourceFileName={summary.file_name ?? null}
                                            date={summary.created_at ? new Date(summary.created_at).toLocaleDateString() : null}
                                            isGenerating={isGenerating}
                                            statusText={isGenerating ? "Generating…" : null}
                                            onClick={() => openSummary(summary.id)}
                                            onDelete={() => setConfirmDelete({ id: summary.id, title: summary.title })}
                                            onRename={(id, newTitle) => {
                                                setSummaries((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
                                                handleRename(id, newTitle);
                                            }}
                                            onMoveToFolder={null}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>

                    {/* DELETE CONFIRM */}
                    {confirmDelete && (
                        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                            <div className="w-full max-w-md rounded-2xl bg-black border border-red-500/20 p-6">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Delete summary
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

                    <GenerateSummaryModal
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        onCreated={({ jobId, summaryId, title, file_name }) => {
                            setOpenModal(false);
                            
                            // Create generating placeholder (matching MCQ pattern)
                            const generatingSummary = {
                                id: jobId, // Use jobId as temporary ID
                                title: title || "Generating summary…",
                                file_name: file_name,
                                generating: true,
                                created_at: new Date().toISOString(),
                            };
                            
                            // Add to top of list - polling will start automatically via useEffect
                            setSummaries(prev => [generatingSummary, ...prev]);
                            
                            // If summaryId is available (completed summary), navigate to it
                            // Otherwise, user will see generating placeholder and can navigate when ready
                            if (summaryId) {
                                navigate(`/summaries/${summaryId}`);
                            }
                        }}
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
                                    Import Summary
                                </h3>
                                <p className="text-sm text-muted mb-4">
                                    Enter the import code to import a summary.
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
                                                const res = await apiSummaries.importSummary(importCode);
                                                
                                                if (res?.success) {
                                                    await loadSummaries(selectedFolderId ?? null);
                                                    setShowImport(false);
                                                    setImportCode("");
                                                    setImportError(null);
                                                } else {
                                                    // Backend returned error - sanitize and display
                                                    const rawError = res?.error || res?.message || "Import failed";
                                                    setImportError(sanitizeErrorMessage(rawError));
                                                }
                                            } catch (err) {
                                                // Backend error - sanitize and display
                                                const rawError = err.response?.data?.error || 
                                                               err.response?.data?.message || 
                                                               err.message || 
                                                               "Failed to import summary";
                                                setImportError(sanitizeErrorMessage(rawError));
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
                            try {
                                const created = await apiSummaries.createSummaryFolder(name);
                                if (created?.id) {
                                    setFolders((prev) => [...prev, created]);
                                    setSelectedFolderId(created.id);
                                }
                            } catch (e) {
                                console.error(e);
                            }
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
                                await apiSummaries.deleteSummaryFolder(folderToDelete.id);
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

                    {/* Summary Failure Popup */}
            <SummaryFailurePopup
                isOpen={failurePopup.isOpen}
                onClose={() => setFailurePopup({ isOpen: false, isProcessing: false, onRetry: null })}
                onRetry={failurePopup.onRetry || (() => setFailurePopup({ isOpen: false, isProcessing: false, onRetry: null }))}
                isProcessing={failurePopup.isProcessing}
            />
        </div>
    );
}

