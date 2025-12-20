// src/modules/Library/FileViewer.jsx
// -------------------------------------------------------------
// FileViewer.jsx — PNG-based PDF Viewer + Chat + Tools (FINAL PATCHED)
// -------------------------------------------------------------

import React, { useState, useRef, useEffect } from "react";
import {
    ArrowLeft,
    Sparkles,
    FileText,
    Zap,
    HelpCircle,
    Send,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import GenerateFlashcardsModal from "../flashcards/GenerateFlashcardsModal";
import GenerateMCQModal from "../mcq/GenerateMCQModal";

import { performLibraryAction } from "./apiLibrary";
import {
    sendMessageToTutor,
    createNewSession,
    getSessionMessages,
} from "../Tutor/apiTutor";
import MessageBubble from "../Tutor/MessageBubble";
import PdfJsPage from "./PdfJsPage";
import { getPdfDoc } from "./pdfCache";


const API_URL = import.meta.env.VITE_API_URL

// =====================================================================
// SUPABASE TOKEN FIX
// =====================================================================
function getSupabaseToken() {
    try {
        const key = Object.keys(localStorage).find((k) =>
            k.includes("auth-token")
        );
        if (!key) return null;

        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed?.access_token || null;
    } catch {
        return null;
    }
}

// =====================================================================
// MAIN VIEWER
// =====================================================================
const FileViewer = ({ file, onBack }) => {
    // UI
    const [activeAction, setActiveAction] = useState(null);
    const [actionResult, setActionResult] = useState(null);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [toolsCollapsed, setToolsCollapsed] = useState(true);
    const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
    const [showMCQModal, setShowMCQModal] = useState(false);

    // Chat
    const [fileSessionId, setFileSessionId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatTyping, setIsChatTyping] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Page renderer
    const [activePage, setActivePage] = useState(1);
    const [pageImageForTutor, setPageImageForTutor] = useState(null);
    const [renderedImageUrl, setRenderedImageUrl] = useState(null); // Store rendered image URL per page
    const [isRendering, setIsRendering] = useState(false);
    const [totalPages, setTotalPages] = useState(1); // PDF.js determined page count
    const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
    const pdfCanvasRef = useRef(null);
    
    // Use refs for stable tracking that doesn't reset on re-renders
    const renderAttemptedRef = useRef(new Set()); // Track render attempts per page: `${file.id}:${page}`
    const imageLoadFailedRef = useRef(new Set()); // Track image load failures: `${file.id}:${page}`
    const renderedImageUrlsRef = useRef(new Map()); // Store rendered image URLs: `${file.id}:${page}` -> URL

    const pages = file.page_contents || [];

    // =====================================================================
    // LOAD PDF TO DETERMINE PAGE COUNT (single source of truth)
    // =====================================================================
    useEffect(() => {
        const loadPageCount = async () => {
            // If no signed_url, use fallback immediately
            if (!file.signed_url) {
                const fallbackCount = pages.length || file.page_count || file.total_pages || 1;
                setTotalPages(fallbackCount);
                return;
            }

            // Check if file is likely a PDF (by mime_type or extension)
            const isLikelyPDF = file.mime_type === 'application/pdf' || 
                               (file.title && file.title.toLowerCase().endsWith('.pdf'));

            // If clearly not a PDF, use fallback
            if (file.mime_type && file.mime_type !== 'application/pdf' && !file.title?.toLowerCase().endsWith('.pdf')) {
                const fallbackCount = pages.length || file.page_count || file.total_pages || 1;
                setTotalPages(fallbackCount);
                return;
            }

            // Attempt to load as PDF to get accurate page count (uses cache)
            setIsLoadingPageCount(true);
            try {
                const pdf = await getPdfDoc(file.signed_url);
                const numPages = pdf.numPages;
                setTotalPages(numPages);
                // Note: Don't destroy - it's cached and may be reused
            } catch (err) {
                console.warn('Failed to load PDF for page count, using fallback:', err);
                // Fallback to backend data if PDF.js fails (not a PDF or load error)
                const fallbackCount = pages.length || file.page_count || file.total_pages || 1;
                setTotalPages(fallbackCount);
            } finally {
                setIsLoadingPageCount(false);
            }
        };

        loadPageCount();
    }, [file.id, file.signed_url, file.mime_type, file.title, pages.length, file.page_count, file.total_pages]);

    // Reset refs and state when file changes
    useEffect(() => {
        setActivePage(1);
        setPageImageForTutor(null);
        setRenderedImageUrl(null);
        renderAttemptedRef.current = new Set();
        imageLoadFailedRef.current = new Set();
        renderedImageUrlsRef.current = new Map();
    }, [file.id]);

    // =====================================================================
    // GET CURRENT PAGE IMAGE URL (from page_contents, no backend call)
    // =====================================================================
    const getCurrentPageImageUrl = () => {
        const pageIndex = activePage - 1;
        const currentPage = pages[pageIndex];
        return currentPage?.image_url || currentPage?.image_path || null;
    };

    // Handle page changes and determine rendering mode
    useEffect(() => {
        const pageKey = `${file.id}:${activePage}`;
        const pageIndex = activePage - 1;
        const currentPage = pages[pageIndex];
        const imageUrl = currentPage?.image_url || currentPage?.image_path || null;
        
        // Check if image has previously failed to load
        const imageFailed = imageLoadFailedRef.current.has(pageKey);
        
        // Priority 1: Use rendered PNG URL if available and not failed
        const cachedRenderedUrl = renderedImageUrlsRef.current.get(pageKey);
        if (cachedRenderedUrl && !imageFailed) {
            setRenderedImageUrl(cachedRenderedUrl);
            setPageImageForTutor(cachedRenderedUrl);
            setIsRendering(false);
            return;
        }
        
        // Priority 2: Use image_url from page_contents if available and not failed
        if (imageUrl && !imageFailed) {
            setRenderedImageUrl(null);
            setPageImageForTutor(imageUrl);
            setIsRendering(false);
            return;
        }
        
        // Priority 3: Attempt backend render once if not already attempted
        const renderKey = `${file.id}:${activePage}`;
        if (!renderAttemptedRef.current.has(renderKey) && file?.id) {
            setIsRendering(true);
            renderAttemptedRef.current.add(renderKey);

            const token = getSupabaseToken();
            const url = `${API_URL}/library/item/${file.id}/page/${activePage}/render`;

            fetch(url, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
            })
                .then(async (res) => {
                    if (!res.ok) {
                        throw new Error("PNG render failed");
                    }
                    const blob = await res.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    renderedImageUrlsRef.current.set(pageKey, objectUrl);
                    setRenderedImageUrl(objectUrl);
                    setPageImageForTutor(objectUrl);
                })
                .catch((err) => {
                    console.warn(`Backend render failed for page ${activePage}:`, err);
                    // Will fallback to PDF.js
                })
                .finally(() => {
                    setIsRendering(false);
                });
        } else {
            // Already attempted or no file ID - will use PDF.js fallback
            setRenderedImageUrl(null);
            setIsRendering(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage, file.id]);

    // Extract image from PDF.js canvas for tutor (optional optimization)
    const handlePdfRenderComplete = () => {
        if (pdfCanvasRef.current) {
            try {
                const canvas = pdfCanvasRef.current.querySelector('canvas');
                if (canvas) {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            setPageImageForTutor(url);
                        }
                    }, 'image/png', 0.9);
                }
            } catch (err) {
                console.warn('Failed to extract image from PDF.js canvas:', err);
            }
        }
    };

    // =====================================================================
    // INIT SESSION (NO AUTO-CREATE) + VALIDATE AGAINST DB
    // =====================================================================
    useEffect(() => {
        const initSession = async () => {
            const key = `synapse_file_session_${file.id}`;
            const existingSessionId = localStorage.getItem(key);

            if (!existingSessionId) {
                setFileSessionId(null);
                setChatMessages([]);
                return;
            }

            // 🔥 Validate session exists in DB
            try {
                const token = getSupabaseToken();
                if (!token) {
                    console.warn("⚠️ No token — dropping stale session");
                    localStorage.removeItem(key);
                    setFileSessionId(null);
                    setChatMessages([]);
                    return;
                }

                const resp = await fetch(
                    `${API_URL}/ai/tutor/sessions/${existingSessionId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await resp.json();

                if (!data.success || !data.session) {
                    console.warn("⚠️ Removing stale session:", existingSessionId);
                    localStorage.removeItem(key);
                    setFileSessionId(null);
                    setChatMessages([]);
                    return;
                }
            } catch (err) {
                console.warn("⚠️ Session validation failed, clearing:", err);
                localStorage.removeItem(key);
                setFileSessionId(null);
                setChatMessages([]);
                return;
            }

            // Load history if session is valid
            try {
                setIsChatLoading(true);
                setFileSessionId(existingSessionId);
                const history = await getSessionMessages(existingSessionId);
                setChatMessages(history);
            } catch {
                setChatMessages([]);
            } finally {
                setIsChatLoading(false);
            }
        };

        initSession();
    }, [file.id]);

    // =====================================================================
    // LIBRARY ACTIONS
    // =====================================================================
    const handleAction = async (id) => {
        setActiveAction(id);

        // ⚡ FLASHCARDS — OPEN MODAL, NO BACKEND ACTION
        if (id === "flashcards") {
            setShowFlashcardsModal(true);
            return;
        }
        if (id === "quiz") {
            setShowMCQModal(true);
            return;
        }

        setIsLoadingAction(true);

        try {
            const res = await performLibraryAction(file.id, id, {
                page: activePage,
            });
            setActionResult(res.result);
        } finally {
            setIsLoadingAction(false);
        }
    };

    // =====================================================================
    // SEND CHAT — creates session only on first message
    // =====================================================================
    const handleChatSend = async () => {
        if (!chatInput.trim()) return;

        const msg = chatInput;
        setChatInput("");

        const userMsg = { id: Date.now(), role: "user", content: msg };
        setChatMessages((prev) => [...prev, userMsg]);
        setIsChatTyping(true);

        try {
            let sessionId = fileSessionId;

            // Create session only on first user message
            if (!sessionId) {
                const session = await createNewSession(`File: ${file.title}`);
                sessionId = session.id;
                setFileSessionId(sessionId);

                localStorage.setItem(
                    `synapse_file_session_${file.id}`,
                    String(sessionId)
                );
            }

            const res = await sendMessageToTutor({
                sessionId,
                message: `[File ${file.title} | Page ${activePage}] ${msg}`,
                page: activePage,
                fileId: file.id,
                image: pageImageForTutor,
                screenshotUrl: pageImageForTutor,
                resourceSelection: {
                    scope: "selected",
                    file_ids: [file.id],
                    folder_ids: [],
                    include_books: true,
                },
            });

            setChatMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, role: "assistant", content: res.text },
            ]);
        } catch (err) {
            console.error("Chat send failed:", err);
        } finally {
            setIsChatTyping(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const bumpPage = (d) =>
        setActivePage((p) => Math.max(1, Math.min(p + d, totalPages)));

    // =====================================================================
    // RENDER UI
    // =====================================================================
    return (
        <div className="h-screen overflow-hidden flex bg-[#0f1115]">
            {/* LEFT PANEL */}
            <div className="flex-1 flex flex-col border-r border-white/5">
                {/* HEADER */}
                <div className="h-16 flex items-center gap-4 px-6 bg-[#1a1d24] border-b border-white/5">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/10 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <h2 className="font-bold text-lg">{file.title}</h2>
                        <p className="text-xs text-muted uppercase">{file.category}</p>
                    </div>

                    {totalPages > 1 && (
                        <div className="ml-auto flex items-center gap-2 text-xs text-muted">
                            <span>Page:</span>

                            <div className="flex items-center gap-1 bg-black/40 rounded-lg border border-white/10 px-2 py-1">
                                <button onClick={() => bumpPage(-1)}>–</button>

                                <input
                                    type="number"
                                    value={activePage}
                                    min={1}
                                    max={totalPages}
                                    onChange={(e) =>
                                        setActivePage(
                                            Math.max(
                                                1,
                                                Math.min(Number(e.target.value), totalPages)
                                            )
                                        )
                                    }
                                    className="w-12 bg-transparent text-center text-xs outline-none"
                                />

                                <span>/ {totalPages}</span>

                                <button onClick={() => bumpPage(1)}>+</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* MAIN VIEWER */}
                <div className="flex-1 overflow-hidden bg-[#050609] p-3 flex">
                    <div className="flex-1 bg-[#0f1115] rounded-lg border border-white/5 shadow-xl overflow-hidden flex items-center justify-center">
                        {(() => {
                            const pageKey = `${file.id}:${activePage}`;
                            const imageFailed = imageLoadFailedRef.current.has(pageKey);
                            
                            // Priority (a): Use rendered PNG URL if present and not failed
                            if (renderedImageUrl && !imageFailed) {
                                return (
                                    <img
                                        src={renderedImageUrl}
                                        alt={`Page ${activePage}`}
                                        className="max-w-full max-h-full object-contain"
                                        loading="lazy"
                                        onError={() => {
                                            console.warn(`Rendered image failed to load, falling back to PDF.js`);
                                            imageLoadFailedRef.current.add(pageKey);
                                            setRenderedImageUrl(null);
                                        }}
                                    />
                                );
                            }

                            // Priority (b): Use image_url from page_contents if available and not failed
                            const imageUrl = getCurrentPageImageUrl();
                            if (imageUrl && !imageFailed) {
                                return (
                                    <img
                                        src={imageUrl}
                                        alt={`Page ${activePage}`}
                                        className="max-w-full max-h-full object-contain"
                                        loading="lazy"
                                        onError={() => {
                                            console.warn(`Image ${imageUrl} failed to load, falling back to PDF.js`);
                                            imageLoadFailedRef.current.add(pageKey);
                                        }}
                                    />
                                );
                            }
                            
                            // Priority (c): Show loading while attempting backend render
                            if (isRendering) {
                                return (
                                    <div className="text-muted text-sm opacity-50">
                                        Rendering page...
                                    </div>
                                );
                            }
                            
                            // Priority (d): Use PDF.js fallback with signed_url (permanent for this page)
                            if (file.signed_url) {
                                return (
                                    <div ref={pdfCanvasRef} className="w-full h-full flex items-center justify-center">
                                        <PdfJsPage
                                            pdfUrl={file.signed_url}
                                            pageNumber={activePage}
                                            onRenderComplete={handlePdfRenderComplete}
                                        />
                                    </div>
                                );
                            }
                            
                            // Fallback if no signed_url
                            return (
                                <div className="text-muted text-sm opacity-50">
                                    Page unavailable (no signed URL)
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="w-[400px] bg-[#1a1d24] flex flex-col border-l border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg mb-1">AI Tools</h3>
                        <p className="text-sm text-muted">Page-aware agent</p>
                    </div>

                    <button
                        onClick={() => setToolsCollapsed((x) => !x)}
                        className="text-muted hover:text-white"
                    >
                        {toolsCollapsed ? <ChevronDown /> : <ChevronUp />}
                    </button>
                </div>

                {toolsCollapsed ? (
                    <div className="flex gap-3 p-3 border-b border-white/5">
                        {[
                            { id: "summary", icon: FileText },
                            { id: "flashcards", icon: Zap },
                            { id: "quiz", icon: HelpCircle },
                        ].map((a) => (
                            <button
                                key={a.id}
                                onClick={() => handleAction(a.id)}
                                className="p-2 rounded-lg bg-[#0f1115] border border-white/10 hover:bg-white/5"
                            >
                                <a.icon size={18} />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 p-4 border-b border-white/5">
                        {[
                            { id: "summary", label: "Summarize", icon: FileText },
                            { id: "flashcards", label: "Flashcards", icon: Zap },
                            { id: "quiz", label: "Quiz Me", icon: HelpCircle },
                        ].map((a) => (
                            <button
                                key={a.id}
                                onClick={() => handleAction(a.id)}
                                className={`p-3 rounded-xl flex flex-col items-center gap-2 text-sm border transition ${activeAction === a.id
                                    ? "bg-teal/10 border-teal text-teal"
                                    : "bg-[#0f1115] border-white/10 hover:bg-white/5"
                                    }`}
                            >
                                <a.icon size={20} />
                                {a.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* CHAT */}
                <div className="flex-1 flex flex-col bg-[#0f1115] overflow-hidden">
                    <div className="p-3 border-b border-white/5 text-xs text-muted uppercase tracking-wider flex justify-between">
                        <span>
                            Chat • <span className="text-white">{file.title}</span>
                        </span>
                        {fileSessionId && (
                            <span className="text-teal/60">
                                Session #{fileSessionId} • Page {activePage}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                        {actionResult && (
                            <div className="p-4 bg-[#1a1d24] rounded-xl border border-white/10">
                                <h4 className="text-teal font-bold text-sm flex items-center gap-2 mb-2">
                                    <Sparkles size={14} /> Result (page {activePage})
                                </h4>
                                <p className="text-sm text-gray-300">
                                    {isLoadingAction ? "Processing..." : actionResult}
                                </p>
                            </div>
                        )}

                        {chatMessages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {isChatLoading && !chatMessages.length && (
                            <div className="text-xs text-muted">Loading chat…</div>
                        )}

                        {isChatTyping && (
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
                                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                                placeholder="Ask Astra about this page or the whole file…"
                                className="flex-1 bg-transparent text-sm text-white outline-none"
                            />
                            <button
                                onClick={handleChatSend}
                                disabled={!chatInput.trim() || isChatTyping}
                                className="p-1.5 bg-teal text-black rounded hover:bg-teal-neon disabled:opacity-40"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showFlashcardsModal && (
                <GenerateFlashcardsModal
                    presetFileId={file.id}
                    onCancel={() => setShowFlashcardsModal(false)}
                    onSuccess={() => {
                        setShowFlashcardsModal(false);
                        // later: navigate to flashcards deck / toast
                    }}
                />
            )}

            <GenerateMCQModal
                open={showMCQModal}
                presetFileId={file.id}
                onClose={() => setShowMCQModal(false)}
                onCreated={() => {
                    setShowMCQModal(false);
                    // later: refresh MCQ list or navigate
                }}
            />
        </div>
    );
};

export default FileViewer;
