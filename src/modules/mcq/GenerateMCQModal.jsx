// ====================================================================
// GenerateMCQModal.jsx — PREMIUM, STABLE, FLASHCARDS-GRADE VERSION
// ====================================================================

import React, { useState, useEffect } from "react";
import { apiMCQ } from "./apiMCQ";
import { getLibraryItems, getItemById, prepareFile } from "../Library/apiLibrary";
import { ChevronDown, Check } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import "../../styles/GenerationModal.css";

// ------------------------------------------------------------
// PREMIUM DROPDOWN COMPONENT
// ------------------------------------------------------------
function PremiumDropdown({ label, value, setValue, options }) {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value) || options[0];

    return (
        <div className="w-full">
            <label className="text-sm text-muted">{label}</label>

            <div className="relative mt-1">
                <div
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 cursor-pointer flex justify-between items-center hover:border-teal transition"
                    onClick={() => setOpen(!open)}
                >
                    {selected.label}
                    <ChevronDown size={16} className="opacity-60" />
                </div>

                {open && (
                    <div className="absolute left-0 right-0 mt-2 bg-void border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                        {options.map(opt => {
                            const isSelected = opt.value === value;

                            return (
                                <div
                                    key={opt.value}
                                    className={`px-4 py-3 cursor-pointer hover:bg-white/10 ${isSelected ? "bg-teal/10" : ""
                                        }`}
                                    onClick={() => {
                                        setValue(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {isSelected && <Check size={14} className="text-teal" />}
                                        <div className="font-medium">{opt.label}</div>
                                    </div>

                                    {opt.desc && (
                                        <div className="text-xs text-muted ml-5 mt-1">
                                            {opt.desc}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function FolderDropdown({ value, onChange, folders, includeAll = false }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        function handleClickOutside() {
            setOpen(false);
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

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <label className="text-sm text-muted">Folder</label>
            <button
                type="button"
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-left"
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
                    </div>
                </div>
            )}
        </div>
    );
}

// ------------------------------------------------------------
// UUID helper
// ------------------------------------------------------------
const looksLikeUuid = str =>
    typeof str === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------
export default function GenerateMCQModal({
    open,
    onClose,
    onCreated,
    presetFileId = null,
    folders: initialFolders = [],
}) {
    const { success, error, info } = useNotification();
    if (!open) return null;

    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("standard");
    const [count, setCount] = useState(15);

    const [tree, setTree] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [selectedFiles, setSelectedFiles] = useState(
        presetFileId ? [presetFileId] : []
    );
    const [selectedFilesData, setSelectedFilesData] = useState([]); // Store file objects with ingestion_status
    const [fileNotReadyMessage, setFileNotReadyMessage] = useState(null);

    const [loadingTree, setLoadingTree] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [folders, setFolders] = useState(initialFolders);
    const [selectedFolderId, setSelectedFolderId] = useState("all");
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [paywallModal, setPaywallModal] = useState(false);

    // ------------------------------------------------------------
    // Load file data for presetFileId
    // ------------------------------------------------------------
    useEffect(() => {
        if (!open || !presetFileId) return;
        
        (async () => {
            try {
                const file = await getItemById(presetFileId);
                if (file) {
                    setSelectedFilesData([file]);
                }
            } catch (err) {
                console.error("Failed to load preset file:", err);
            }
        })();
    }, [open, presetFileId]);

    useEffect(() => {
        if (!open) return;
        setSelectedFolderId("all");
        if (initialFolders?.length) {
            setFolders(initialFolders);
        }
        (async () => {
            try {
                setLoadingFolders(true);
                const list = await apiMCQ.getMCQFolders();
                setFolders(list || []);
            } catch (err) {
                console.error("Failed to load MCQ folders:", err);
            } finally {
                setLoadingFolders(false);
            }
        })();
    }, [open]);

    // ------------------------------------------------------------
    // Poll selected files for readiness (every 4 seconds)
    // ------------------------------------------------------------
    useEffect(() => {
        if (selectedFiles.length === 0) return;

        const pollFiles = async () => {
            // Use functional setState to get latest files
            let currentFiles = [];
            setSelectedFilesData(prev => {
                currentFiles = prev;
                return prev; // Keep current while fetching
            });

            // Poll all selected files
            try {
                const updatedFiles = await Promise.all(
                    selectedFiles.map(async (fileId) => {
                        try {
                            return await getItemById(fileId);
                        } catch (err) {
                            console.error(`Failed to poll file ${fileId}:`, err);
                            // Return existing file data if fetch fails
                            const existing = currentFiles.find(f => f.id === fileId);
                            return existing || { id: fileId, ingestion_status: "ready" };
                        }
                    })
                );
                
                setSelectedFilesData(updatedFiles);
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        // Initial poll
        pollFiles();

        // Poll every 4 seconds
        const interval = setInterval(pollFiles, 4000);
        
        return () => clearInterval(interval);
    }, [selectedFiles.join(',')]); // Only re-run when selectedFiles IDs change

    // ------------------------------------------------------------
    // Load ROOT tree when modal opens
    // ------------------------------------------------------------
    useEffect(() => {
        if (!open) return;
        if (presetFileId) return; // 🚫 skip library tree

        (async () => {
            setLoadingTree(true);
            try {
                const root = await getLibraryItems("All", null);

                const normalized = root.map(n => ({
                    ...n,
                    children: n.children || []
                }));

                setTree(normalized);
            } catch (err) {
                console.error("MCQ Modal: failed loading library:", err);
            }
            setLoadingTree(false);
        })();
    }, [open, presetFileId]);

    // ------------------------------------------------------------
    // Fetch folder children
    // ------------------------------------------------------------
    async function loadChildren(folderId) {
        const items = await getLibraryItems("All", folderId);

        return items.map(c => ({
            ...c,
            children: c.children || []
        }));
    }

    // ------------------------------------------------------------
    // TRUE RECURSIVE NODE UPDATE (Flashcards logic)
    // ------------------------------------------------------------
    function updateNodeRecursive(nodes, id, children) {
        return nodes.map(n => {
            if (n.id === id) {
                return { ...n, children };
            }
            if (n.children?.length) {
                return { ...n, children: updateNodeRecursive(n.children, id, children) };
            }
            return n;
        });
    }

    // ------------------------------------------------------------
    // Toggle folder open/close
    // ------------------------------------------------------------
    async function toggleFolder(folder) {
        const id = folder.id;

        // Close
        if (expanded[id]) {
            setExpanded(prev => ({ ...prev, [id]: false }));
            return;
        }

        // Open → load children
        const children = await loadChildren(id);

        setTree(prev => updateNodeRecursive(prev, id, children));
        setExpanded(prev => ({ ...prev, [id]: true }));
    }

    // ------------------------------------------------------------
    // File selection
    // ------------------------------------------------------------
    async function toggleSelectFile(fileId, fileNode = null) {
        const isSelected = selectedFiles.includes(fileId);
        
        if (isSelected) {
            setSelectedFiles(prev => prev.filter(id => id !== fileId));
            setSelectedFilesData(prev => prev.filter(f => f.id !== fileId));
        } else {
            setSelectedFiles(prev => [...prev, fileId]);
            setFileNotReadyMessage(null);
            
            // Fetch file metadata if not provided
            let fileData = fileNode;
            if (!fileData) {
                try {
                    fileData = await getItemById(fileId);
                } catch (err) {
                    console.error("Failed to fetch file:", err);
                    fileData = { id: fileId, ingestion_status: "ready" }; // Default to ready if fetch fails
                }
            }
            
            setSelectedFilesData(prev => [...prev, fileData]);
        }
    }

    // ------------------------------------------------------------
    // Collect all files inside folder
    // ------------------------------------------------------------
    function collectAllFiles(node) {
        let out = [];
        if (node.kind === "file") out.push(node.id);
        if (node.children?.length) {
            node.children.forEach(c => {
                out = out.concat(collectAllFiles(c));
            });
        }
        return out;
    }

    function handleSelectFolder(folder) {
        const folderFiles = collectAllFiles(folder);
        setSelectedFiles(prev => [...new Set([...prev, ...folderFiles])]);
    }

    // ------------------------------------------------------------
    // Render tree recursively
    // ------------------------------------------------------------
    function renderNode(node, depth = 0) {
        const pad = { paddingLeft: `${depth * 16}px` };

        if (node.kind === "folder") {
            const isOpen = expanded[node.id];

            return (
                <div key={node.id}>
                    <div
                        className="flex items-center gap-2 py-1 cursor-pointer hover:text-teal"
                        style={pad}
                    >
                        <span onClick={() => toggleFolder(node)}>
                            {isOpen ? "📂" : "📁"}
                        </span>
                        <span onClick={() => toggleFolder(node)}>{node.title}</span>

                        {isOpen && (
                            <button
                                className="ml-2 text-xs px-2 py-0.5 bg-white/10 border border-white/20 rounded hover:border-teal/50"
                                onClick={() => handleSelectFolder(node)}
                            >
                                Select Folder
                            </button>
                        )}
                    </div>

                    {isOpen &&
                        node.children.map(c => renderNode(c, depth + 1))}
                </div>
            );
        }

        if (node.kind === "file") {
            const checked = selectedFiles.includes(node.id);

            return (
                <div
                    key={node.id}
                    className="flex items-center gap-2 py-1"
                    style={pad}
                >
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelectFile(node.id, node)}
                    />
                    <span>📄 {node.title}</span>
                </div>
            );
        }

        return null;
    }

    // ------------------------------------------------------------
    // Submit → Create MCQ Deck
    // ------------------------------------------------------------
    async function handleSubmit() {
        if (!title.trim()) {
            error("Enter deck title.");
            return;
        }
        if (selectedFiles.length === 0) {
            error("Select at least one file.");
            return;
        }


        const invalid = selectedFiles.filter(id => !looksLikeUuid(id));
        if (invalid.length) console.warn("Invalid file IDs:", invalid);

        const payload = {
            title,
            difficulty,
            question_count_target: Number(count),
            file_ids: selectedFiles,
            mcq_folder_id: selectedFolderId === "all" ? null : selectedFolderId,
        };

        try {
            setSubmitting(true);
            setFileNotReadyMessage(null);

            // Trigger rendering for all files (non-blocking, backend handles asynchronously)
            for (const fileId of selectedFiles) {
                try {
                    await prepareFile(fileId);
                } catch (err) {
                    // Continue even if prepare-file fails - generator will handle it
                    console.warn(`Failed to prepare file ${fileId}:`, err);
                }
            }

            // Proceed with generation (atomic operation)
            await apiMCQ.createMCQDeck(payload);
            success("MCQ deck created");
            onCreated();
            onClose();
        } catch (err) {
            console.error("MCQ creation error:", err);
            const status = err?.response?.status;
            const data = err?.response?.data;
            const isSubscriptionRequired =
                status === 402 ||
                data?.error === "Subscription required" ||
                data?.message === "Upgrade to generate MCQs, flashcards, and summaries";
            if (isSubscriptionRequired) {
                setPaywallModal(true);
                return;
            }
            if (err.code === "FILE_NOT_READY" || err.message?.includes("Preparing content")) {
                setFileNotReadyMessage(err.message || "Preparing content. This usually takes a few seconds.");
            } else if (
                err.response?.status === 409 &&
                err.response?.data?.error === "FILES_STILL_PROCESSING"
            ) {
                // Timing issue: files are still being processed (not a hard failure)
                info("Your file is still being processed. Please wait a moment and try again.");
            } else {
                error("Generation failed. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    // ------------------------------------------------------------
    // Unified close handler
    const handleClose = () => {
        onClose();
    };

    // ESC key handler
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    // UI
    // ------------------------------------------------------------
    return (
        <>
        <div
            className="synapse-gen-modal synapse-gen-modal-backdrop"
            onClick={handleClose}
        >
            <div
                className="synapse-gen-modal-box"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="synapse-gen-modal-header">
                    <h2 className="synapse-gen-modal-title">Generate MCQ Deck</h2>
                    <p className="synapse-gen-modal-subtitle">
                        {presetFileId && selectedFilesData[0]?.title
                            ? `Generating from: ${selectedFilesData[0].title}`
                            : "Select source file(s) below."}
                    </p>
                    <button
                        type="button"
                        className="synapse-gen-modal-close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Title */}
                <div className="synapse-gen-modal-field">
                    <label className="synapse-gen-modal-label">Title</label>
                    <input
                        className="synapse-gen-modal-input"
                        placeholder="e.g., Cardiology Block MCQs"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Difficulty + Count */}
                <div className="synapse-gen-modal-grid-2">
                    <PremiumDropdown
                        label="Difficulty"
                        value={difficulty}
                        setValue={setDifficulty}
                        options={[
                            { value: "basic", label: "Basic" },
                            { value: "standard", label: "Standard" },
                            { value: "advanced", label: "Advanced" }
                        ]}
                    />
                    <PremiumDropdown
                        label="Question Count"
                        value={count}
                        setValue={setCount}
                        options={[
                            { value: 15, label: "15" },
                            { value: 30, label: "30" },
                            { value: 45, label: "45" }
                        ]}
                    />
                </div>

                {/* Folder */}
                <div className="synapse-gen-modal-field">
                    <FolderDropdown
                        value={selectedFolderId}
                        onChange={setSelectedFolderId}
                        folders={folders}
                        includeAll
                    />
                    {loadingFolders && (
                        <div className="text-xs mt-1" style={{ color: "var(--gen-text-muted)" }}>Loading folders…</div>
                    )}
                </div>

                {/* FILE PICKER */}
                {!presetFileId && (
                    <>
                        <label className="synapse-gen-modal-label">Source Files</label>
                        <div className="synapse-gen-file-list mt-1">
                            {loadingTree ? (
                                <div style={{ color: "var(--gen-text-muted)", fontSize: 13 }}>Loading files…</div>
                            ) : tree.length === 0 ? (
                                <div style={{ color: "var(--gen-text-muted)", fontSize: 13, opacity: 0.8 }}>No files found in your library.</div>
                            ) : (
                                tree.map((n) => renderNode(n))
                            )}
                        </div>
                    </>
                )}

                {fileNotReadyMessage && (
                    <div className="synapse-gen-message mt-2">
                        <p style={{ margin: 0 }}>{fileNotReadyMessage}</p>
                    </div>
                )}

                <div className="synapse-gen-modal-footer">
                    <button type="button" className="synapse-gen-modal-btn-cancel" onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="synapse-gen-modal-btn-primary"
                        disabled={submitting || !title.trim() || selectedFiles.length === 0}
                        onClick={handleSubmit}
                    >
                        {submitting ? "Generating…" : "Generate"}
                    </button>
                </div>
            </div>
        </div>
        {paywallModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
                <div className="bg-[#0D0F12] rounded-lg p-8 max-w-md border border-teal-500/30">
                    <h2 className="text-2xl font-semibold text-white mb-2">🔒 Unlock MCQ Generation</h2>
                    <p className="text-gray-400 mb-6">
                        MCQ generation requires a paid subscription. Upgrade to generate unlimited questions.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setPaywallModal(false)}
                            className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:bg-white/5"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setPaywallModal(false);
                                window.location.href = "/settings";
                            }}
                            className="flex-1 px-4 py-3 bg-teal-500 rounded-lg text-white font-semibold hover:bg-teal-600"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
