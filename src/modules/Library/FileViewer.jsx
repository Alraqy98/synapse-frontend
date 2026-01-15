// src/modules/Library/FileViewer.jsx
// -------------------------------------------------------------
// FileViewer.jsx — PNG-based PDF Viewer + Chat + Tools (FINAL PATCHED)
// -------------------------------------------------------------

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "../../modules/demo/DemoContext";
import DemoAstraChat from "./DemoAstraChat";
import {
    ArrowLeft,
    ArrowRight,
    Brain,
    FileText,
    Zap,
    HelpCircle,
    Send,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ChevronLeft,
    LayoutGrid,
    Scroll,
    Edit3,
    ZoomIn,
    ZoomOut,
    RotateCcw,
} from "lucide-react";

import GenerateFlashcardsModal from "../flashcards/GenerateFlashcardsModal";
import GenerateMCQModal from "../mcq/GenerateMCQModal";
import GenerateSummaryModal from "../summaries/GenerateSummaryModal";
import { apiSummaries } from "../summaries/apiSummaries";
import { apiMCQ } from "../mcq/apiMCQ";
import { getFlashcardDecksByFile } from "../flashcards/apiFlashcards";

import { performLibraryAction, renameItem } from "./apiLibrary";
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
const FileViewer = ({ file, fileId, pageNumber, onBack, initialPage = 1 }) => {
    const navigate = useNavigate();
    const { isDemo, currentStep } = useDemo() || {};
    
    // Log context for debugging
    useEffect(() => {
        console.log("[ASTRA CONTEXT] FileViewer props:", { fileId, pageNumber, fileIdFromFile: file?.id });
    }, [fileId, pageNumber, file?.id]);
    // UI
    const [activeAction, setActiveAction] = useState(null);
    const [actionResult, setActionResult] = useState(null);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [toolsCollapsed, setToolsCollapsed] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });
    const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
    const [showMCQModal, setShowMCQModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    // Generation status tracking
    const [relatedSummary, setRelatedSummary] = useState(null);
    const [relatedMCQ, setRelatedMCQ] = useState(null);
    const [relatedFlashcard, setRelatedFlashcard] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    
    // Refs to track current state for polling logic
    const relatedSummaryRef = useRef(null);
    const relatedMCQRef = useRef(null);
    const relatedFlashcardRef = useRef(null);

    // Chat - Initialize sessionId ONCE from localStorage (single source of truth)
    const [fileSessionId, setFileSessionId] = useState(() => {
        if (!file?.id) return null;
        const key = `synapse_file_session_${file.id}`;
        const existing = localStorage.getItem(key);
        return existing || null;
    });
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatTyping, setIsChatTyping] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [tutorMode, setTutorMode] = useState("page_locked"); // "page_locked" | "open"
    const [aiToolsCollapsed, setAiToolsCollapsed] = useState(true); // AI Tools section collapsed by default
    const [chatMetadataCollapsed, setChatMetadataCollapsed] = useState(true); // Chat metadata collapsed by default
    const [modeSelectorCollapsed, setModeSelectorCollapsed] = useState(true); // Mode selector collapsed by default
    const chatEndRef = useRef(null);
    const messagesInitializedRef = useRef(false); // Track if messages have been loaded from backend

    // Rename state
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(file?.title || "");
    const [renameError, setRenameError] = useState(null);
    const [isRenamingLoading, setIsRenamingLoading] = useState(false);
    const renameInputRef = useRef(null);

    // View mode: 'page' or 'scroll'
    const [viewMode, setViewMode] = useState(() => {
        const stored = localStorage.getItem('synapse_fileviewer_mode');
        return stored === 'scroll' ? 'scroll' : 'page';
    });

    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleZoomIn = () => {
        setZoomLevel((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
    };

    const handleZoomReset = () => {
        setZoomLevel(1);
    };

    // Page renderer
    // Initialize activePage from pageNumber prop or initialPage
    const [activePage, setActivePage] = useState(pageNumber !== null && pageNumber !== undefined ? pageNumber : (initialPage || 1));
    const [pageImageForTutor, setPageImageForTutor] = useState(null);
    const [renderedImageUrl, setRenderedImageUrl] = useState(null); // Store rendered image URL per page
    const [isRendering, setIsRendering] = useState(false);
    const [totalPages, setTotalPages] = useState(1); // PDF.js determined page count
    const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
    const pdfCanvasRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const pageRefs = useRef({}); // Store refs for each page in scroll mode
    
    // Use refs for stable tracking that doesn't reset on re-renders
    const renderAttemptedRef = useRef(new Set()); // Track render attempts per page: `${file.id}:${page}`
    const imageLoadFailedRef = useRef(new Set()); // Track image load failures: `${file.id}:${page}`
    const renderedImageUrlsRef = useRef(new Map()); // Store rendered image URLs: `${file.id}:${page}` -> URL

    const pages = file.page_contents || [];
    
    // Verification: Log page_contents availability for vision pipeline
    useEffect(() => {
        console.log("[VISION VERIFY] FileViewer page_contents:", {
            hasPageContents: !!file.page_contents,
            pagesCount: pages.length,
            fileId: file?.id,
            firstPageImageUrl: pages[0]?.image_url || pages[0]?.image_path || null,
        });
    }, [file?.id, file?.page_contents, pages.length]);
    
    // Sync activePage with pageNumber prop when it changes
    useEffect(() => {
        if (pageNumber !== null && pageNumber !== undefined && pageNumber !== activePage) {
            setActivePage(pageNumber);
        }
    }, [pageNumber, activePage]);
    
    // Update URL when activePage changes (but not from URL change)
    const goToPage = (page) => {
        const normalizedPage = Math.max(1, Math.min(page, totalPages));
        setActivePage(normalizedPage);
        if (file?.id) {
            if (normalizedPage === 1) {
                navigate(`/library/file/${file.id}`, { replace: true });
            } else {
                navigate(`/library/file/${file.id}/page/${normalizedPage}`, { replace: true });
            }
        }
    };

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
        // Use pageNumber prop or initialPage, default to 1
        const startPage = (pageNumber !== null && pageNumber !== undefined ? pageNumber : initialPage) || 1;
        setActivePage(startPage);
        setPageImageForTutor(null);
        setRenderedImageUrl(null);
        renderAttemptedRef.current = new Set();
        imageLoadFailedRef.current = new Set();
        renderedImageUrlsRef.current = new Map();
    }, [file.id, pageNumber, initialPage]);

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
            // Verification: Log when page image is captured from cached rendered URL
            console.log("[VISION VERIFY] Page image captured from cached rendered URL:", {
                page: activePage,
                source: "cached_rendered",
            });
            setIsRendering(false);
            return;
        }
        
        // Priority 2: Use image_url from page_contents if available and not failed
        if (imageUrl && !imageFailed) {
            setRenderedImageUrl(null);
            setPageImageForTutor(imageUrl);
            // Verification: Log when page image is captured from page_contents
            console.log("[VISION VERIFY] Page image captured from page_contents:", {
                page: activePage,
                imageUrl: imageUrl.substring(0, 100),
                source: "page_contents",
            });
            setIsRendering(false);
            return;
        }
        
        // Priority 3: Use PDF.js fallback (rendering is triggered by prepare-file, not FileViewer)
        // FileViewer never triggers rendering - it only displays what's available
        setRenderedImageUrl(null);
        setIsRendering(false);
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
                            // Verification: Log when image is extracted from PDF.js canvas
                            console.log("[VISION VERIFY] Page image extracted from PDF.js canvas:", {
                                page: activePage,
                                blobSize: blob.size,
                                source: "pdfjs_canvas",
                            });
                        }
                    }, 'image/png', 0.9);
                }
            } catch (err) {
                console.warn('Failed to extract image from PDF.js canvas:', err);
            }
        }
    };

    // =====================================================================
    // SYNC SESSION ID WITH LOCALSTORAGE
    // =====================================================================
    useEffect(() => {
        if (!file?.id) return;

        const key = `synapse_file_session_${file.id}`;
        const stored = localStorage.getItem(key);

        // Sync state with localStorage (single source of truth)
        if (stored && stored !== fileSessionId) {
            setFileSessionId(stored);
        } else if (!stored && fileSessionId) {
            // If localStorage is empty but state has value, persist it
            localStorage.setItem(key, fileSessionId);
        }
    }, [file.id, fileSessionId]);

    // =====================================================================
    // LOAD MESSAGES ONCE (cold start only)
    // =====================================================================
    useEffect(() => {
        // Only initialize once per file.id - never re-fetch messages
        if (messagesInitializedRef.current || !fileSessionId) {
            return;
        }

        const loadHistory = async () => {

            // 🔥 Validate session exists in DB
            try {
                const token = getSupabaseToken();
                if (!token) {
                    console.warn("⚠️ No token — dropping stale session");
                    localStorage.removeItem(key);
                    setFileSessionId(null);
                    setChatMessages([]);
                    messagesInitializedRef.current = true;
                    return;
                }

                const resp = await fetch(
                    `${API_URL}/ai/tutor/sessions/${fileSessionId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await resp.json();

                if (!data.success || !data.session) {
                    console.warn("⚠️ Removing stale session:", fileSessionId);
                    const key = `synapse_file_session_${file.id}`;
                    localStorage.removeItem(key);
                    setFileSessionId(null);
                    setChatMessages([]);
                    messagesInitializedRef.current = true;
                    return;
                }
            } catch (err) {
                console.warn("⚠️ Session validation failed, clearing:", err);
                const key = `synapse_file_session_${file.id}`;
                localStorage.removeItem(key);
                setFileSessionId(null);
                setChatMessages([]);
                messagesInitializedRef.current = true;
                return;
            }

            // Load history ONCE if session is valid - never re-fetch
            // HARD RULE: GET only on cold start (no live messages)
            try {
                // Gate: Only run GET if no live messages exist
                if (chatMessages.length > 0) {
                    console.log("[TUTOR_GET_BLOCKED] Skipping GET - live messages exist in FileViewer", { 
                        messageCount: chatMessages.length,
                        fileId: file.id,
                        sessionId: fileSessionId 
                    });
                    messagesInitializedRef.current = true;
                    return;
                }

                // Trace: Identify what triggered this GET (should only be cold start)
                console.trace("[TUTOR_GET_TRIGGERED] FileViewer cold start - no live messages");

                setIsChatLoading(true);
                
                // Diagnostic log: Confirm sessionId for GET request
                console.log("[TUTOR_SESSION][GET]", fileSessionId, "for file:", file.id);
                
                const history = await getSessionMessages(fileSessionId);
                
                // Non-destructive rehydration: Only update if we have valid messages
                setChatMessages(prev => {
                    const fetchedMessages = history && Array.isArray(history) && history.length > 0
                        ? history
                        : null;

                    if (fetchedMessages) {
                        console.log("[TUTOR_FRONTEND] Rehydrated messages from GET", { count: fetchedMessages.length, fileId: file.id });
                        return fetchedMessages;
                    }

                    // If no fetched messages but we have existing messages, keep them
                    if (prev && prev.length > 0) {
                        console.log("[TUTOR_FRONTEND] Empty GET response - preserving existing messages", { count: prev.length, fileId: file.id });
                        return prev;
                    }

                    // No messages at all
                    return [];
                });
                
                messagesInitializedRef.current = true;
            } catch (err) {
                console.error("[TUTOR_FRONTEND] Failed to load session messages:", err);
                // On error, preserve existing messages if they exist
                setChatMessages(prev => {
                    if (prev && prev.length > 0) {
                        console.log("[TUTOR_FRONTEND] GET error - preserving existing messages", { count: prev.length, fileId: file.id });
                        return prev;
                    }
                    return [];
                });
                messagesInitializedRef.current = true;
            } finally {
                setIsChatLoading(false);
            }
        };

        loadHistory();
    }, [file.id, fileSessionId]);

    // Reset initialization flag when file.id changes
    useEffect(() => {
        messagesInitializedRef.current = false;
    }, [file.id]);

    // =====================================================================
    // FETCH RELATED GENERATION STATUS (Summaries, MCQs, Flashcards)
    // =====================================================================
    useEffect(() => {
        if (!file?.id) return;

        const loadRelatedStatus = async () => {
            setIsLoadingStatus(true);
            try {
                // Fetch summaries for this file
                try {
                    const summaries = await apiSummaries.getSummariesByFile(file.id);
                    // Get the most recent summary (completed or generating)
                    const latestSummary = summaries?.[0] || null;
                    setRelatedSummary(latestSummary);
                } catch (err) {
                    console.error("Failed to load summaries:", err);
                    setRelatedSummary(null);
                }

                // Fetch MCQ decks for this file (file-scoped query)
                try {
                    const relatedDecks = await apiMCQ.getMCQDecksByFile(file.id);
                    // Get the most recent deck
                    const latestMCQ = relatedDecks?.[0] || null;
                    setRelatedMCQ(latestMCQ);
                } catch (err) {
                    console.error("Failed to load MCQ decks:", err);
                    setRelatedMCQ(null);
                }

                // Fetch flashcard decks for this file (file-scoped query)
                try {
                    const relatedDecks = await getFlashcardDecksByFile(file.id);
                    // Get the most recent deck
                    const latestFlashcard = relatedDecks?.[0] || null;
                    setRelatedFlashcard(latestFlashcard);
                } catch (err) {
                    console.error("Failed to load flashcard decks:", err);
                    setRelatedFlashcard(null);
                }
            } finally {
                setIsLoadingStatus(false);
            }
        };

        // Initial load
        loadRelatedStatus();

        // Poll for status updates every 4 seconds, but only if something is generating
        let intervalId = null;
        
        const checkAndPoll = async () => {
            // Use refs to get current state (avoid stale closures)
            const currentSummary = relatedSummaryRef.current;
            const currentMCQ = relatedMCQRef.current;
            const currentFlashcard = relatedFlashcardRef.current;
            
            const isGenerating = 
                (currentSummary && (currentSummary.generating || currentSummary.status === "generating")) ||
                (currentMCQ && currentMCQ.generating) ||
                (currentFlashcard && currentFlashcard.generating);
            
            if (isGenerating) {
                await loadRelatedStatus();
            } else {
                // Stop polling if nothing is generating
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }
        };

        // Start polling after initial load completes
        loadRelatedStatus().then(() => {
            // Check if we need to start polling
            const currentSummary = relatedSummaryRef.current;
            const currentMCQ = relatedMCQRef.current;
            const currentFlashcard = relatedFlashcardRef.current;
            
            const isGenerating = 
                (currentSummary && (currentSummary.generating || currentSummary.status === "generating")) ||
                (currentMCQ && currentMCQ.generating) ||
                (currentFlashcard && currentFlashcard.generating);
            
            if (isGenerating && !intervalId) {
                intervalId = setInterval(checkAndPoll, 4000);
            }
        });

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [file.id]);

    // =====================================================================
    // HELPER FUNCTIONS FOR STATUS
    // =====================================================================
    const getSummaryStatus = () => {
        if (!relatedSummary) return "not_generated";
        if (relatedSummary.generating || relatedSummary.status === "generating") return "generating";
        if (relatedSummary.status === "failed") return "failed";
        return "completed";
    };

    const getMCQStatus = () => {
        if (!relatedMCQ) return "not_generated";
        if (relatedMCQ.generating) return "generating";
        return "completed";
    };

    const getFlashcardStatus = () => {
        if (!relatedFlashcard) return "not_generated";
        if (relatedFlashcard.generating) return "generating";
        return "completed";
    };

    const handleSummaryClick = () => {
        // Always open the modal, regardless of status
        setShowSummaryModal(true);
    };

    const handleMCQClick = () => {
        // Always open the modal, regardless of status
        setShowMCQModal(true);
    };

    const handleFlashcardClick = () => {
        // Always open the modal, regardless of status
        setShowFlashcardsModal(true);
    };

    // =====================================================================
    // LIBRARY ACTIONS
    // =====================================================================
    const handleAction = async (id) => {
        setActiveAction(id);

        // ⚡ FLASHCARDS — OPEN MODAL, NO BACKEND ACTION
        if (id === "flashcards") {
            handleFlashcardClick();
            return;
        }
        if (id === "quiz") {
            handleMCQClick();
            return;
        }
        if (id === "summary") {
            handleSummaryClick();
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
    // Append-only: never re-fetch, never replace messages
    // =====================================================================
    const handleChatSend = async () => {
        if (!chatInput.trim()) return;

        // Task 1: Enforce fileId presence - hard guard before proceeding
        if (!file || !file.id) {
            console.error("[FILEVIEWER ASTRA] Missing file.id — aborting chat send", {
                file,
                activePage
            });
            return;
        }

        const msg = chatInput;
        setChatInput("");

        // Generate stable IDs for messages
        const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const userMsg = { id: userMsgId, role: "user", content: msg };
        
        // Append user message - append-only, never replace
        setChatMessages((prev) => [...prev, userMsg]);
        setIsChatTyping(true);

        try {
            // Use fileSessionId from state (single source of truth)
            // If null, create new session (only happens on first message)
            let sessionId = fileSessionId;

            if (!sessionId) {
                const session = await createNewSession(`File: ${file.title}`);
                sessionId = session.id;
                setFileSessionId(sessionId);

                // Persist to localStorage immediately
                const key = `synapse_file_session_${file.id}`;
                localStorage.setItem(key, String(sessionId));
                console.log("[TUTOR_SESSION][CREATED]", sessionId, "for file:", file.id);
            }

            // Diagnostic log: Confirm sessionId for POST request
            console.log("[TUTOR_SESSION][POST]", sessionId, "for file:", file.id);

            // Verification: Confirm fileId and page match currently displayed state
            const normalizedFileId = String(file.id);
            const normalizedPage = Number(activePage);
            
            console.log("[FILEVIEWER ASTRA VERIFICATION]", {
                fileId: normalizedFileId,
                page: normalizedPage,
                fileIdMatchesRoute: normalizedFileId === file.id,
                pageMatchesVisible: normalizedPage === activePage,
                visiblePageNumber: activePage,
                fileIdFromProps: file.id,
                pageImageStatus: pageImageForTutor ? "present" : "missing",
                source: "FileViewer handleChatSend - before sendMessageToTutor",
            });

            // Task 2: Normalize payload explicitly - force String and Number, never undefined
            // CRITICAL: Explicitly set mode to "page" for page-aware tutor behavior
            const tutorPayload = {
                sessionId,
                message: `[File ${file.title} | Page ${activePage}] ${msg}`,
                fileId: normalizedFileId,      // FORCE string
                page: normalizedPage,          // FORCE number
                mode: "page",                  // CRITICAL: Explicit page-aware mode
                image: pageImageForTutor,
                screenshotUrl: pageImageForTutor,
                tutorMode: tutorMode,         // "page_locked" | "open"
                resourceSelection: {
                    scope: "selected",
                    file_ids: [file.id],
                    folder_ids: [],
                    include_books: true,
                },
            };

            // Debug log to verify mode is set correctly
            console.log("[TUTOR PAYLOAD] FileViewer page-aware mode:", {
                message: tutorPayload.message.substring(0, 50),
                fileId: tutorPayload.fileId,
                page: tutorPayload.page,
                mode: tutorPayload.mode,
                tutorMode: tutorPayload.tutorMode,
            });

            // Verification: Log vision payload status
            console.log("[VISION PAYLOAD] Tutor request includes image:", {
                hasImage: !!pageImageForTutor,
                hasScreenshotUrl: !!tutorPayload.screenshotUrl,
                imageType: pageImageForTutor ? (pageImageForTutor.startsWith('blob:') ? 'blob' : 'url') : 'null',
                imagePreview: pageImageForTutor ? pageImageForTutor.substring(0, 100) : null,
            });

            const res = await sendMessageToTutor(tutorPayload);

            // Generate stable ID for assistant message
            const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Append assistant message - append-only, never replace
            setChatMessages((prev) => [
                ...prev,
                { id: assistantMsgId, role: "assistant", content: res.text },
            ]);
        } catch (err) {
            // Surface backend error verbatim - no fallback behavior
            console.error("[FILEVIEWER ASTRA ERROR]", {
                error: err,
                message: err.message,
                backendError: err.response?.data?.error || err.response?.data?.message || null,
                fileId: file?.id,
                page: activePage,
            });
            
            // Display backend error message verbatim to user
            const errorMessage = err.response?.data?.error || 
                               err.response?.data?.message || 
                               err.message || 
                               "Astra request failed";
            
            // Append error message to chat for user visibility
            const errorMsgId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setChatMessages((prev) => [
                ...prev,
                { 
                    id: errorMsgId, 
                    role: "assistant", 
                    content: `Error: ${errorMessage}` 
                },
            ]);
        } finally {
            setIsChatTyping(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // Demo Mode: Real Astra chat is disabled - DemoAstraChat component handles demo chat

    const bumpPage = (d) => {
        const newPage = Math.max(1, Math.min(activePage + d, totalPages));
        goToPage(newPage);
    };

    // =====================================================================
    // RENAME HANDLER
    // =====================================================================
    // Sync renameValue when file.title changes
    useEffect(() => {
        if (file?.title && !isRenaming) {
            setRenameValue(file.title);
        }
    }, [file?.title, isRenaming]);

    const handleRenameStart = () => {
        setRenameValue(file?.title || "");
        setRenameError(null);
        setIsRenaming(true);
        // Focus input after state update
        setTimeout(() => {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }, 0);
    };

    const handleRenameCancel = () => {
        setRenameValue(file?.title || "");
        setRenameError(null);
        setIsRenaming(false);
    };

    const handleRenameSubmit = async () => {
        const trimmedName = renameValue.trim();
        
        if (!trimmedName) {
            setRenameError("Name cannot be empty");
            return;
        }
        
        if (trimmedName === file?.title) {
            handleRenameCancel();
            return;
        }

        if (!file?.id) {
            setRenameError("File ID missing");
            return;
        }

        const originalTitle = file.title;
        
        setIsRenamingLoading(true);
        setRenameError(null);

        try {
            await renameItem(file.id, trimmedName);
            setIsRenaming(false);
            // Update local state - the parent will refresh on next navigation
            setRenameValue(trimmedName);
        } catch (err) {
            console.error("Rename failed:", err);
            setRenameError("Rename failed. Please try again.");
            setRenameValue(originalTitle);
        } finally {
            setIsRenamingLoading(false);
        }
    };

    // Handle keyboard events for rename
    useEffect(() => {
        if (!isRenaming) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleRenameSubmit();
            } else if (e.key === "Escape") {
                e.preventDefault();
                handleRenameCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRenaming, renameValue]);

    // Keyboard navigation (Page Mode only)
    useEffect(() => {
        if (viewMode !== 'page') return;

        const handleKeyDown = (e) => {
            // Only handle if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (activePage > 1) {
                    bumpPage(-1);
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (activePage < totalPages) {
                    bumpPage(1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, activePage, totalPages]);

    // Scroll-based page indicator update (Scroll Mode)
    useEffect(() => {
        if (viewMode !== 'scroll' || !scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const updateActivePageFromScroll = () => {
            const containerRect = container.getBoundingClientRect();
            const containerTop = containerRect.top;
            const containerHeight = containerRect.height;
            const viewportCenter = containerTop + containerHeight / 2;

            let closestPage = 1;
            let closestDistance = Infinity;

            // Find the page closest to viewport center
            for (let page = 1; page <= totalPages; page++) {
                const pageRef = pageRefs.current[page];
                if (pageRef) {
                    const pageRect = pageRef.getBoundingClientRect();
                    const pageCenter = pageRect.top + pageRect.height / 2;
                    const distance = Math.abs(pageCenter - viewportCenter);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPage = page;
                    }
                }
            }

            if (closestPage !== activePage) {
                setActivePage(closestPage);
                // Update URL without triggering navigation
                if (file?.id) {
                    if (closestPage === 1) {
                        window.history.replaceState({}, '', `/library/file/${file.id}`);
                    } else {
                        window.history.replaceState({}, '', `/library/file/${file.id}/page/${closestPage}`);
                    }
                }
            }
        };

        container.addEventListener('scroll', updateActivePageFromScroll);
        // Also check on mount/resize
        updateActivePageFromScroll();

        return () => {
            container.removeEventListener('scroll', updateActivePageFromScroll);
        };
    }, [viewMode, totalPages, activePage, file?.id]);

    // Render a single page (reusable for both modes)
    const renderPage = (pageNum, isScrollMode = false) => {
        const pageKey = `${file.id}:${pageNum}`;
        const imageFailed = imageLoadFailedRef.current.has(pageKey);
        const pageIndex = pageNum - 1;
        const currentPage = pages[pageIndex];
        const imageUrl = currentPage?.image_url || currentPage?.image_path || null;
        
        // Get rendered URL for this page
        const cachedRenderedUrl = renderedImageUrlsRef.current.get(pageKey);

        if (isDemo) {
            if (imageUrl) {
                return (
                    <img
                        src={imageUrl}
                        alt={`Page ${pageNum}`}
                        className={isScrollMode ? "w-full h-auto" : "max-w-full max-h-full object-contain"}
                        loading="lazy"
                    />
                );
            }
            return (
                <div className="text-muted text-sm opacity-50">
                    Demo page {pageNum}
                </div>
            );
        }

        // Priority (a): Use rendered PNG URL if present and not failed
        if (cachedRenderedUrl && !imageFailed) {
            return (
                <img
                    src={cachedRenderedUrl}
                    alt={`Page ${pageNum}`}
                    className={isScrollMode ? "w-full h-auto" : "max-w-full max-h-full object-contain"}
                    loading="lazy"
                    onError={() => {
                        console.warn(`Rendered image failed to load for page ${pageNum}`);
                        imageLoadFailedRef.current.add(pageKey);
                    }}
                />
            );
        }

        // Priority (b): Use image_url from page_contents if available and not failed
        if (imageUrl && !imageFailed) {
            return (
                <img
                    src={imageUrl}
                    alt={`Page ${pageNum}`}
                    className={isScrollMode ? "w-full h-auto" : "max-w-full max-h-full object-contain"}
                    loading="lazy"
                    onError={() => {
                        console.warn(`Image ${imageUrl} failed to load for page ${pageNum}`);
                        imageLoadFailedRef.current.add(pageKey);
                    }}
                />
            );
        }

        // Priority (c): Use PDF.js fallback with signed_url
        if (file.signed_url) {
            return (
                <div className={isScrollMode ? "w-full" : "w-full h-full flex items-center justify-center"}>
                    <PdfJsPage
                        pdfUrl={file.signed_url}
                        pageNumber={pageNum}
                        onRenderComplete={pageNum === activePage ? handlePdfRenderComplete : undefined}
                    />
                </div>
            );
        }

        // Fallback
        return (
            <div className="text-muted text-sm opacity-50">
                Page {pageNum} unavailable
            </div>
        );
    };

    // =====================================================================
    // RENDER UI
    // =====================================================================
    return (
        <div className="h-screen overflow-hidden flex bg-[#0f1115] relative" data-demo="fileviewer-root">
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

                    <div className="flex flex-col gap-1">
                        {isRenaming ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => {
                                        setRenameValue(e.target.value);
                                        setRenameError(null);
                                    }}
                                    onBlur={handleRenameCancel}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleRenameSubmit();
                                        } else if (e.key === "Escape") {
                                            e.preventDefault();
                                            handleRenameCancel();
                                        }
                                    }}
                                    disabled={isRenamingLoading}
                                    className="px-2 py-1 bg-[#0f1115] border border-teal/50 rounded text-lg font-bold text-white focus:outline-none focus:border-teal"
                                    style={{ minWidth: "200px" }}
                                />
                                {renameError && (
                                    <span className="text-xs text-red-400">{renameError}</span>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h2 
                                    className="font-bold text-lg cursor-pointer hover:text-teal transition-colors"
                                    onClick={handleRenameStart}
                                >
                                    {file.title}
                                </h2>
                                <button
                                    onClick={handleRenameStart}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                                    title="Rename file"
                                >
                                    <Edit3 size={14} className="text-muted hover:text-teal" />
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-muted uppercase">{file.category}</p>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        {/* Zoom Controls */}
                        {viewMode === 'page' && (
                            <div className="flex items-center gap-1 bg-black/40 rounded-lg border border-white/10 p-1">
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoomLevel <= 0.5}
                                    className="px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center text-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Zoom Out"
                                    aria-label="Zoom Out"
                                >
                                    <ZoomOut size={14} />
                                </button>
                                <button
                                    onClick={handleZoomReset}
                                    className="px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center text-muted hover:text-white"
                                    title="Reset Zoom"
                                    aria-label="Reset Zoom"
                                >
                                    <RotateCcw size={14} />
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoomLevel >= 3}
                                    className="px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center text-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Zoom In"
                                    aria-label="Zoom In"
                                >
                                    <ZoomIn size={14} />
                                </button>
                            </div>
                        )}
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/10 p-1">
                            <button
                                onClick={() => {
                                    if (viewMode !== 'page') {
                                        setViewMode('page');
                                        localStorage.setItem('synapse_fileviewer_mode', 'page');
                                    }
                                }}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                    viewMode === 'page'
                                        ? 'bg-teal/20 text-teal border border-teal/30'
                                        : 'text-muted hover:text-white'
                                }`}
                                title="Page Mode"
                            >
                                <LayoutGrid size={14} />
                                Page
                            </button>
                            <button
                                onClick={() => {
                                    if (viewMode !== 'scroll') {
                                        setViewMode('scroll');
                                        localStorage.setItem('synapse_fileviewer_mode', 'scroll');
                                        // Scroll to current page when switching to scroll mode
                                        setTimeout(() => {
                                            const pageRef = pageRefs.current[activePage];
                                            if (pageRef && scrollContainerRef.current) {
                                                pageRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                        }, 100);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                    viewMode === 'scroll'
                                        ? 'bg-teal/20 text-teal border border-teal/30'
                                        : 'text-muted hover:text-white'
                                }`}
                                title="Scroll Mode"
                            >
                                <Scroll size={14} />
                                Scroll
                            </button>
                        </div>

                        {/* Page Indicator */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2 text-xs text-muted">
                                <span>Page:</span>
                                {viewMode === 'page' ? (
                                    <div className="flex items-center gap-1 bg-black/40 rounded-lg border border-white/10 px-2 py-1">
                                        <input
                                            type="number"
                                            value={activePage}
                                            min={1}
                                            max={totalPages}
                                            onChange={(e) => {
                                                const newPage = Math.max(
                                                    1,
                                                    Math.min(Number(e.target.value), totalPages)
                                                );
                                                goToPage(newPage);
                                            }}
                                            className="w-12 bg-transparent text-center text-xs outline-none"
                                        />
                                        <span>/ {totalPages}</span>
                                    </div>
                                ) : (
                                    <div className="bg-black/40 rounded-lg border border-white/10 px-2 py-1">
                                        <span>{activePage} / {totalPages}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* MAIN VIEWER */}
                <div className="flex-1 overflow-hidden bg-[#050609] p-3 flex relative">
                    {viewMode === 'page' ? (
                        // PAGE MODE: Single page with large arrow buttons
                        <>
                            {/* Left Arrow Button */}
                            {activePage > 1 && (
                                <button
                                    onClick={() => bumpPage(-1)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 min-w-[44px] min-h-[44px] bg-black/60 hover:bg-black/80 border border-white/20 rounded-full flex items-center justify-center transition-all active:scale-95"
                                    aria-label="Previous page"
                                >
                                    <ArrowLeft size={24} className="text-white" />
                                </button>
                            )}

                            {/* Right Arrow Button */}
                            {activePage < totalPages && (
                                <button
                                    onClick={() => bumpPage(1)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 min-w-[44px] min-h-[44px] bg-black/60 hover:bg-black/80 border border-white/20 rounded-full flex items-center justify-center transition-all active:scale-95"
                                    aria-label="Next page"
                                >
                                    <ArrowRight size={24} className="text-white" />
                                </button>
                            )}

                            {/* Page Content */}
                            <div
                                className="flex-1 bg-[#0f1115] rounded-lg border border-white/5 shadow-xl overflow-hidden flex items-center justify-center"
                                style={{ userSelect: "text" }}
                                data-demo="page-canvas"
                                key={`page-${activePage}-${sidebarCollapsed}`}
                            >
                                <div
                                    style={{
                                        transform: `scale(${zoomLevel})`,
                                        transition: 'transform 0.2s ease-out',
                                        transformOrigin: 'top center',
                                    }}
                                >
                                    {renderPage(activePage, false)}
                                </div>
                            </div>
                        </>
                    ) : (
                        // SCROLL MODE: Vertical scroll container with all pages
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 bg-[#0f1115] rounded-lg border border-white/5 shadow-xl overflow-y-auto"
                            style={{ userSelect: "text" }}
                            data-demo="scroll-canvas"
                        >
                            <div
                                style={{
                                    transform: `scale(${zoomLevel})`,
                                    transition: 'transform 0.2s ease-out',
                                    transformOrigin: 'top center',
                                }}
                            >
                                <div className="w-full">
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        const pageNum = i + 1;
                                        // Lazy rendering: only render visible pages + buffer
                                        const shouldRender = true; // For now, render all (can optimize with IntersectionObserver later)
                                        
                                        return (
                                            <div
                                                key={pageNum}
                                                ref={(el) => {
                                                    if (el) pageRefs.current[pageNum] = el;
                                                }}
                                                className="w-full flex items-center justify-center py-4 border-b border-white/5 last:border-b-0"
                                                data-page={pageNum}
                                            >
                                                {shouldRender ? (
                                                    <div className="w-full max-w-4xl px-4">
                                                        {renderPage(pageNum, true)}
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-[800px] flex items-center justify-center text-muted text-sm">
                                                        Loading page {pageNum}...
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className={`${sidebarCollapsed ? 'w-0 md:w-0' : 'w-full md:w-[400px]'} transition-all duration-300 ease-in-out bg-[#1a1d24] flex flex-col ${sidebarCollapsed ? 'border-l-0' : 'border-l border-white/5'} overflow-hidden`}>
                {/* AI Tools Section - Collapsible */}
                <div className="border-b border-white/5">
                    <button
                        onClick={() => setAiToolsCollapsed((x) => !x)}
                        className="w-full p-3 flex items-center justify-between bg-gradient-to-r from-teal/10 to-transparent bg-[#0f1115] border-l-4 border-teal hover:bg-teal/10 hover:border-teal/60 transition-colors"
                    >
                        <div className="text-left flex items-center gap-2">
                            <div className="p-3 rounded-lg border border-white/10">
                                <Brain size={22} />
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">AI Tools</h3>
                                <p className="text-[10px] text-teal/60 mt-0.5">Page-aware agent • Page {activePage}</p>
                            </div>
                        </div>
                        {aiToolsCollapsed ? <ChevronDown size={14} className="text-muted" /> : <ChevronUp size={14} className="text-muted" />}
                    </button>

                    {!aiToolsCollapsed && (
                        <div className="px-3 pb-3">
                            {toolsCollapsed ? (
                                <div
                                    className="flex gap-3"
                                    data-demo="quick-actions-bar"
                                    data-demo-layout="collapsed"
                                >
                                    {[
                                        { id: "summary", icon: FileText },
                                        { id: "flashcards", icon: Zap },
                                        { id: "quiz", icon: HelpCircle },
                                    ].map((a) => (
                                        <button
                                            key={a.id}
                                            onClick={() => handleAction(a.id)}
                                            className="p-3 rounded-lg border border-white/10 hover:bg-neutral-800 transition"
                                        >
                                            <a.icon size={22} />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className="grid grid-cols-2 gap-3"
                                    data-demo="quick-actions-bar"
                                    data-demo-layout="expanded"
                                >
                            {[
                            { 
                                id: "summary", 
                                label: "Summarize", 
                                icon: FileText,
                                status: getSummaryStatus(),
                                item: relatedSummary
                            },
                            { 
                                id: "flashcards", 
                                label: "Flashcards", 
                                icon: Zap,
                                status: getFlashcardStatus(),
                                item: relatedFlashcard
                            },
                            { 
                                id: "quiz", 
                                label: "Quiz Me", 
                                icon: HelpCircle,
                                status: getMCQStatus(),
                                item: relatedMCQ
                            },
                        ].map((a) => {
                            const isCompleted = a.status === "completed";
                            const isGenerating = a.status === "generating";
                            const isNotGenerated = a.status === "not_generated";
                            const isFailed = a.status === "failed";
                            const isClickable = isCompleted;

                                const dataDemo =
                                    a.id === "summary"
                                        ? "quick-action-summary"
                                        : a.id === "quiz"
                                        ? "quick-action-mcq"
                                        : undefined;

                                return (
                                <button
                                    key={a.id}
                                    onClick={() => handleAction(a.id)}
                                    disabled={isGenerating || isFailed}
                                        className={`p-3 rounded-lg border border-white/10 flex flex-col items-center gap-2 text-sm transition relative ${
                                        activeAction === a.id
                                            ? "bg-neutral-800"
                                            : isGenerating || isFailed
                                            ? "opacity-60 cursor-not-allowed"
                                            : "hover:bg-neutral-800 cursor-pointer"
                                    }`}
                                    >
                                        {dataDemo && <span data-demo={dataDemo} className="hidden" />}
                                    <a.icon size={22} />
                                    <span>{a.label}</span>
                                    {isGenerating && (
                                        <span className="text-xs text-muted mt-1">Generating...</span>
                                    )}
                                    {isCompleted && (
                                        <span className="text-xs text-teal mt-1">Ready</span>
                                    )}
                                    {isFailed && (
                                        <span className="text-xs text-red-400 mt-1">Failed</span>
                                    )}
                                </button>
                            );
                        })}
                                </div>
                            )}
                            <div className="mt-2 flex justify-end">
                                <button
                                    onClick={() => setToolsCollapsed((x) => !x)}
                                    className="text-[10px] text-muted hover:text-white/70 transition-colors"
                                >
                                    {toolsCollapsed ? "Show details" : "Show icons only"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* CHAT - Always Visible */}
                {isDemo ? (
                    <DemoAstraChat file={file} activePage={activePage} />
                ) : (
                    <div className="flex-1 flex flex-col bg-[#0f1115] overflow-hidden">
                        {/* Chat Metadata Section - Collapsible */}
                        <div className="border-b border-white/5">
                            <button
                                onClick={() => setChatMetadataCollapsed((x) => !x)}
                                className="w-full p-2 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <span className="text-xs text-muted uppercase tracking-wider">
                                    Chat • <span className="text-white/70">{file.title}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    {fileSessionId && (
                                        <span className="text-[10px] text-teal/60">
                                            Session #{fileSessionId} • Page {activePage}
                                        </span>
                                    )}
                                    {chatMetadataCollapsed ? <ChevronDown size={12} className="text-muted" /> : <ChevronUp size={12} className="text-muted" />}
                                </div>
                            </button>
                        </div>
                            
                        {/* Astra Mode Selector - Collapsible */}
                        <div className="border-b border-white/5">
                            <button
                                onClick={() => setModeSelectorCollapsed((x) => !x)}
                                className="w-full p-2 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <span className="text-[10px] text-muted uppercase tracking-wider">Astra mode</span>
                                {modeSelectorCollapsed ? <ChevronDown size={12} className="text-muted" /> : <ChevronUp size={12} className="text-muted" />}
                            </button>
                            
                            {!modeSelectorCollapsed && (
                                <div className="px-3 pb-3 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setTutorMode("page_locked")}
                                            className={`
                                                flex flex-col items-start px-3 py-2 rounded-lg transition-all
                                                ${tutorMode === "page_locked" 
                                                    ? "bg-teal/10 border border-teal/30 text-white" 
                                                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80"
                                                }
                                            `}
                                        >
                                            <span className="text-xs font-medium">Focused tutor</span>
                                            <span className="text-[10px] text-white/50 mt-0.5">Uses only this page</span>
                                        </button>
                                        <button
                                            onClick={() => setTutorMode("open")}
                                            className={`
                                                flex flex-col items-start px-3 py-2 rounded-lg transition-all
                                                ${tutorMode === "open" 
                                                    ? "bg-teal/10 border border-teal/30 text-white" 
                                                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80"
                                                }
                                            `}
                                        >
                                            <span className="text-xs font-medium">Thinking wider</span>
                                            <span className="text-[10px] text-white/50 mt-0.5">Adds outside medical context</span>
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-white/40 italic">
                                        You can switch this anytime.
                                    </div>
                                </div>
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
                                    data-demo="astra-chat-input"
                                />
                                <button
                                    onClick={handleChatSend}
                                    disabled={!chatInput.trim() || isChatTyping}
                                    className="p-1.5 bg-teal text-black rounded hover:bg-teal-neon disabled:opacity-40"
                                    data-demo="quick-action-ask-astra"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showFlashcardsModal && (
                <GenerateFlashcardsModal
                    open={true}
                    presetFileId={file.id}
                    onClose={() => setShowFlashcardsModal(false)}
                    onCreated={() => {
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

            <GenerateSummaryModal
                open={showSummaryModal}
                presetFileId={file.id}
                onClose={() => setShowSummaryModal(false)}
                onCreated={({ jobId }) => {
                    setShowSummaryModal(false);
                    // Summary generation started - user can check progress in Summaries tab
                }}
            />
            
            {/* SIDEBAR TOGGLE HOVER ZONE */}
            <div className={`fixed top-0 bottom-0 z-40 transition-all duration-300 group ${sidebarCollapsed ? 'right-0 w-12' : 'right-0 md:right-[400px] w-12'}`}>
                {/* SIDEBAR TOGGLE BUTTON */}
                <button
                    onClick={() => setSidebarCollapsed((x) => !x)}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 w-10 h-10 min-w-[44px] min-h-[44px] rounded-l-lg flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 hover:bg-neutral-800 ${sidebarCollapsed ? 'right-2' : 'right-2'}`}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {sidebarCollapsed ? (
                        <ChevronLeft size={20} />
                    ) : (
                        <ChevronRight size={20} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default FileViewer;
