// src/modules/summaries/SummaryViewer.jsx
import React, { useState, useRef, useEffect } from "react";
import {
    ArrowLeft,
    Send,
    Sparkles,
    Edit2,
    Trash2,
    Download,
    Copy,
    MoreHorizontal,
    Brain,
    Stethoscope,
    AlertTriangle,
    BookOpen,
    List,
} from "lucide-react";
import { generateImportCode } from "./utils/summaryCode";
import { apiSummaries } from "./apiSummaries";
import {
    sendMessageToTutor,
    createNewSession,
    getSessionMessages,
} from "../Tutor/apiTutor";
import MessageBubble from "../Tutor/MessageBubble";

export default function SummaryViewer({ summaryId, goBack, onRename, onDelete }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [showExportCode, setShowExportCode] = useState(false);
    const [importCode, setImportCode] = useState(null);

    // Chat state
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);
    const messagesInitializedRef = useRef(false);

    // Text selection state
    const [selectedText, setSelectedText] = useState(null);
    const [selectionBubble, setSelectionBubble] = useState(null);
    const selectionRef = useRef(null);

    // Load summary - enforce canonical schema
    useEffect(() => {
        if (!summaryId) return;

        (async () => {
            try {
                setLoading(true);
                const data = await apiSummaries.getSummary(summaryId);
                
                // Enforce required fields - fail clearly if missing
                if (!data) {
                    setError("Summary data is missing");
                    setLoading(false);
                    return;
                }
                
                if (!data.title) {
                    setError("Summary is missing required field: title");
                    setLoading(false);
                    return;
                }
                
                setSummary(data);
                setRenameValue(data.title);
            } catch (err) {
                console.error("Failed to load summary:", err);
                setError("Failed to load summary");
            } finally {
                setLoading(false);
            }
        })();
    }, [summaryId]);

    // Initialize chat session
    useEffect(() => {
        if (!summary || messagesInitializedRef.current) return;

        (async () => {
            const stored = localStorage.getItem(
                `synapse_summary_session_${summary.id}`
            );
            if (stored) {
                setSessionId(stored);
                try {
                    const msgs = await getSessionMessages(stored);
                    setMessages(msgs || []);
                } catch (err) {
                    console.error("Failed to load messages:", err);
                }
            }
            messagesInitializedRef.current = true;
        })();
    }, [summary]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle text selection
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                setSelectedText(null);
                setSelectionBubble(null);
                return;
            }

            const range = selection.getRangeAt(0);
            const text = range.toString().trim();

            if (!text || text.length < 3) {
                setSelectedText(null);
                setSelectionBubble(null);
                return;
            }

            // Get bounding rect for bubble positioning
            const rect = range.getBoundingClientRect();
            setSelectedText(text);
            setSelectionBubble({
                top: rect.top - 40,
                left: rect.left + rect.width / 2,
            });
        };

        const handleClick = (e) => {
            // Close bubble if clicking outside
            if (selectionRef.current && !selectionRef.current.contains(e.target)) {
                const selection = window.getSelection();
                if (selection) selection.removeAllRanges();
                setSelectedText(null);
                setSelectionBubble(null);
            }
        };

        document.addEventListener("selectionchange", handleSelection);
        document.addEventListener("mousedown", handleClick);

        return () => {
            document.removeEventListener("selectionchange", handleSelection);
            document.removeEventListener("mousedown", handleClick);
        };
    }, []);

    const handleAskAstra = async () => {
        if (!selectedText) return;

        // Clear selection
        window.getSelection()?.removeAllRanges();
        setSelectedText(null);
        setSelectionBubble(null);

        // Open side panel if closed (it's always visible in this layout)
        // Preload context and send message
        const question = `About this selection: "${selectedText}"`;
        setChatInput(question);

        // Auto-send the message
        setTimeout(() => {
            handleChatSend(question);
        }, 100);
    };

    const handleChatSend = async (prefilledMessage = null) => {
        const msg = prefilledMessage || chatInput;
        if (!msg.trim()) return;

        if (!prefilledMessage) setChatInput("");

        const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const userMsg = { id: userMsgId, role: "user", content: msg };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        try {
            let currentSessionId = sessionId;

            if (!currentSessionId) {
                const session = await createNewSession(
                    `Summary: ${summary?.title || "Untitled"}`
                );
                currentSessionId = session.id;
                setSessionId(currentSessionId);

                localStorage.setItem(
                    `synapse_summary_session_${summary.id}`,
                    String(currentSessionId)
                );
            }

            // Find the section containing selected text for context
            let sectionContext = null;
            if (selectedText && summary?.sections) {
                for (const section of summary.sections) {
                    if (
                        section.content &&
                        section.content.includes(selectedText.substring(0, 50))
                    ) {
                        sectionContext = section.heading || section.title;
                        break;
                    }
                }
            }

            const contextMessage = selectedText
                ? `[Summary: ${summary?.title}${sectionContext ? ` | Section: ${sectionContext}` : ""}${summary?.file_id ? ` | File ID: ${summary.file_id}` : ""}] ${msg}`
                : `[Summary: ${summary?.title}${summary?.file_id ? ` | File ID: ${summary.file_id}` : ""}] ${msg}`;

            const res = await sendMessageToTutor({
                sessionId: currentSessionId,
                message: contextMessage,
                fileId: summary?.file_id || null,
                resourceSelection: {
                    scope: "selected",
                    file_ids: summary?.file_id ? [summary.file_id] : [],
                    folder_ids: [],
                    include_books: true,
                },
            });

            const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const assistantMsg = {
                id: assistantMsgId,
                role: "assistant",
                content: res.text || "",
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err) {
            console.error("Chat error:", err);
            const errorMsg = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: "Sorry, I was unable to answer. Please try again.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    // Helper to get icon for section heading
    const getSectionIcon = (heading) => {
        const lowerHeading = heading.toLowerCase();
        if (lowerHeading.includes('mechanism') || lowerHeading.includes('pathophysiology') || lowerHeading.includes('pathology')) {
            return <Brain size={18} className="text-teal" />;
        }
        if (lowerHeading.includes('clinical') || lowerHeading.includes('presentation') || lowerHeading.includes('symptoms') || lowerHeading.includes('signs')) {
            return <Stethoscope size={18} className="text-teal" />;
        }
        if (lowerHeading.includes('red flag') || lowerHeading.includes('warning') || lowerHeading.includes('complication') || lowerHeading.includes('risk')) {
            return <AlertTriangle size={18} className="text-red-400" />;
        }
        return null;
    };

    const renderContent = () => {
        if (!summary) return null;

        return (
            <div className="prose prose-invert max-w-none" style={{ userSelect: 'text' }}>
                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-3">
                    {summary.title}
                </h1>

                {/* Context Note */}
                {(summary.academic_stage ||
                    summary.specialty ||
                    summary.goal) && (
                    <div className="text-sm text-muted mb-8 px-1">
                        {[
                            summary.academic_stage,
                            summary.specialty,
                            summary.goal,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </div>
                )}

                {/* Sections - enforce canonical schema */}
                {summary.sections && summary.sections.length > 0 && (
                    <div className="space-y-6">
                        {summary.sections.map((section, idx) => {
                            // Enforce required fields
                            if (!section.heading) {
                                console.error(`Section ${idx} missing required field: heading`);
                                return null;
                            }
                            if (section.content === undefined || section.content === null) {
                                console.error(`Section ${idx} missing required field: content`);
                                return null;
                            }
                            
                            const sectionIcon = getSectionIcon(section.heading);
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="rounded-2xl border border-white/10 bg-black/40 p-6 hover:border-white/15 transition-colors"
                                    style={{ userSelect: 'text' }}
                                >
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        {sectionIcon}
                                        <span>{section.heading}</span>
                                    </h2>
                                    <div
                                        className="text-gray-300 leading-loose text-[15px] summary-content"
                                        style={{ userSelect: 'text' }}
                                        dangerouslySetInnerHTML={{
                                            __html: section.content,
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tables - enforce canonical schema */}
                {summary.tables && summary.tables.length > 0 && (
                    <div className="mt-8 space-y-6">
                        {summary.tables.map((table, idx) => {
                            // Enforce required fields
                            if (!table.headers || !Array.isArray(table.headers)) {
                                console.error(`Table ${idx} missing required field: headers`);
                                return null;
                            }
                            if (!table.rows || !Array.isArray(table.rows)) {
                                console.error(`Table ${idx} missing required field: rows`);
                                return null;
                            }
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="rounded-2xl border border-white/10 bg-black/40 p-6 overflow-x-auto"
                                    style={{ userSelect: 'text' }}
                                >
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-white/5">
                                                {table.headers.map((header, hIdx) => (
                                                    <th
                                                        key={hIdx}
                                                        className="border border-white/10 px-4 py-3 text-left text-sm font-bold text-white"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {table.rows.map((row, rIdx) => (
                                                <tr
                                                    key={rIdx}
                                                    className="hover:bg-white/5 transition-colors"
                                                >
                                                    {row.map((cell, cIdx) => (
                                                        <td
                                                            key={cIdx}
                                                            className="border border-white/10 px-4 py-3 text-sm text-gray-300 leading-relaxed"
                                                        >
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Key Takeaways - enforce canonical schema */}
                {summary.key_takeaways && summary.key_takeaways.length > 0 && (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6" style={{ userSelect: 'text' }}>
                        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                            <List size={18} className="text-teal" />
                            <span>Key Takeaways</span>
                        </h2>
                        <ul className="space-y-4">
                            {summary.key_takeaways.map((takeaway, idx) => {
                                // Enforce required field
                                if (takeaway === undefined || takeaway === null || takeaway === "") {
                                    console.error(`Key takeaway ${idx} is missing or empty`);
                                    return null;
                                }
                                
                                return (
                                    <li
                                        key={idx}
                                        className="text-gray-300 flex items-start gap-3 leading-loose text-[15px]"
                                    >
                                        <span className="text-teal mt-1.5 font-bold flex-shrink-0">•</span>
                                        <span className="flex-1">{takeaway}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* References - enforce canonical schema */}
                {summary.references && summary.references.length > 0 && (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6" style={{ userSelect: 'text' }}>
                        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                            <BookOpen size={18} className="text-teal" />
                            <span>References</span>
                        </h2>
                        <ul className="space-y-3">
                            {summary.references.map((ref, idx) => {
                                // Enforce required field - assume canonical structure
                                if (!ref || (typeof ref === 'object' && !ref.text)) {
                                    console.error(`Reference ${idx} missing required field: text`);
                                    return null;
                                }
                                
                                const refText = typeof ref === 'string' ? ref : ref.text;
                                const refPage = typeof ref === 'object' ? ref.page : null;
                                
                                return (
                                    <li key={idx} className="text-sm text-muted leading-relaxed">
                                        {refPage && <span className="text-teal/70 font-medium">Page {refPage}: </span>}
                                        <span>{refText}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted">Loading summary…</div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || "Summary not found"}</p>
                    <button onClick={goBack} className="btn btn-secondary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .summary-content p {
                    margin-bottom: 1rem;
                    line-height: 1.75;
                }
                .summary-content p:last-child {
                    margin-bottom: 0;
                }
                .summary-content ul, .summary-content ol {
                    margin-top: 0.75rem;
                    margin-bottom: 1rem;
                    padding-left: 1.5rem;
                }
                .summary-content li {
                    margin-bottom: 0.5rem;
                    line-height: 1.75;
                }
                .summary-content li:last-child {
                    margin-bottom: 0;
                }
                .summary-content h3, .summary-content h4 {
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    font-weight: 600;
                    color: #F5F5F7;
                }
                .summary-content h3 {
                    font-size: 1.125rem;
                }
                .summary-content h4 {
                    font-size: 1rem;
                }
                .summary-content strong {
                    font-weight: 600;
                    color: #F5F5F7;
                }
                .summary-content em {
                    font-style: italic;
                }
                .summary-content code {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    font-family: 'Monaco', 'Courier New', monospace;
                }
            `}</style>
            <div className="h-full w-full flex bg-void">
            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center gap-4">
                    <button
                        onClick={goBack}
                        className="p-2 hover:bg-white/5 rounded-lg transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-white">
                            {summary.title}
                        </h2>
                        {summary.file_name && (
                            <p className="text-xs text-muted">
                                From: {summary.file_name}
                            </p>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-white/5 rounded-lg transition"
                        >
                            <MoreHorizontal size={20} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-10 w-48 bg-void border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="p-1 space-y-0.5">
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            setShowRename(true);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                    >
                                        <Edit2 size={14} /> Rename
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            const code = generateImportCode();
                                            setImportCode(code);
                                            setShowExportCode(true);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition"
                                    >
                                        <Copy size={14} /> Generate Import Code
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            alert("PDF export with Synapse template coming soon");
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-teal hover:bg-teal/10 rounded-lg transition opacity-50 cursor-not-allowed"
                                        title="PDF export with Synapse template coming soon"
                                    >
                                        <Download size={14} /> Export as PDF
                                    </button>
                                    <div className="h-px bg-white/10 my-1" />
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            if (confirm("Delete this summary? This action cannot be undone.")) {
                                                onDelete && onDelete(summary.id);
                                                goBack();
                                            }
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8" style={{ userSelect: 'text' }}>
                    <div className="max-w-4xl mx-auto">{renderContent()}</div>
                </div>
            </div>

            {/* RIGHT SIDEBAR - Ask Astra */}
            <div className="w-[400px] bg-[#1a1d24] flex flex-col border-l border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-teal" />
                        <h3 className="font-bold text-lg">Ask Astra</h3>
                    </div>
                    <p className="text-sm text-muted">
                        Select text in the summary to ask questions
                    </p>
                </div>

                {/* Chat */}
                <div className="flex-1 flex flex-col bg-[#0f1115] overflow-hidden">
                    <div className="p-3 border-b border-white/5 text-xs text-muted uppercase tracking-wider">
                        <span>
                            Chat • <span className="text-white">{summary.title}</span>
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {isLoading && !messages.length && (
                            <div className="text-xs text-muted">Loading chat…</div>
                        )}

                        {isTyping && (
                            <div className="text-xs text-muted">Astra is typing…</div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-3 border-t border-white/5 bg-[#1a1d24]">
                        <div className="flex items-center gap-2 bg-[#0f1115] border border-white/10 px-3 py-2 rounded-lg">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleChatSend()
                                }
                                placeholder="Ask Astra about this summary…"
                                className="flex-1 bg-transparent text-sm text-white outline-none"
                            />
                            <button
                                onClick={() => handleChatSend()}
                                disabled={!chatInput.trim() || isTyping}
                                className="p-1.5 bg-teal text-black rounded hover:bg-teal-neon disabled:opacity-40"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Bubble */}
            {selectedText && selectionBubble && (
                <div
                    ref={selectionRef}
                    className="fixed z-50 bg-teal text-black px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-teal-neon transition"
                    style={{
                        top: `${selectionBubble.top}px`,
                        left: `${selectionBubble.left}px`,
                        transform: "translateX(-50%)",
                    }}
                    onClick={handleAskAstra}
                >
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles size={14} />
                        Ask Astra
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {showRename && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Rename Summary
                        </h3>
                        <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white mb-6"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (renameValue.trim() && onRename) {
                                        onRename(summary.id, renameValue.trim());
                                        setSummary({ ...summary, title: renameValue.trim() });
                                        setShowRename(false);
                                    }
                                }
                                if (e.key === "Escape") {
                                    setShowRename(false);
                                }
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowRename(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (renameValue.trim() && onRename) {
                                        onRename(summary.id, renameValue.trim());
                                        setSummary({ ...summary, title: renameValue.trim() });
                                        setShowRename(false);
                                    }
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Code Modal */}
            {showExportCode && importCode && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Import Code Generated
                        </h3>
                        <p className="text-sm text-muted mb-4">
                            Share this code to import this summary. This code works only inside Synapse.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                            <div className="text-2xl font-mono font-bold text-teal text-center">
                                {importCode}
                            </div>
                        </div>
                        <button
                            className="w-full btn btn-primary mb-2"
                            onClick={() => {
                                navigator.clipboard.writeText(importCode);
                                alert("Code copied to clipboard!");
                            }}
                        >
                            <Copy size={16} className="mr-2" />
                            Copy Code
                        </button>
                        <button
                            className="w-full btn btn-secondary"
                            onClick={() => {
                                setShowExportCode(false);
                                setImportCode(null);
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

