// ===============================================================
// GenerateFlashcardsModal.jsx — FINAL STABLE VERSION
// ===============================================================

import React, { useEffect, useState } from "react";
import { generateFlashcards } from "./apiFlashcards";
import { getLibraryItems, getItemById, prepareFile } from "../Library/apiLibrary";
import { Check, ChevronDown } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import "../../styles/GenerationModal.css";

// ===============================================================
// MODE DROPDOWN
// ===============================================================
function ModeDropdown({ mode, setMode }) {
    const [open, setOpen] = useState(false);

    const modes = [
        { value: "turbo", label: "Turbo Recall", desc: "Fast recall, minimal redundancy." },
        { value: "high_yield", label: "High Yield", desc: "Keeps only the highest exam points." },
        { value: "deep", label: "Deep Mastery", desc: "Full concepts with strong explanations." },
    ];

    const selected = modes.find((m) => m.value === mode) || modes[0];

    return (
        <div className="relative">
            <div
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer flex justify-between items-center hover:border-teal transition"
                onClick={() => setOpen(!open)}
            >
                <span>{selected.label}</span>
                <ChevronDown size={16} className="text-muted" />
            </div>

            {open && (
                <div className="absolute left-0 right-0 mt-2 bg-void border border-white/10 shadow-xl rounded-xl z-50 overflow-hidden">
                    {modes.map((m) => {
                        const isSelected = m.value === mode;
                        return (
                            <div
                                key={m.value}
                                className={`px-4 py-3 cursor-pointer hover:bg-white/10 text-sm ${isSelected ? "bg-teal/10" : ""
                                    }`}
                                onClick={() => {
                                    setMode(m.value);
                                    setOpen(false);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {isSelected && <Check size={14} className="text-teal" />}
                                    <div className="font-medium">{m.label}</div>
                                </div>
                                <div className="text-xs text-muted mt-1 ml-5">{m.desc}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Debug helper
const looksLikeUuid = (str) =>
    typeof str === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// ===============================================================
// MAIN COMPONENT
// ===============================================================
export default function GenerateFlashcardsModal({
    open,
    onClose,
    onCreated,
    presetFileId = null,
}) {
    const { success, error } = useNotification();
    if (!open) return null;
    const [title, setTitle] = useState("");
    const [mode, setMode] = useState("turbo");
    const [includeRefs, setIncludeRefs] = useState(true);

    const [tree, setTree] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [selectedFiles, setSelectedFiles] = useState(
        presetFileId ? [presetFileId] : []
    );
    const [selectedFilesData, setSelectedFilesData] = useState([]);
    const [fileNotReadyMessage, setFileNotReadyMessage] = useState(null);

    const [loadingTree, setLoadingTree] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [paywallModal, setPaywallModal] = useState(false);

    // --------------------------------------------------------------
    // Load file data for presetFileId
    // --------------------------------------------------------------
    useEffect(() => {
        if (!presetFileId) return;
        
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
    }, [presetFileId]);

    // --------------------------------------------------------------
    // Poll selected files for readiness (every 4 seconds)
    // --------------------------------------------------------------
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

    // --------------------------------------------------------------
    // Load root (ONE TIME ONLY)
    // --------------------------------------------------------------
    useEffect(() => {
        if (presetFileId) return; // 🚫 do NOT load library

        (async () => {
            try {
                setLoadingTree(true);
                const items = await getLibraryItems("All", null);
                setTree(items || []);
            } catch (err) {
                console.error("❌ Failed to load root:", err);
            } finally {
                setLoadingTree(false);
            }
        })();
    }, [presetFileId]);

    // --------------------------------------------------------------
    // Load folder children
    // --------------------------------------------------------------
    async function loadChildren(folderId) {
        const children = await getLibraryItems("All", folderId);
        console.log("📂 Folder", folderId, children);
        return children;
    }

    async function toggleFolder(folder) {
        const id = folder.id;

        if (expanded[id]) {
            setExpanded((prev) => ({ ...prev, [id]: false }));
            return;
        }

        const children = await loadChildren(id);

        setTree((prev) =>
            prev.map((n) => (n.id === id ? { ...n, children } : n))
        );

        setExpanded((prev) => ({ ...prev, [id]: true }));
    }

    // --------------------------------------------------------------
    // Select file
    // --------------------------------------------------------------
    async function toggleSelectFile(fileId, fileNode = null) {
        const isSelected = selectedFiles.includes(fileId);
        
        if (isSelected) {
            setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
            setSelectedFilesData((prev) => prev.filter((f) => f.id !== fileId));
        } else {
            setSelectedFiles((prev) => [...prev, fileId]);
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
            
            setSelectedFilesData((prev) => [...prev, fileData]);
        }
    }

    // --------------------------------------------------------------
    // Folder recursive file collection
    // --------------------------------------------------------------
    function collectAllFiles(node) {
        let out = [];
        if (node.kind === "file" && node.id) out.push(node.id);

        if (node.children?.length) {
            node.children.forEach((c) => (out = out.concat(collectAllFiles(c))));
        }

        return out;
    }

    function handleSelectFolder(folder) {
        const files = collectAllFiles(folder);
        setSelectedFiles((prev) => [...new Set([...prev, ...files])]);
    }

    // --------------------------------------------------------------
    // RENDER NODE — FIXED & NOW DEFINED BEFORE USE
    // --------------------------------------------------------------
    function renderNode(node, depth = 0) {
        const pad = { paddingLeft: `${depth * 14}px` };

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
                        (node.children || []).map((c) =>
                            renderNode(c, depth + 1)
                        )}
                </div>
            );
        }

        if (node.kind === "file") {
            const checked = selectedFiles.includes(node.id);
            return (
                <div key={node.id} className="flex items-center gap-2 py-1" style={pad}>
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

    // --------------------------------------------------------------
    // SUBMIT — BACKGROUND GENERATION (non-blocking)
    // --------------------------------------------------------------
    async function handleSubmit() {
        if (!title.trim()) {
            error("Enter deck name.");
            return;
        }
        if (selectedFiles.length === 0) {
            error("Select at least one file.");
            return;
        }


        const badIds = selectedFiles.filter((id) => !looksLikeUuid(id));
        if (badIds.length) console.warn("⚠️ Invalid file IDs:", badIds);

        const payload = {
            title,
            mode,
            include_resources: includeRefs,
            file_ids: selectedFiles,
        };

        console.log("📤 Sending flashcards payload (non-blocking):", payload);

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
            // 🔥 BACKEND RETURNS ONLY THE DECK PLACEHOLDER (generating=true)
            const { deck } = await generateFlashcards(payload);

            console.log("⚡ Flashcard generation started in background:", deck);

            success("Flashcards created");
            onCreated(deck);
            onClose();
        } catch (err) {
            console.error("❌ Flashcard generation failed:", err);
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
            } else {
                error("Generation failed. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }


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

    // --------------------------------------------------------------
    // UI
    // --------------------------------------------------------------
    const presetFileName = presetFileId && selectedFilesData[0]?.title ? selectedFilesData[0].title : null;

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
                    <h2 className="synapse-gen-modal-title">Generate Flashcards</h2>
                    <p className="synapse-gen-modal-subtitle">
                        {presetFileName ? `Generating from: ${presetFileName}` : "Select source file(s) below."}
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

                <div className="synapse-gen-modal-field">
                    <label className="synapse-gen-modal-label">Deck Name</label>
                    <input
                        className="synapse-gen-modal-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Heart Failure High-Yield"
                    />
                </div>

                <div className="synapse-gen-modal-field">
                    <label className="synapse-gen-modal-label">Mode</label>
                    <ModeDropdown mode={mode} setMode={setMode} />
                </div>

                <label className="synapse-gen-modal-checkrow">
                    <input
                        type="checkbox"
                        checked={includeRefs}
                        onChange={(e) => setIncludeRefs(e.target.checked)}
                    />
                    Include slide/page references
                </label>

                {!presetFileId && (
                    <>
                        <label className="synapse-gen-modal-label">Source Files</label>
                        <div className="synapse-gen-file-list mt-1">
                            {loadingTree ? (
                                <div style={{ color: "var(--gen-text-muted)", fontSize: 13 }}>Loading…</div>
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
                    <h2 className="text-2xl font-semibold text-white mb-2">🔒 Unlock generation</h2>
                    <p className="text-gray-400 mb-6">
                        MCQs, flashcards, and summaries require a paid subscription.
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
                                window.location.href = "/settings";
                            }}
                            className="flex-1 px-4 py-3 bg-teal-500 rounded-lg text-white font-semibold hover:bg-teal-600"
                        >
                            Upgrade
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
