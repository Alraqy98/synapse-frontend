// src/modules/summaries/GenerateSummaryModal.jsx
import React, { useState, useEffect } from "react";
import { apiSummaries } from "./apiSummaries";
import { getLibraryItems, getItemById, prepareFile } from "../Library/apiLibrary";
import { ChevronDown, Check, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// Helper to get auth token
function getSupabaseToken() {
    try {
        const key = Object.keys(localStorage).find((k) =>
            k.includes("auth-token")
        );
        if (!key) return null;
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed?.access_token || localStorage.getItem("access_token");
    } catch {
        return localStorage.getItem("access_token");
    }
}

// Premium Dropdown Component (reused from MCQ modal)
function PremiumDropdown({ label, value, setValue, options }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value) || options[0];

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
                        {options.map((opt) => {
                            const isSelected = opt.value === value;

                            return (
                                <div
                                    key={opt.value}
                                    className={`px-4 py-3 cursor-pointer hover:bg-white/10 ${
                                        isSelected ? "bg-teal/10" : ""
                                    }`}
                                    onClick={() => {
                                        setValue(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {isSelected && (
                                            <Check size={14} className="text-teal" />
                                        )}
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

const looksLikeUuid = (str) =>
    typeof str === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function GenerateSummaryModal({
    open,
    onClose,
    onCreated,
    presetFileId = null,
}) {
    if (!open) return null;

    const [title, setTitle] = useState("");
    const [academicStage, setAcademicStage] = useState("4th_year");
    const [specialty, setSpecialty] = useState("");
    const [goal, setGoal] = useState("exam");
    const [instruction, setInstruction] = useState("");

    const [tree, setTree] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [selectedFileId, setSelectedFileId] = useState(presetFileId || null);
    const [selectedFileName, setSelectedFileName] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const [loadingTree, setLoadingTree] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // Load library tree
    useEffect(() => {
        if (!open) return;
        if (presetFileId) {
            // If presetFileId, find the file name for auto-title and fetch file metadata
            (async () => {
                try {
                    const file = await getItemById(presetFileId);
                    if (file) {
                        setSelectedFile(file);
                        setSelectedFileName(file.title);
                        if (!title.trim()) {
                            setTitle(`${file.title} – Summary`);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load file:", err);
                    // Fallback to searching in tree
                    try {
                        const root = await getLibraryItems("All", null);
                        const findFile = (items) => {
                            for (const item of items) {
                                if (item.id === presetFileId && item.kind === "file") {
                                    return item.title;
                                }
                                if (item.children) {
                                    const found = findFile(item.children);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };
                        const fileName = findFile(root);
                        if (fileName) {
                            setSelectedFileName(fileName);
                            if (!title.trim()) {
                                setTitle(`${fileName} – Summary`);
                            }
                        }
                    } catch (err2) {
                        console.error("Failed to load file name:", err2);
                    }
                }
            })();
            return;
        }

        (async () => {
            setLoadingTree(true);
            try {
                const root = await getLibraryItems("All", null);
                const normalized = root.map((n) => ({
                    ...n,
                    children: n.children || [],
                }));
                setTree(normalized);
            } catch (err) {
                console.error("Summary Modal: failed loading library:", err);
            }
            setLoadingTree(false);
        })();
    }, [open, presetFileId]);

    async function loadChildren(folderId) {
        const items = await getLibraryItems("All", folderId);
        return items.map((c) => ({
            ...c,
            children: c.children || [],
        }));
    }

    function updateNodeRecursive(nodes, id, children) {
        return nodes.map((n) => {
            if (n.id === id) {
                return { ...n, children };
            }
            if (n.children?.length) {
                return {
                    ...n,
                    children: updateNodeRecursive(n.children, id, children),
                };
            }
            return n;
        });
    }

    async function toggleFolder(folder) {
        const id = folder.id;

        if (expanded[id]) {
            setExpanded((prev) => ({ ...prev, [id]: false }));
            return;
        }

        const children = await loadChildren(id);
        setTree((prev) => updateNodeRecursive(prev, id, children));
        setExpanded((prev) => ({ ...prev, [id]: true }));
    }

    async function selectFile(fileId, fileName) {
        // Single file selection - deselect previous if selecting new
        setSelectedFileId(fileId);
        setSelectedFileName(fileName);
        setErrorMessage(null);
        // Auto-generate title if empty
        if (!title.trim()) {
            setTitle(`${fileName} – Summary`);
        }
        // Fetch file metadata
        try {
            const file = await getItemById(fileId);
            setSelectedFile(file);
        } catch (err) {
            console.error("Failed to fetch file:", err);
        }
    }

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
                    </div>

                    {isOpen &&
                        node.children.map((c) => renderNode(c, depth + 1))}
                </div>
            );
        }

        if (node.kind === "file") {
            const isSelected = selectedFileId === node.id;

            return (
                <div key={node.id} className="flex items-center gap-2 py-1" style={pad}>
                    <input
                        type="radio"
                        name="summary-file-select"
                        checked={isSelected}
                        onChange={() => {
                            selectFile(node.id, node.title);
                            setSelectedFile(node);
                        }}
                    />
                    <span>📄 {node.title}</span>
                </div>
            );
        }

        return null;
    }


    async function handleSubmit() {
        if (!title.trim()) {
            return alert("Enter summary title.");
        }
        if (!selectedFileId) {
            return alert("Please select a file.");
        }

        if (!looksLikeUuid(selectedFileId)) {
            console.warn("Invalid file ID:", selectedFileId);
            return alert("Invalid file selected.");
        }

        const payload = {
            title: title.trim(),
            fileId: selectedFileId,
            academic_stage: academicStage || null,
            specialty: specialty || null,
            goal: goal || null,
            instruction: instruction.trim() || null,
        };

        try {
            setSubmitting(true);
            setErrorMessage(null);

            // Trigger rendering (non-blocking, backend handles asynchronously)
            try {
                await prepareFile(selectedFileId);
            } catch (prepareErr) {
                // Continue even if prepare-file fails - generator will handle it
                console.warn("Prepare file warning:", prepareErr);
            }

            // Call POST /ai/summaries/generate (atomic operation)
            const result = await apiSummaries.generateSummary(payload);
            
            if (result?.jobId) {
                onCreated({ jobId: result.jobId, title: title.trim(), file_name: selectedFileName });
                onClose();
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Summary generation error:", err);
            
            // Fail loudly if route is wrong
            if (err.code === "ROUTE_NOT_FOUND" || err.status === 404) {
                const errorMsg = err.message || "Summary generation endpoint not found. Please check backend configuration.";
                alert(`❌ Error: ${errorMsg}`);
                setErrorMessage(errorMsg);
            } else if (err.code === "FILE_NOT_READY" || err.message?.includes("Preparing content")) {
                setErrorMessage(err.message || "Preparing content. This usually takes a few seconds.");
            } else {
                const errorMsg = err.response?.data?.error || err.message || "Summary generation failed.";
                alert(`❌ Error: ${errorMsg}`);
                setErrorMessage(errorMsg);
            }
            setSubmitting(false);
        }
    }

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!open) {
            setErrorMessage(null);
        }
    }, [open]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-void border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Generate Summary</h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Title */}
                <div className="mb-4">
                    <label className="text-sm text-muted">Title</label>
                    <input
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-teal outline-none"
                        placeholder="e.g., Cardiology Block Summary"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Preset Tags */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <PremiumDropdown
                        label="Academic Stage"
                        value={academicStage}
                        setValue={setAcademicStage}
                        options={[
                            { value: "1st_year", label: "1st Year" },
                            { value: "2nd_year", label: "2nd Year" },
                            { value: "3rd_year", label: "3rd Year" },
                            { value: "4th_year", label: "4th Year" },
                            { value: "5th_year", label: "5th Year" },
                            { value: "6th_year", label: "6th Year" },
                            { value: "internship", label: "Internship" },
                            { value: "residency", label: "Residency" },
                        ]}
                    />

                    <PremiumDropdown
                        label="Specialty"
                        value={specialty}
                        setValue={setSpecialty}
                        options={[
                            { value: "", label: "None" },
                            { value: "general_surgery", label: "General Surgery" },
                            { value: "internal_medicine", label: "Internal Medicine" },
                            { value: "pediatrics", label: "Pediatrics" },
                            { value: "obstetrics_gynecology", label: "OB/GYN" },
                            { value: "psychiatry", label: "Psychiatry" },
                            { value: "emergency", label: "Emergency Medicine" },
                            { value: "radiology", label: "Radiology" },
                            { value: "pathology", label: "Pathology" },
                        ]}
                    />

                    <PremiumDropdown
                        label="Goal"
                        value={goal}
                        setValue={setGoal}
                        options={[
                            { value: "exam", label: "Exam" },
                            { value: "understanding", label: "Understanding" },
                            { value: "revision", label: "Revision" },
                        ]}
                    />
                </div>

                {/* Instruction */}
                <div className="mb-4">
                    <label className="text-sm text-muted">
                        Optional Instruction (max 200 chars)
                    </label>
                    <textarea
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-teal outline-none resize-none"
                        placeholder="e.g., Focus on high-yield exam points and common traps"
                        value={instruction}
                        onChange={(e) => {
                            if (e.target.value.length <= 200) {
                                setInstruction(e.target.value);
                            }
                        }}
                        rows={3}
                        maxLength={200}
                    />
                    <div className="text-xs text-muted mt-1 text-right">
                        {instruction.length}/200
                    </div>
                </div>

                {/* FILE PICKER */}
                {!presetFileId ? (
                    <>
                        <label className="text-sm text-muted">Source File</label>
                        <div className="border border-white/10 rounded-xl p-4 mt-1 max-h-64 overflow-y-auto bg-black/20">
                            {loadingTree ? (
                                <div className="text-sm text-muted">Loading files…</div>
                            ) : tree.length === 0 ? (
                                <div className="text-sm text-muted opacity-50">
                                    No files found in your library.
                                </div>
                            ) : (
                                tree.map((n) => renderNode(n))
                            )}
                        </div>
                        {selectedFileId && (
                            <div className="mt-2">
                                <p className="text-xs text-muted">
                                    Selected: {selectedFileName}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                        <p className="text-sm text-muted">
                            File: <span className="text-white">{selectedFileName || "Loading..."}</span>
                        </p>
                        <p className="text-xs text-muted mt-1">
                            File is locked for this summary.
                        </p>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-sm text-muted">{errorMessage}</p>
                    </div>
                )}
                
                {submitting && (
                    <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-sm text-muted">Generating summary…</p>
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
                        disabled={submitting || !title.trim() || !selectedFileId}
                        onClick={handleSubmit}
                    >
                        {submitting ? "Generating…" : "Generate"}
                    </button>
                </div>
            </div>
        </div>
    );
}

