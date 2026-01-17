// src/modules/summaries/SummaryViewer.jsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
    ChevronRight,
    ChevronLeft,
} from "lucide-react";
import { apiSummaries } from "./apiSummaries";
import {
    sendMessageToTutor,
    sendSummaryMessageToTutor,
    createNewSession,
    getSessionMessages,
} from "../Tutor/apiTutor";
import MessageBubble from "../Tutor/MessageBubble";
import { useDemo } from "../demo/DemoContext";
import DemoSummaryChat from "./DemoSummaryChat";

export default function SummaryViewer({ summaryId, goBack, onRename, onDelete }) {
    const { isDemo, currentStep } = useDemo() || {};
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [showExportCode, setShowExportCode] = useState(false);
    const [importCode, setImportCode] = useState(null);
    const [copiedFeedback, setCopiedFeedback] = useState(false);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [codeError, setCodeError] = useState(null);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

    // Chat state
    // Initialize sessionId ONCE from localStorage (single source of truth)
    // Note: summary is null on initial render, so we initialize sessionId as null
    // and sync it once summary loads (see useEffect below)
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);
    const messagesInitializedRef = useRef(false);

    // Text selection state
    const [selectedText, setSelectedText] = useState("");
    const [selectionBubble, setSelectionBubble] = useState(null);
    const selectionRef = useRef(null);

    // Normalize summary data - ensures all nested fields are safe
    const normalizeSummary = (rawSummary) => {
        if (!rawSummary) return null;
        
        // Log the raw summary shape for debugging
        console.log("[SUMMARY_VIEWER] Raw summary data:", {
            id: rawSummary.id,
            title: rawSummary.title,
            hasSections: !!rawSummary.sections,
            sectionsIsArray: Array.isArray(rawSummary.sections),
            sectionsLength: Array.isArray(rawSummary.sections) ? rawSummary.sections.length : null,
            hasTables: !!rawSummary.tables,
            tablesIsArray: Array.isArray(rawSummary.tables),
            hasKeyTakeaways: !!rawSummary.key_takeaways,
            keyTakeawaysIsArray: Array.isArray(rawSummary.key_takeaways),
            hasReferences: !!rawSummary.references,
            referencesIsArray: Array.isArray(rawSummary.references),
            fileId: rawSummary.file_id,
            fileName: rawSummary.file_name,
            fullObject: rawSummary,
        });
        
        // Create normalized, safe summary object
        const normalized = {
            id: rawSummary.id ?? null,
            title: rawSummary.title ?? "Untitled summary",
            academic_stage: rawSummary.academic_stage ?? null,
            specialty: rawSummary.specialty ?? null,
            goal: rawSummary.goal ?? null,
            file_id: rawSummary.file_id ?? null,
            file_name: rawSummary.file_name ?? null,
            created_at: rawSummary.created_at ?? null,
            updated_at: rawSummary.updated_at ?? null,
            // Normalize arrays - ensure they're always arrays
            sections: Array.isArray(rawSummary.sections) ? rawSummary.sections : [],
            tables: Array.isArray(rawSummary.tables) ? rawSummary.tables : [],
            key_takeaways: Array.isArray(rawSummary.key_takeaways) ? rawSummary.key_takeaways : [],
            references: Array.isArray(rawSummary.references) ? rawSummary.references : [],
        };
        
        // Normalize nested objects within arrays
        normalized.sections = normalized.sections.map((section, idx) => ({
            heading: section?.heading ?? `Section ${idx + 1}`,
            content: section?.content ?? "",
        }));
        
        normalized.tables = normalized.tables.map((table, idx) => ({
            headers: Array.isArray(table?.headers) ? table.headers : [],
            rows: Array.isArray(table?.rows) ? table.rows : [],
        }));
        
        normalized.key_takeaways = normalized.key_takeaways.filter(takeaway => 
            takeaway !== null && takeaway !== undefined && takeaway !== ""
        );
        
        normalized.references = normalized.references.map((ref, idx) => {
            if (typeof ref === 'string') {
                return { text: ref, page: null };
            }
            return {
                text: ref?.text ?? `Reference ${idx + 1}`,
                page: ref?.page ?? null,
            };
        });
        
        console.log("[SUMMARY_VIEWER] Normalized summary:", {
            id: normalized.id,
            title: normalized.title,
            sectionsCount: normalized.sections.length,
            tablesCount: normalized.tables.length,
            keyTakeawaysCount: normalized.key_takeaways.length,
            referencesCount: normalized.references.length,
        });
        
        return normalized;
    };

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
                
                if (!data.id) {
                    setError("Summary is missing required field: id");
                    setLoading(false);
                    return;
                }
                
                if (!data.title) {
                    setError("Summary is missing required field: title");
                    setLoading(false);
                    return;
                }
                
                // Normalize summary before setting it
                const normalized = normalizeSummary(data);
                if (!normalized) {
                    setError("Failed to normalize summary data");
                    setLoading(false);
                    return;
                }
                
                setSummary(normalized);
                setRenameValue(normalized.title);
            } catch (err) {
                console.error("Failed to load summary:", err);
                setError("Failed to load summary");
            } finally {
                setLoading(false);
            }
        })();
    }, [summaryId]);

    // Stable derived variables for dependency arrays (prevents React error #310)
    // These must be computed before any hooks to ensure stable references
    const currentSummaryId = summary ? summary.id : null;
    
    // Sync sessionId with localStorage
    useEffect(() => {
        if (!currentSummaryId) return;

        const key = `synapse_summary_session_${currentSummaryId}`;
        const stored = localStorage.getItem(key);

        // Sync state with localStorage (single source of truth)
        if (stored && stored !== sessionId) {
            setSessionId(stored);
        } else if (!stored && sessionId) {
            // If localStorage is empty but state has value, persist it
            localStorage.setItem(key, sessionId);
        }
    }, [currentSummaryId, sessionId]);

    // Load messages ONCE (cold start only)
    // HARD RULE: GET only on cold start (no live messages)
    useEffect(() => {
        if (!currentSummaryId || !sessionId || messagesInitializedRef.current) return;

        const loadHistory = async () => {
            // Gate: Only run GET if no live messages exist
            if (messages.length > 0) {
                console.log("[TUTOR_GET_BLOCKED] Skipping GET - live messages exist in SummaryViewer", { 
                    messageCount: messages.length,
                    summaryId: currentSummaryId,
                    sessionId: sessionId 
                });
                messagesInitializedRef.current = true;
                return;
            }

            // Trace: Identify what triggered this GET (should only be cold start)
            console.trace("[TUTOR_GET_TRIGGERED] SummaryViewer cold start - no live messages");

            try {
                console.log("[TUTOR_SESSION][GET]", sessionId, "for summary:", currentSummaryId);
                const msgs = await getSessionMessages(sessionId);
                
                // Non-destructive rehydration
                setMessages(prev => {
                    const fetchedMessages = msgs && Array.isArray(msgs) && msgs.length > 0
                        ? msgs
                        : null;
                    
                    if (fetchedMessages) {
                        console.log("[TUTOR_FRONTEND] Rehydrated messages from GET in SummaryViewer", { count: fetchedMessages.length, summaryId: currentSummaryId });
                        return fetchedMessages;
                    }
                    
                    return prev || [];
                });
            } catch (err) {
                console.error("[TUTOR_FRONTEND] Failed to load messages:", err);
            }
            
            messagesInitializedRef.current = true;
        };

        loadHistory();
    }, [currentSummaryId, sessionId, messages.length]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Close bubble when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            // Don't close if clicking the bubble itself
            if (selectionRef.current && selectionRef.current.contains(e.target)) {
                return;
            }

            // Close bubble if clicking outside
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                // Only clear if selection is empty or very small
                const text = selection.toString().trim();
                if (text.length < 3) {
                    selection.removeAllRanges();
                    setSelectedText("");
                    setSelectionBubble(null);
                }
            } else {
                setSelectedText("");
                setSelectionBubble(null);
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, []);
    
    // HARD RENDER GUARD - Must be before ANY summary property access in the main return
    // This prevents crashes when summary is null during initial render or after errors
    if (!summaryId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted">No summary selected</div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted">Loading summary…</div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
                <div className="text-red-400">{error}</div>
                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        setError(null);
                        if (summaryId) {
                            setLoading(true);
                            apiSummaries.getSummary(summaryId)
                                .then((data) => {
                                    if (!data) {
                                        setError("Summary data is missing");
                                        return;
                                    }
                                    if (!data.id) {
                                        setError("Summary is missing required field: id");
                                        return;
                                    }
                                    if (!data.title) {
                                        setError("Summary is missing required field: title");
                                        return;
                                    }
                                    
                                    // Normalize summary before setting it
                                    const normalized = normalizeSummary(data);
                                    if (!normalized) {
                                        setError("Failed to normalize summary data");
                                        return;
                                    }
                                    
                                    setSummary(normalized);
                                    setRenameValue(normalized.title);
                                    setError(null);
                                })
                                .catch((err) => {
                                    console.error("Failed to load summary:", err);
                                    setError("Failed to load summary");
                                })
                                .finally(() => setLoading(false));
                        }
                    }}
                >
                    Retry
                </button>
                {goBack && (
                    <button
                        className="btn btn-primary"
                        onClick={goBack}
                    >
                        Go Back
                    </button>
                )}
            </div>
        );
    }
    
    if (!summary) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted">No summary data available</div>
                {goBack && (
                    <button
                        className="btn btn-primary ml-4"
                        onClick={goBack}
                    >
                        Go Back
                    </button>
                )}
            </div>
        );
    }


    // Handle text selection - capture on mouseup to preserve selection
    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setSelectedText("");
            setSelectionBubble(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const text = selection.toString().trim();

        if (!text || text.length < 3) {
            setSelectedText("");
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

    const handleAskAstra = async () => {
        // Guard against missing summary
        if (!summary?.id) {
            console.error("Cannot send message: summary is not loaded");
            return;
        }

        // Demo Mode: Use DemoSummaryChat handler
        // In Step 6, allow triggering even without text selection
        if (isDemo) {
            const textToSend = selectedText?.trim() || "Selected text from summary";
            if (typeof window !== "undefined" && window.demoSummaryChatSend) {
                window.demoSummaryChatSend(textToSend);
            }
            // Clear selection and bubble
            window.getSelection()?.removeAllRanges();
            setSelectionBubble(null);
            return;
        }

        // Real Mode: Guard against empty selection
        if (!selectedText || selectedText.trim().length < 3) return;

        const textToSend = selectedText.trim();

        // Clear selection and bubble
        window.getSelection()?.removeAllRanges();
        setSelectionBubble(null);

        // Real Mode: Create structured payload
        const payload = {
            role: "user",
            type: "selection",
            source: "summary",
            summaryId: summary.id, // REQUIRED - now guaranteed to exist
            title: summary.title || null, // OPTIONAL but recommended
            content: textToSend, // REQUIRED - the selected text
            createdAt: new Date().toISOString(), // REQUIRED
        };

        // Update UI preview text (visual only)
        const previewText = `About this selection: "${textToSend.slice(0, 60)}${textToSend.length > 60 ? '...' : ''}"`;
        setChatInput(previewText);

        // Auto-send the message with structured payload
        setTimeout(() => {
            handleChatSend(null, payload);
        }, 100);
    };

    const handleChatSend = async (prefilledMessage = null, structuredPayload = null) => {
        // If structured payload is provided (from selection), use it
        if (structuredPayload) {
            const msg = prefilledMessage || chatInput;
            if (!msg.trim()) return;

            setChatInput("");

            const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const userMsg = { 
                id: userMsgId, 
                role: "user", 
                content: msg 
            };

            setMessages((prev) => [...prev, userMsg]);
            setIsTyping(true);

            try {
                // Use sessionId from state (single source of truth)
                // If null, create new session (only happens on first message)
                let currentSessionId = sessionId;

                if (!currentSessionId) {
                    if (!summary?.id) {
                        throw new Error("Cannot create session: summary is not loaded");
                    }
                    
                    const session = await createNewSession(
                        `Summary: ${summary?.title || "Untitled"}`
                    );
                    currentSessionId = session.id;
                    setSessionId(currentSessionId);

                    // Persist to localStorage immediately
                    const key = `synapse_summary_session_${summary.id}`;
                    localStorage.setItem(key, String(currentSessionId));
                    console.log("[TUTOR_SESSION][CREATED]", currentSessionId, "for summary:", summary.id);
                }

                // Diagnostic log: Confirm sessionId for POST request
                if (summary?.id) {
                    console.log("[TUTOR_SESSION][POST]", currentSessionId, "for summary:", summary.id);
                }

                // Find the section containing selected text for context
                let sectionContext = null;
                if (structuredPayload.content && Array.isArray(summary?.sections)) {
                    const selectionText = structuredPayload.content.substring(0, 50);
                    for (const section of summary.sections) {
                        if (
                            section?.content &&
                            section.content.includes(selectionText)
                        ) {
                            sectionContext = section?.heading || section?.title || null;
                            break;
                        }
                    }
                }

                // Build context message
                const contextMessage = `[Summary: ${summary?.title}${sectionContext ? ` | Section: ${sectionContext}` : ""}${summary?.file_id ? ` | File ID: ${summary.file_id}` : ""}] About this selection: "${structuredPayload.content}"`;

                // Send structured payload to Astra
                const res = await sendSummaryMessageToTutor({
                    sessionId: currentSessionId,
                    message: contextMessage,
                    summaryId: structuredPayload.summaryId,
                    summaryTitle: structuredPayload.title,
                    selectionText: structuredPayload.content,
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
                    content: err.message || "Sorry, I was unable to answer. Please try again.",
                };
                setMessages((prev) => [...prev, errorMsg]);
            } finally {
                setIsTyping(false);
                setSelectedText(""); // Clear selection after sending
            }
            return;
        }

        // Regular chat message (not from selection)
        const msg = prefilledMessage || chatInput;
        if (!msg.trim()) return;
        
        // Guard against missing summary
        if (!summary?.id) {
            console.error("Cannot send message: summary is not loaded");
            return;
        }

        if (!prefilledMessage) setChatInput("");

        const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const userMsg = { id: userMsgId, role: "user", content: msg };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        try {
            let currentSessionId = sessionId;

            if (!currentSessionId) {
                const session = await createNewSession(
                    `Summary: ${summary.title || "Untitled"}`
                );
                currentSessionId = session.id;
                setSessionId(currentSessionId);

                const key = `synapse_summary_session_${summary.id}`;
                localStorage.setItem(key, String(currentSessionId));
            }

            // For regular messages, use a simpler context
            const contextMessage = `[Summary: ${summary.title}${summary.file_id ? ` | File ID: ${summary.file_id}` : ""}] ${msg}`;

            // For regular messages, we still need to use a compatible endpoint
            // Since sendMessageToTutor requires fileId and page, we'll use sendSummaryMessageToTutor
            // but without the selection-specific fields
            const res = await sendSummaryMessageToTutor({
                sessionId: currentSessionId,
                message: contextMessage,
                summaryId: summary.id,
                summaryTitle: summary.title || null,
                selectionText: null, // Not a selection
                fileId: summary.file_id || null,
                resourceSelection: {
                    scope: "all",
                    file_ids: summary.file_id ? [summary.file_id] : [],
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
                content: err.message || "Sorry, I was unable to answer. Please try again.",
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

    // Parse and structure section content
    const parseSectionContent = (htmlContent) => {
        if (!htmlContent) return [];

        // Create a temporary DOM element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Extract structured content from HTML
        const extractTextFromNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.trim();
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Handle lists
                if (node.tagName === 'UL' || node.tagName === 'OL') {
                    const items = [];
                    Array.from(node.querySelectorAll('li') || []).forEach(li => {
                        const text = li.textContent.trim();
                        if (text) items.push(text);
                    });
                    return items;
                }
                // Handle paragraphs
                if (node.tagName === 'P') {
                    return node.textContent.trim();
                }
                // Recursively get text from children
                return Array.from(node.childNodes)
                    .map(extractTextFromNode)
                    .filter(Boolean)
                    .join(' ');
            }
            return '';
        };

        // Get all text nodes and elements
        const allText = [];
        const walker = document.createTreeWalker(
            tempDiv,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            null
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'UL' || node.tagName === 'OL') {
                    const items = Array.from(node.querySelectorAll('li') || [])
                        .map(li => li.textContent.trim())
                        .filter(text => text.length > 0);
                    if (items.length > 0) {
                        allText.push({ type: 'list', items });
                    }
                } else if (node.tagName === 'P') {
                    const text = node.textContent.trim();
                    if (text.length > 0) {
                        allText.push({ type: 'paragraph', text });
                    }
                }
            }
        }

        // If no structured content found, extract plain text
        if (allText.length === 0) {
            const plainText = tempDiv.textContent || tempDiv.innerText || '';
            const lines = plainText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            lines.forEach(line => {
                allText.push({ type: 'paragraph', text: line });
            });
        }

        const blocks = [];
        let currentSubHeading = null;
        let currentItems = [];
        
        // Semantic keywords for sub-headings
        const subHeadingKeywords = {
            'Definition': ['definition', 'defined as', 'refers to'],
            'Types': ['types', 'classification', 'categories', 'variants', 'forms'],
            'Causes': ['causes', 'etiology', 'risk factors', 'predisposing factors'],
            'Pathophysiology': ['pathophysiology', 'mechanism', 'pathogenesis'],
            'Clinical Features': ['clinical features', 'symptoms', 'signs', 'presentation', 'manifestations'],
            'Diagnosis': ['diagnosis', 'diagnostic', 'workup', 'investigations', 'tests'],
            'Management': ['management', 'treatment', 'therapy', 'approach', 'intervention'],
            'Complications': ['complications', 'sequelae', 'adverse effects'],
            'Prognosis': ['prognosis', 'outcome', 'prognostic factors'],
        };

        const detectSubHeading = (text) => {
            const lowerText = text.toLowerCase();
            for (const [heading, keywords] of Object.entries(subHeadingKeywords)) {
                for (const keyword of keywords) {
                    if (lowerText.includes(keyword) && text.length < 100) {
                        // Check if it's a standalone heading (not part of a sentence)
                        const before = lowerText.substring(0, lowerText.indexOf(keyword));
                        const after = lowerText.substring(lowerText.indexOf(keyword) + keyword.length);
                        if ((before.length === 0 || /[.:;]\s*$/.test(before)) && 
                            (after.length === 0 || /^\s*[:.]/.test(after))) {
                            return heading;
                        }
                    }
                }
            }
            return null;
        };

        const emphasizeKeyTerms = (text) => {
            // Escape HTML first
            const escaped = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            // Emphasize numbers, percentages, contrasts, and key medical terms
            return escaped
                .replace(/(\d+[%]?)/g, '<strong>$1</strong>')
                .replace(/(vs\.|versus|compared to|contrast)/gi, '<strong>$1</strong>')
                .replace(/(high|low|increased|decreased|elevated|reduced)\s+(\w+)/gi, '<strong>$1</strong> $2')
                .replace(/(most common|rare|uncommon|frequent|typically|usually|often)/gi, '<strong>$1</strong>');
        };

        const breakLongText = (text) => {
            // If text is too long (>100 chars), try to break it intelligently
            if (text.length > 100) {
                // Break on semicolons
                if (text.includes(';')) {
                    return text.split(';').map(s => s.trim()).filter(s => s.length > 0);
                }
                // Break on "and" if there are multiple items
                if (text.includes(' and ') && text.split(' and ').length > 2) {
                    const parts = text.split(/, and | and /);
                    if (parts.length > 2) {
                        return parts.map(p => p.trim()).filter(p => p.length > 0);
                    }
                }
                // Break on commas if there are many
                if (text.split(',').length > 3) {
                    const parts = text.split(',').map(p => p.trim()).filter(p => p.length > 10);
                    if (parts.length > 2) {
                        return parts;
                    }
                }
            }
            return [text];
        };

        // Process all text blocks
        for (const block of allText) {
            if (block.type === 'list') {
                // Add list items directly
                block.items.forEach(item => {
                    const broken = breakLongText(item);
                    broken.forEach(part => {
                        if (part.length > 0) {
                            currentItems.push({
                                text: emphasizeKeyTerms(part),
                                original: part,
                            });
                        }
                    });
                });
            } else if (block.type === 'paragraph') {
                const text = block.text;
                
                // Check if this is a sub-heading
                const detectedHeading = detectSubHeading(text);
                if (detectedHeading) {
                    // Save previous block
                    if (currentItems.length > 0) {
                        blocks.push({
                            type: 'subheading',
                            heading: currentSubHeading,
                            items: currentItems,
                        });
                        currentItems = [];
                    }
                    currentSubHeading = detectedHeading;
                    continue;
                }

                // Check if it's a bullet point (starts with dash or bullet)
                if (/^[-•*]\s/.test(text) || /^\d+[.)]\s/.test(text)) {
                    const bulletText = text.replace(/^[-•*]\s/, '').replace(/^\d+[.)]\s/, '').trim();
                    const broken = breakLongText(bulletText);
                    broken.forEach(part => {
                        if (part.length > 0) {
                            currentItems.push({
                                text: emphasizeKeyTerms(part),
                                original: part,
                            });
                        }
                    });
                } else {
                    // Regular paragraph - break if long
                    const broken = breakLongText(text);
                    broken.forEach(part => {
                        if (part.length > 0) {
                            currentItems.push({
                                text: emphasizeKeyTerms(part),
                                original: part,
                            });
                        }
                    });
                }
            }
        }

        // Add final block
        if (currentItems.length > 0) {
            blocks.push({
                type: 'subheading',
                heading: currentSubHeading,
                items: currentItems,
            });
        }

        // If no blocks were created, create a default one
        if (blocks.length === 0) {
            const fallbackText = tempDiv.textContent || '';
            const lines = fallbackText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
                const allItems = lines.map(line => ({
                    text: emphasizeKeyTerms(line),
                    original: line,
                }));
                blocks.push({
                    type: 'subheading',
                    heading: null,
                    items: allItems,
                });
            }
        }

        return blocks;
    };

    // Render structured section content
    const renderStructuredContent = (htmlContent) => {
        const blocks = parseSectionContent(htmlContent);

        if (blocks.length === 0) {
            // Fallback to original HTML if parsing fails
            return (
                <div
                    className="text-gray-300 leading-loose text-[15px] summary-content"
                    style={{ userSelect: 'text', pointerEvents: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            );
        }

        return (
            <div className="space-y-5" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                {blocks.map((block, blockIdx) => (
                    <div key={blockIdx} className="space-y-3" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                        {block.heading && (
                            <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                                {block.heading}
                            </h4>
                        )}
                        <ul className="space-y-3" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                            {block.items.map((item, itemIdx) => (
                                <li
                                    key={itemIdx}
                                    className="text-gray-300 flex items-start gap-3 leading-loose text-[15px]"
                                    style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                >
                                    <span className="text-teal mt-1.5 font-bold flex-shrink-0" style={{ userSelect: 'text', pointerEvents: 'auto' }}>•</span>
                                    <span 
                                        className="flex-1"
                                        style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                        dangerouslySetInnerHTML={{ __html: item.text }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        if (!summary) return null;

        return (
            <div className="prose prose-invert max-w-none" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-3" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
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
                {Array.isArray(summary.sections) && summary.sections.length > 0 && (
                    <div className="space-y-6">
                        {summary.sections.map((section, idx) => {
                            // Safe access - normalized summary ensures section always has heading and content
                            const safeHeading = section?.heading ?? `Section ${idx + 1}`;
                            const safeContent = section?.content ?? "";
                            
                            if (!safeContent.trim()) {
                                return null;
                            }
                            
                            const sectionIcon = getSectionIcon(safeHeading);
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="rounded-2xl border border-white/10 bg-black/40 p-6 hover:border-white/15 transition-colors"
                                    style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                >
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                                        {sectionIcon}
                                        <span style={{ userSelect: 'text', pointerEvents: 'auto' }}>{safeHeading}</span>
                                    </h2>
                                    {renderStructuredContent(safeContent)}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tables - enforce canonical schema */}
                {Array.isArray(summary.tables) && summary.tables.length > 0 && (
                    <div className="mt-8 space-y-6">
                        {summary.tables.map((table, idx) => {
                            // Safe access - normalized summary ensures table has headers and rows arrays
                            const safeHeaders = Array.isArray(table?.headers) ? table.headers : [];
                            const safeRows = Array.isArray(table?.rows) ? table.rows : [];
                            
                            if (safeHeaders.length === 0 && safeRows.length === 0) {
                                console.warn(`Table ${idx} has no headers or rows, skipping`);
                                return null;
                            }
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="rounded-2xl border border-white/10 bg-black/40 p-6 overflow-x-auto"
                                    style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                >
                                    <table className="w-full border-collapse" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                                        <thead>
                                            <tr className="bg-white/5">
                                                {safeHeaders.map((header, hIdx) => (
                                                    <th
                                                        key={hIdx}
                                                        className="border border-white/10 px-4 py-3 text-left text-sm font-bold text-white"
                                                        style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                                    >
                                                        {header ?? ""}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {safeRows.map((row, rIdx) => {
                                                const safeRow = Array.isArray(row) ? row : [];
                                                return (
                                                    <tr
                                                        key={rIdx}
                                                        className="hover:bg-white/5 transition-colors"
                                                        style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                                    >
                                                        {safeRow.map((cell, cIdx) => (
                                                            <td
                                                                key={cIdx}
                                                                className="border border-white/10 px-4 py-3 text-sm text-gray-300 leading-relaxed"
                                                                style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                                            >
                                                                {cell ?? ""}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Key Takeaways - enforce canonical schema */}
                {Array.isArray(summary.key_takeaways) && summary.key_takeaways.length > 0 && (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                            <List size={18} className="text-teal" />
                            <span style={{ userSelect: 'text', pointerEvents: 'auto' }}>Key Takeaways</span>
                        </h2>
                        <ul className="space-y-4" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
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
                                        style={{ userSelect: 'text', pointerEvents: 'auto' }}
                                    >
                                        <span className="text-teal mt-1.5 font-bold flex-shrink-0" style={{ userSelect: 'text', pointerEvents: 'auto' }}>•</span>
                                        <span className="flex-1" style={{ userSelect: 'text', pointerEvents: 'auto' }}>{takeaway}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* References - enforce canonical schema */}
                {Array.isArray(summary.references) && summary.references.length > 0 && (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                            <BookOpen size={18} className="text-teal" />
                            <span style={{ userSelect: 'text', pointerEvents: 'auto' }}>References</span>
                        </h2>
                        <ul className="space-y-3" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                            {summary.references.map((ref, idx) => {
                                // Safe access - normalized summary ensures ref is always an object with text
                                const refText = ref?.text ?? "";
                                const refPage = ref?.page ?? null;
                                
                                if (!refText.trim()) {
                                    return null;
                                }
                                
                                return (
                                    <li key={idx} className="text-sm text-muted leading-relaxed" style={{ userSelect: 'text', pointerEvents: 'auto' }}>
                                        {refPage && <span className="text-teal/70 font-medium" style={{ userSelect: 'text', pointerEvents: 'auto' }}>Page {refPage}: </span>}
                                        <span style={{ userSelect: 'text', pointerEvents: 'auto' }}>{refText}</span>
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
                /* Ensure all summary text is selectable */
                .summary-content-container,
                .summary-content-container * {
                    user-select: text;
                    -webkit-user-select: text;
                    -moz-user-select: text;
                    -ms-user-select: text;
                }
                
                .summary-content-container span,
                .summary-content-container p,
                .summary-content-container li,
                .summary-content-container td,
                .summary-content-container th,
                .summary-content-container h1,
                .summary-content-container h2,
                .summary-content-container h3,
                .summary-content-container h4 {
                    user-select: text !important;
                    pointer-events: auto !important;
                }
                
                /* Prevent selection on popup */
                .ask-astra-popup {
                    user-select: none !important;
                    pointer-events: auto !important;
                }
                
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
            <div className="h-full w-full flex bg-void" data-demo="summary-root">
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidePanelOpen(v => !v)}
                            className="p-2 hover:bg-white/5 rounded-lg transition"
                            title={isSidePanelOpen ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {isSidePanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
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
                                        onClick={async () => {
                                            setShowMenu(false);
                                            if (!summary?.id) return;
                                            
                                            setIsGeneratingCode(true);
                                            setCodeError(null);
                                            setImportCode(null);
                                            setShowExportCode(true);
                                            
                                            try {
                                                const res = await apiSummaries.shareSummary(summary.id);
                                                const code = res?.share_code || res?.code;
                                                if (!code) {
                                                    throw new Error("No share code returned from server");
                                                }
                                                setImportCode(code);
                                            } catch (err) {
                                                const errorMsg = err.response?.data?.error || 
                                                               err.response?.data?.message || 
                                                               err.message || 
                                                               "Failed to generate import code";
                                                setCodeError(errorMsg);
                                                setImportCode(null);
                                            } finally {
                                                setIsGeneratingCode(false);
                                            }
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
                                                onDelete && summary?.id && onDelete(summary.id);
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
                </div>

                {/* Content Area */}
                <div 
                    className="flex-1 overflow-y-auto p-8 summary-content-container" 
                    style={{ userSelect: 'text' }}
                    onMouseUp={handleMouseUp}
                    data-demo="summary-text"
                >
                    <div className="max-w-4xl mx-auto">{renderContent()}</div>
                </div>
            </div>

            {/* RIGHT SIDEBAR - Ask Astra */}
            {isSidePanelOpen && (
                isDemo ? (
                    <DemoSummaryChat summary={summary} />
                ) : (
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
                )
            )}

            {/* Selection Bubble */}
            {/* Force-show in demo Step 6, or show when text is selected */}
            {((isDemo && currentStep === 6) || (selectedText && selectionBubble)) && (
                <div
                    ref={selectionRef}
                    className="fixed z-50 bg-teal text-black px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-teal-neon transition ask-astra-popup"
                    style={{
                        top: isDemo && currentStep === 6 && !selectionBubble 
                            ? 'calc(50% + 100px)' // Position below center to avoid overlay
                            : `${selectionBubble?.top || 0}px`,
                        left: isDemo && currentStep === 6 && !selectionBubble
                            ? 'calc(50% - 200px)' // Position to the left of center
                            : `${selectionBubble?.left || 0}px`,
                        transform: isDemo && currentStep === 6 && !selectionBubble
                            ? "translateX(-50%)"
                            : "translateX(-50%) translateY(-50%)",
                        userSelect: 'none',
                    }}
                >
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleAskAstra}
                        className="flex items-center gap-2 text-sm font-medium w-full h-full"
                        data-demo="summary-ask-astra-bubble"
                    >
                        <Sparkles size={14} />
                        Ask Astra
                    </button>
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
                                    if (renameValue.trim() && onRename && summary?.id) {
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
                                    if (renameValue.trim() && onRename && summary?.id) {
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

            {/* Export Code Modal - Portal to document.body for viewport centering */}
            {showExportCode && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => {
                        setShowExportCode(false);
                        setImportCode(null);
                        setCopiedFeedback(false);
                        setCodeError(null);
                        setIsGeneratingCode(false);
                    }}
                >
                    <div 
                        className="w-full max-w-md mx-4 rounded-2xl bg-black border border-white/10 p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Import Code Generated
                        </h3>
                        {isGeneratingCode ? (
                            <>
                                <p className="text-sm text-muted mb-4">
                                    Generating import code...
                                </p>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex items-center justify-center">
                                    <div className="text-muted">Loading...</div>
                                </div>
                            </>
                        ) : codeError ? (
                            <>
                                <p className="text-sm text-red-400 mb-4">
                                    {codeError}
                                </p>
                            </>
                        ) : importCode ? (
                            <>
                                <p className="text-sm text-muted mb-4">
                                    Share this code to import this summary. This code works only inside Synapse.
                                </p>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                                    <div className="text-2xl font-mono font-bold text-teal text-center">
                                        {importCode}
                                    </div>
                                </div>
                            </>
                        ) : null}
                        {importCode && (
                            <button
                                className="w-full btn btn-primary mb-2 relative"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(importCode);
                                        setCopiedFeedback(true);
                                        setTimeout(() => setCopiedFeedback(false), 1500);
                                    } catch (err) {
                                        console.error("Failed to copy to clipboard:", err);
                                    }
                                }}
                            >
                                <Copy size={16} className="mr-2" />
                                {copiedFeedback ? "Copied to clipboard" : "Copy Code"}
                            </button>
                        )}
                        <button
                            className="w-full btn btn-secondary"
                            onClick={() => {
                                setShowExportCode(false);
                                setImportCode(null);
                                setCopiedFeedback(false);
                                setCodeError(null);
                                setIsGeneratingCode(false);
                            }}
                        >
                            {codeError ? "Close" : importCode ? "Close" : "Cancel"}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
        </>
    );
}

