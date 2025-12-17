// ===============================================================
// GenerateFlashcardsModal.jsx — FINAL STABLE VERSION
// ===============================================================

import React, { useEffect, useState } from "react";
import { generateFlashcards } from "./apiFlashcards";
import { getLibraryItems } from "../Library/apiLibrary";
import { Check, ChevronDown } from "lucide-react";

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
    onCancel,
    onSuccess,
    presetFileId = null,
}) {
    const [title, setTitle] = useState("");
    const [mode, setMode] = useState("turbo");
    const [includeRefs, setIncludeRefs] = useState(true);

    const [tree, setTree] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [selectedFiles, setSelectedFiles] = useState(
        presetFileId ? [presetFileId] : []
    );

    const [loadingTree, setLoadingTree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
    function toggleSelectFile(fileId) {
        setSelectedFiles((prev) =>
            prev.includes(fileId)
                ? prev.filter((id) => id !== fileId)
                : [...prev, fileId]
        );
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
                        onChange={() => toggleSelectFile(node.id)}
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
        if (!title.trim()) return alert("Enter deck name.");
        if (selectedFiles.length === 0)
            return alert("Select at least one file.");

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

            // 🔥 BACKEND RETURNS ONLY THE DECK PLACEHOLDER (generating=true)
            const { deck } = await generateFlashcards(payload);

            console.log("⚡ Flashcard generation started in background:", deck);

            // 🔥 CLOSE MODAL IMMEDIATELY — user continues using Synapse
            onSuccess(deck);

            // Optional: show notification if you use toast
            // toast.info("Flashcards are generating in the background…");

        } catch (err) {
            console.error("❌ Flashcard generation failed:", err);
            alert("Flashcard generation failed.");
        } finally {
            setSubmitting(false);
        }
    }


    // --------------------------------------------------------------
    // UI
    // --------------------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-void border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                <h2 className="text-2xl font-bold mb-6">Generate Flashcards</h2>

                {/* Deck Name */}
                <div className="mb-4">
                    <label className="text-sm text-muted">Deck Name</label>
                    <input
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:border-teal outline-none"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Heart Failure High-Yield"
                    />
                </div>

                {/* Mode */}
                <div className="mb-4">
                    <label className="text-sm text-muted">Mode</label>
                    <ModeDropdown mode={mode} setMode={setMode} />
                </div>

                {/* Toggle refs */}
                <label className="flex items-center gap-2 mb-4 text-sm">
                    <input
                        type="checkbox"
                        checked={includeRefs}
                        onChange={(e) => setIncludeRefs(e.target.checked)}
                    />
                    Include slide/page references
                </label>

                {/* File tree */}
                {!presetFileId && (
                    <div className="border border-white/10 rounded-xl p-4 max-h-64 overflow-y-auto bg-black/20">
                        {loadingTree ? (
                            <div className="text-sm text-muted">Loading…</div>
                        ) : (
                            tree.map((n) => renderNode(n))
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-400"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-6 py-2 rounded-xl bg-teal text-black font-semibold disabled:opacity-50"
                        disabled={submitting}
                        onClick={handleSubmit}
                    >
                        {submitting ? "Generating…" : "Generate"}
                    </button>
                </div>
            </div>
        </div>
    );
}
