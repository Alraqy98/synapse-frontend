// src/modules/summaries/SummariesTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Plus, MoreHorizontal, Upload } from "lucide-react";
import { apiSummaries } from "./apiSummaries";
import SummaryCard from "./SummaryCard";
import GenerateSummaryModal from "./GenerateSummaryModal";
import SummaryViewer from "./SummaryViewer";
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
    const { summaryId: urlSummaryId } = useParams();
    const navigate = useNavigate();
    const [view, setView] = useState("list");
    const [summaryId, setSummaryId] = useState(null);
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

    // Handle deep link from URL
    useEffect(() => {
        if (urlSummaryId && urlSummaryId !== summaryId) {
            setSummaryId(urlSummaryId);
            setView("viewer");
        } else if (!urlSummaryId && view === "viewer") {
            // URL changed to remove summaryId, reset to list
            setView("list");
            setSummaryId(null);
        }
    }, [urlSummaryId]);

    // Load summaries (matching MCQ pattern exactly)
    const loadSummaries = async () => {
        try {
            if (!initialLoadDone) setLoading(true);
            const summaries = await apiSummaries.getAllSummaries();
            setSummaries(summaries || []);
        } catch (err) {
            console.error("Failed to load summaries:", err);
            setSummaries([]);
        } finally {
            setLoading(false);
            setInitialLoadDone(true);
        }
    };

    useEffect(() => {
        loadSummaries();
    }, []);

    // Poll for all summaries every 15 seconds to catch backend updates
    useEffect(() => {
        if (!initialLoadDone) return; // Don't poll until initial load is done
        
        const interval = setInterval(() => {
            loadSummaries();
        }, 15000); // Poll every 15 seconds

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
        
        setSummaryId(id);
        setView("viewer");
    };

    // Filtered and sorted summaries
    const visibleSummaries = useMemo(() => {
        let list = [...summaries];

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
    }, [summaries, search, sort]);

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

    return (
        <div className="h-full w-full">
            {view === "viewer" ? (
                <SummaryViewer
                    summaryId={summaryId}
                    goBack={() => {
                        setView("list");
                        setSummaryId(null);
                        navigate("/summaries", { replace: true });
                        // Do NOT reload summaries - keep state intact (matching MCQ pattern)
                    }}
                    onRename={handleRename}
                    onDelete={async (id) => {
                        setSummaries((prev) => prev.filter((s) => s.id !== id));
                        try {
                            await apiSummaries.deleteSummary(id);
                        } catch (err) {
                            console.error("Delete failed", err);
                            loadSummaries();
                        }
                    }}
                />
            ) : (
                <>
                    <div className="max-w-7xl mx-auto px-6 pb-28">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8">
                            {/* HEADER */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight text-white">
                                        Summaries
                                    </h1>
                                    <p className="text-sm text-muted mt-1">
                                        AI-generated summaries from your library files
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary gap-2"
                                    onClick={() => setOpenModal(true)}
                                >
                                    <Plus size={16} />
                                    Generate Summary
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
                                        placeholder="Search summaries…"
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
                                <div className="text-sm text-muted">Loading summaries…</div>
                            ) : visibleSummaries.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-muted mb-4">
                                        {search
                                            ? "No summaries match your search."
                                            : "No summaries available. Generate a summary from a file to get started."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {visibleSummaries.map((summary) => (
                                        <SummaryCard
                                            key={summary.id}
                                            summary={summary}
                                            onClick={() => openSummary(summary.id)}
                                            onDelete={(id) =>
                                                setConfirmDelete({ id, title: summary.title })
                                            }
                                            onRename={handleRename}
                                            onExportCode={handleExportCode}
                                        />
                                    ))}
                                </div>
                            )}
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
                        onCreated={({ jobId, title, file_name }) => {
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
                                                    // Success - reload summaries and close modal
                                                    await loadSummaries();
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

                    {/* Summary Failure Popup */}
                    <SummaryFailurePopup
                        isOpen={failurePopup.isOpen}
                        onClose={() => setFailurePopup({ isOpen: false, isProcessing: false, onRetry: null })}
                        onRetry={failurePopup.onRetry || (() => setFailurePopup({ isOpen: false, isProcessing: false, onRetry: null }))}
                        isProcessing={failurePopup.isProcessing}
                    />
                </>
            )}
        </div>
    );
}

