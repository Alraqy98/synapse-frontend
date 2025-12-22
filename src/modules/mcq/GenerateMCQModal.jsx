// ====================================================================
// GenerateMCQModal.jsx — PREMIUM, STABLE, FLASHCARDS-GRADE VERSION
// ====================================================================

import React, { useState, useEffect } from "react";
import { apiMCQ } from "./apiMCQ";
import { getLibraryItems, getItemById } from "../Library/apiLibrary";
import { areFilesReady, isFileReady, getRenderProgress } from "../Library/utils/fileReadiness";
import { ChevronDown, Check } from "lucide-react";

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
}) {
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

    // ------------------------------------------------------------
    // Poll selected files for readiness (every 4 seconds)
    // ------------------------------------------------------------
    useEffect(() => {
        if (selectedFiles.length === 0) return;

        const pollFiles = async () => {
            // Use functional setState to get latest files and check readiness
            let currentFiles = [];
            setSelectedFilesData(prev => {
                currentFiles = prev;
                if (prev.length > 0 && areFilesReady(prev)) {
                    return prev; // All ready, no update needed
                }
                return prev; // Keep current while fetching
            });

            // If all ready, skip polling
            if (currentFiles.length > 0 && areFilesReady(currentFiles)) {
                return;
            }

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
            const fileReady = isFileReady(node);
            const progress = getRenderProgress(node);

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
                    {!fileReady && (
                        <span className="text-xs text-muted ml-2">
                            {progress.total > 0 
                                ? `Preparing slides (${progress.rendered} / ${progress.total})`
                                : "Preparing slides…"}
                        </span>
                    )}
                </div>
            );
        }

        return null;
    }

    // ------------------------------------------------------------
    // Submit → Create MCQ Deck
    // ------------------------------------------------------------
    async function handleSubmit() {
        if (!title.trim()) return alert("Enter deck title.");
        if (selectedFiles.length === 0) return alert("Select at least one file.");

        // Check all files are ready
        if (!areFilesReady(selectedFilesData)) {
            setFileNotReadyMessage("Preparing slides. This usually takes a few seconds.");
            return;
        }

        const invalid = selectedFiles.filter(id => !looksLikeUuid(id));
        if (invalid.length) console.warn("Invalid file IDs:", invalid);

        const payload = {
            title,
            difficulty,
            question_count_target: Number(count),
            file_ids: selectedFiles
        };

        try {
            setSubmitting(true);
            setFileNotReadyMessage(null);
            await apiMCQ.createMCQDeck(payload);
            onCreated();
            onClose();
        } catch (err) {
            console.error("MCQ creation error:", err);
            if (err.code === "FILE_NOT_READY" || err.message?.includes("Preparing slides")) {
                setFileNotReadyMessage(err.message || "Preparing slides. This usually takes a few seconds.");
            } else {
                alert("MCQ generation failed.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    // ------------------------------------------------------------
    // UI
    // ------------------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-void border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                <h2 className="text-2xl font-bold mb-6">Generate MCQ Deck</h2>

                {/* Title */}
                <div className="mb-4">
                    <label className="text-sm text-muted">Title</label>
                    <input
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-teal outline-none"
                        placeholder="e.g., Cardiology Block MCQs"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                {/* Difficulty + Count */}
                <div className="grid grid-cols-2 gap-4 mb-4">
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

                {/* FILE PICKER */}
                {!presetFileId && (
                    <>
                        <label className="text-sm text-muted">Source Files</label>
                        <div className="border border-white/10 rounded-xl p-4 mt-1 max-h-64 overflow-y-auto bg-black/20">
                            {loadingTree ? (
                                <div className="text-sm text-muted">Loading files…</div>
                            ) : tree.length === 0 ? (
                                <div className="text-sm text-muted opacity-50">
                                    No files found in your library.
                                </div>
                            ) : (
                                tree.map(n => renderNode(n))
                            )}
                        </div>
                    </>
                )}

                {selectedFiles.length > 0 && !areFilesReady(selectedFilesData) && (() => {
                    const progress = selectedFilesData.reduce((acc, file) => {
                        const prog = getRenderProgress(file);
                        return {
                            totalRendered: acc.totalRendered + prog.rendered,
                            totalPages: acc.totalPages + prog.total
                        };
                    }, { totalRendered: 0, totalPages: 0 });

                    return (
                        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-sm text-muted">
                                {progress.totalPages > 0 
                                    ? `Preparing slides (${progress.totalRendered} / ${progress.totalPages})`
                                    : "Preparing slides…"}
                            </p>
                        </div>
                    );
                })()}

                {fileNotReadyMessage && (
                    <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-sm text-muted">{fileNotReadyMessage}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-400"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-6 py-2 rounded-xl bg-teal text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submitting || !title.trim() || selectedFiles.length === 0 || !areFilesReady(selectedFilesData)}
                        onClick={handleSubmit}
                        title={!areFilesReady(selectedFilesData) ? "Preparing slides…" : undefined}
                    >
                        {submitting ? "Generating…" : "Generate"}
                    </button>
                </div>
            </div>
        </div>
    );
}
