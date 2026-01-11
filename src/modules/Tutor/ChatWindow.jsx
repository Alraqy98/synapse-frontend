// src/modules/tutor/ChatWindow.jsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import MessageBubble from "./MessageBubble";
import FollowUpPrompt from "./FollowUpPrompt";
import {
    sendStandaloneMessageToTutor,
    uploadFile,
    getSessionMessages,
} from "./apiTutor";
import { supabase } from "../../lib/supabaseClient";

// activeSessionId comes from URL (useParams) - URL is authoritative
const ChatWindow = ({ 
    activeSessionId, 
    onFocusInputRef, 
    onSetInputRef,
    onAutoRenameSession, 
    sessions,
    quickActionState,
    onQuickActionConsumed,
}) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [postFailed, setPostFailed] = useState(false); // Track POST failure state

    const chatRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const messagesInitializedRef = useRef(null); // Track which sessionId was initialized (cold start only)
    const previousSessionIdRef = useRef(null); // Track previous sessionId to detect changes
    const messagesRef = useRef([]); // Track messages to avoid stale closure issues
    const [userName, setUserName] = useState(null);

    // Expose focus function to parent via ref callback
    useEffect(() => {
        if (onFocusInputRef) {
            onFocusInputRef.current = () => {
                textareaRef.current?.focus();
            };
        }
    }, [onFocusInputRef]);

    // Expose setInput function to parent via ref callback
    useEffect(() => {
        if (onSetInputRef) {
            onSetInputRef.current = (value) => {
                setInput(value);
                textareaRef.current?.focus();
            };
        }
    }, [onSetInputRef]);

    // Handle quick action state - set input and mode when provided
    // Only apply if session is empty (no messages) to prevent overwriting user input
    useEffect(() => {
        if (quickActionState && messages.length === 0 && !isLoadingHistory) {
            // Only apply quick action if session is empty (no messages) and not loading
            setInput(quickActionState.seed);
            // Focus input
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
            // Don't consume here - let it persist until first message is sent
        }
    }, [quickActionState, messages.length, isLoadingHistory]);

    // Fetch user's name for personalized greeting
    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const name = user?.user_metadata?.full_name || 
                           user?.user_metadata?.name || 
                           null;
                setUserName(name);
            } catch (err) {
                console.warn("Could not fetch user name:", err);
            }
        };
        fetchUserName();
    }, []);

    /* ------------------------------------------------
     * Auto–scroll logic (only when messages change)
     * ----------------------------------------------*/
    const scrollToBottom = () => {
        if (!chatRef.current) return;
        requestAnimationFrame(() => {
            chatRef.current.scrollTo({
                top: chatRef.current.scrollHeight,
                behavior: "smooth",
            });
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Sync messagesRef with messages state to avoid stale closures in useEffect
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    /* ------------------------------------------------
     * Auto–resize textarea
     * ----------------------------------------------*/
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "24px";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [input]);

    /* ------------------------------------------------
     * Load session history - STRICTLY sessionId-driven
     * Rules:
     * - If sessionId is undefined → do nothing (clear messages)
     * - If sessionId changes → ALWAYS fetch messages
     * - Never reuse previous messages for a new sessionId
     * ----------------------------------------------*/
    useEffect(() => {
        const loadMessages = async () => {
            // Rule 1: If sessionId is undefined → do nothing
            if (!activeSessionId) {
                console.log("[CHATWINDOW] sessionId is undefined - clearing messages");
                setMessages([]);
                messagesInitializedRef.current = null;
                previousSessionIdRef.current = null;
                setIsLoadingHistory(false);
                return;
            }

            // Detect session change (store previous value before updating)
            const previousSessionId = previousSessionIdRef.current;
            const sessionChanged = previousSessionId !== null && previousSessionId !== activeSessionId;
            previousSessionIdRef.current = activeSessionId;

            // Rule 2: If sessionId changes → ALWAYS clear and fetch
            // Never reuse previous messages for a new sessionId
            if (sessionChanged) {
                console.log("[CHATWINDOW] sessionId changed - clearing previous messages", {
                    previousSessionId: previousSessionId,
                    newSessionId: activeSessionId
                });
                setMessages([]); // Clear immediately - never reuse
                messagesInitializedRef.current = null; // Reset initialization state
            }

            // Log sessionId on fetch start
            console.log("[CHATWINDOW] Fetching messages for sessionId:", activeSessionId);

            setIsLoadingHistory(true);

            try {
                const apiMessages = await getSessionMessages(activeSessionId);

                // Normalize message shape IMMEDIATELY after fetch
                // CRITICAL: Ensure all messages have consistent shape with content, meta, and createdAt
                const normalizedMessages = (apiMessages || []).map((m) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content ?? "",
                    meta: m.meta ?? null,
                    createdAt: m.createdAt || m.created_at,
                }));

                // Log message count on fetch success
                console.log("[CHATWINDOW] Fetch success - message count:", normalizedMessages.length, {
                    sessionId: activeSessionId
                });

                // Always use fetched messages (never preserve previous)
                setMessages(normalizedMessages);

                // Mark this session as initialized
                messagesInitializedRef.current = activeSessionId;

                // Check if we need to auto-rename based on first assistant message
                if (normalizedMessages.length > 0) {
                    const firstAssistantMsg = normalizedMessages.find((m) => m.role === "assistant");
                    if (firstAssistantMsg && firstAssistantMsg.meta && onAutoRenameSession) {
                        // Check if session title is still default
                        const session = sessions?.find((s) => s.id === activeSessionId);
                        if (session && (session.title === "New Chat" || session.title === "New")) {
                            setTimeout(() => {
                                onAutoRenameSession(activeSessionId, firstAssistantMsg.meta, firstAssistantMsg.content);
                            }, 0);
                        }
                    }
                }
            } catch (err) {
                console.error("[CHATWINDOW] Fetch failed for sessionId:", activeSessionId, err);
                // On error, clear messages (never preserve previous for new sessionId)
                setMessages([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSessionId]); // Strictly sessionId-driven - only fetch when sessionId changes

    /* ------------------------------------------------
     * Helpers: last AI / last user messages
     * ----------------------------------------------*/
    const getLastAIMessage = () => {
        const ai = [...messages].reverse().find((m) => m.role === "assistant");
        return ai?.content || "";
    };

    const getLastUserMessage = () => {
        const user = [...messages].reverse().find((m) => m.role === "user");
        return user?.content || "";
    };

    /* ------------------------------------------------
     * Type assistant message with typing animation
     * ----------------------------------------------*/
    const typeAssistantMessage = async (fullText, messageId) => {
        if (!fullText) return;
        
        let current = "";

        for (let i = 0; i < fullText.length; i++) {
            current += fullText[i];

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId
                        ? { ...m, content: current }
                        : m
                )
            );

            // typing speed (adjust if you want)
            await new Promise((r) => setTimeout(r, 15));
        }
    };

    /* ------------------------------------------------
     * Check DB for assistant response (fallback)
     * ----------------------------------------------*/
    const checkForResponseInDB = async (sessionId, retryCount = 0) => {
        if (retryCount >= 2) return null; // Max 2 retries
        
        try {
            // Wait a bit before checking
            await new Promise((r) => setTimeout(r, 1000));
            
            const dbMessages = await getSessionMessages(sessionId);
            // Get the last assistant message from DB
            const lastAssistantMsg = [...dbMessages].reverse().find((m) => m.role === "assistant");
            
            if (lastAssistantMsg && lastAssistantMsg.content && lastAssistantMsg.content.trim()) {
                return lastAssistantMsg.content;
            }
            
            // Retry once more if no response found
            if (retryCount === 0) {
                return await checkForResponseInDB(sessionId, 1);
            }
            
            return null;
        } catch (err) {
            console.warn("Failed to check DB for response:", err);
            return null;
        }
    };

    /* ------------------------------------------------
     * Send text message
     * ----------------------------------------------*/
    const handleSend = async () => {
        if (!input.trim() || !activeSessionId) return;

        const now = new Date().toISOString();
        const text = input;

        // Clear any existing follow-ups when user sends a message manually
        setMessages((prev) =>
            prev.map((m) => {
                if (m.meta?.follow_up_generated) {
                    const { follow_up_generated, follow_up_question, ...restMeta } = m.meta;
                    return {
                        ...m,
                        meta: Object.keys(restMeta).length > 0 ? restMeta : undefined,
                    };
                }
                return m;
            })
        );

        // Push user message locally
        const userMsg = {
            id: `usr_${Date.now()}`,
            role: "user",
            content: text,
            createdAt: now,
        };
        setMessages((prev) => [...prev, userMsg]);

        setInput("");
        setIsTyping(true);

        // Create assistant message optimistically
        const botId = `bot_${Date.now()}`;
        const emptyBotMsg = {
            id: botId,
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, emptyBotMsg]);

        let responseText = null;
        let isRealError = false;
        let postFailedLocal = false; // Local variable to track POST failure (not state)

        // Diagnostic log: Confirm sessionId for POST request
        console.log("[TUTOR_FRONTEND] POST sessionId:", activeSessionId);

        try {
            // Use mode from quick action state if available (only for first message), otherwise default to "auto"
            const mode = quickActionState?.mode || "auto";
            
            const response = await sendStandaloneMessageToTutor({
                sessionId: activeSessionId,
                message: text,
                mode: mode,
                lastAIMessage: getLastAIMessage(),
                lastUserMessage: getLastUserMessage(),
            });

            // Clear quick action state after first message is sent
            if (quickActionState && onQuickActionConsumed) {
                onQuickActionConsumed();
            }

            // Use response.text (not response.response)
            responseText = response.text || response.response || "";
            
            // Extract follow-up question if present
            const followUpQuestion = response.followUpQuestion || null;
            
            if (!responseText || !responseText.trim()) {
                // Empty response - check DB as fallback
                responseText = await checkForResponseInDB(activeSessionId);
            }

            if (responseText && responseText.trim()) {
                // Update assistant message with response and follow-up metadata
                await typeAssistantMessage(responseText, botId);
                
                // Get the full response object to extract metadata
                const responseMeta = response.raw || {};
                
                // Check if this is the first assistant message before updating messages
                const currentMessages = messagesRef.current;
                const assistantMessageCount = currentMessages.filter((m) => m.role === "assistant" && m.id !== botId).length;
                const isFirstAssistantMessage = assistantMessageCount === 0;
                
                // Store follow-up question in message meta if present
                if (followUpQuestion) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === botId
                                ? {
                                      ...m,
                                      meta: {
                                          ...m.meta,
                                          follow_up_generated: true,
                                          follow_up_question: followUpQuestion,
                                          ...responseMeta, // Include all metadata from response
                                      },
                                  }
                                : m
                        )
                    );
                } else if (responseMeta && Object.keys(responseMeta).length > 0) {
                    // Store metadata even if no follow-up question
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === botId
                                ? {
                                      ...m,
                                      meta: {
                                          ...m.meta,
                                          ...responseMeta,
                                      },
                                  }
                                : m
                        )
                    );
                }
                
                // Auto-rename if this is the first assistant message
                if (isFirstAssistantMessage && onAutoRenameSession) {
                    // Extract metadata from response
                    const messageMeta = responseMeta || {};
                    // Use setTimeout to avoid state update during render
                    setTimeout(() => {
                        onAutoRenameSession(activeSessionId, messageMeta, responseText);
                    }, 0);
                }
                
                postFailedLocal = false; // POST succeeded
            } else {
                // No response found - this is a real error
                isRealError = true;
                postFailedLocal = true; // POST failed
            }

        } catch (error) {
            console.error("[TUTOR_FRONTEND] Error sending message:", error);
            
            // Handle PNG_NOT_READY gracefully - show calm message, keep chat responsive
            if (error.code === "PNG_NOT_READY") {
                responseText = "Slides are still being prepared. Visual understanding will be available once preparation completes.";
                isRealError = false; // Not a real error, just informational
                postFailedLocal = false; // Not a POST failure
                await typeAssistantMessage(responseText, botId);
            } else {
                // Check if this is a real backend error (4xx/5xx) vs network/timeout
                const isNetworkError = error.message?.includes("fetch") || 
                                      error.message?.includes("network") ||
                                      error.message?.includes("timeout");
                
                if (isNetworkError) {
                    // Network/timeout error - check DB for response that might have been saved
                    responseText = await checkForResponseInDB(activeSessionId);
                    
                    if (responseText && responseText.trim()) {
                        // Response exists in DB - update message instead of showing error
                        await typeAssistantMessage(responseText, botId);
                        postFailedLocal = false; // Response found, not a failure
                    } else {
                        // No response in DB - this might be a real error, but don't show error message yet
                        // Keep the empty message and let user retry
                        isRealError = false; // Don't show error for network issues
                        postFailedLocal = true; // POST failed (network issue)
                    }
                } else {
                    // Real backend error (4xx/5xx)
                    isRealError = true;
                    postFailedLocal = true; // POST failed (backend error)
                }
            }
        } finally {
            setIsTyping(false);
            
            // Only show error message if POST failed AND no response was found
            // This ensures error only appears on POST failure, not on mount/tab change/rehydration
            if (postFailedLocal && isRealError && (!responseText || !responseText.trim())) {
                // Check DB one more time before showing error (in case response was saved after our check)
                const finalCheck = await checkForResponseInDB(activeSessionId);
                
                if (finalCheck && finalCheck.trim()) {
                    // Response found in final check - update message instead of showing error
                    await typeAssistantMessage(finalCheck, botId);
                    setPostFailed(false); // Response found, clear failure state
                } else {
                    // No response found - show error message (only on POST failure)
                    setPostFailed(true); // Set state for UI tracking
                    setMessages((prev) => 
                        prev.map((m) =>
                            m.id === botId
                                ? {
                                    ...m,
                                    content: "⚠️ Astra was unable to answer. Please try again.",
                                }
                                : m
                        )
                    );
                }
            } else {
                // Clear failure state if POST succeeded
                setPostFailed(false);
            }
        }
    };

    /* ------------------------------------------------
     * File upload → attach to Astra
     * ----------------------------------------------*/
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeSessionId) return;

        setIsUploading(true);

        try {
            const uploadRes = await uploadFile(file);

            // Message to show user that file was uploaded
            const userMsg = {
                id: `upl_${Date.now()}`,
                role: "user",
                content: `📄 Uploaded file: **${file.name}**. Extracting and processing...`,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setIsTyping(true);

            const response = await sendStandaloneMessageToTutor({
                sessionId: activeSessionId,
                message: uploadRes.extracted_text,
                lastAIMessage: getLastAIMessage(),
                lastUserMessage: getLastUserMessage(),
            });

            // Use response.text (not response.response)
            const responseText = response.text || response.response || "";
            const followUpQuestion = response.followUpQuestion || null;

            const botMsg = {
                id: `bot_${Date.now()}`,
                role: "assistant",
                content: responseText,
                createdAt: new Date().toISOString(),
                meta: followUpQuestion
                    ? {
                          follow_up_generated: true,
                          follow_up_question: followUpQuestion,
                      }
                    : undefined,
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload file");
        } finally {
            setIsTyping(false);
            setIsUploading(false);
            // reset file input so same file can be re-selected if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Handle sending follow-up question
    const handleSendFollowUp = async (followUpText) => {
        if (!followUpText || !activeSessionId) return;
        
        // Clear any existing follow-ups by removing meta from all messages
        setMessages((prev) =>
            prev.map((m) => {
                if (m.meta?.follow_up_generated) {
                    const { follow_up_generated, follow_up_question, ...restMeta } = m.meta;
                    return {
                        ...m,
                        meta: Object.keys(restMeta).length > 0 ? restMeta : undefined,
                    };
                }
                return m;
            })
        );
        
        // Set input and trigger send
        setInput(followUpText);
        
        // Wait for state update, then send
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Create user message and send
        const now = new Date().toISOString();
        const userMsg = {
            id: `usr_${Date.now()}`,
            role: "user",
            content: followUpText,
            createdAt: now,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Create assistant message optimistically
        const botId = `bot_${Date.now()}`;
        const emptyBotMsg = {
            id: botId,
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, emptyBotMsg]);

        let responseText = null;
        let isRealError = false;
        let postFailedLocal = false;

        try {
            // Use mode from quick action state if available, otherwise default to "auto"
            const mode = quickActionState?.mode || "auto";
            
            const response = await sendStandaloneMessageToTutor({
                sessionId: activeSessionId,
                message: followUpText,
                mode: mode,
                lastAIMessage: getLastAIMessage(),
                lastUserMessage: getLastUserMessage(),
            });

            responseText = response.text || response.response || "";
            const followUpQuestion = response.followUpQuestion || null;
            
            if (!responseText || !responseText.trim()) {
                responseText = await checkForResponseInDB(activeSessionId);
            }

            if (responseText && responseText.trim()) {
                await typeAssistantMessage(responseText, botId);
                
                const responseMeta = response.raw || {};
                
                // Check if this is the first assistant message before updating messages
                const currentMessages = messagesRef.current;
                const assistantMessageCount = currentMessages.filter((m) => m.role === "assistant" && m.id !== botId).length;
                const isFirstAssistantMessage = assistantMessageCount === 0;
                
                if (followUpQuestion) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === botId
                                ? {
                                      ...m,
                                      meta: {
                                          ...m.meta,
                                          follow_up_generated: true,
                                          follow_up_question: followUpQuestion,
                                          ...responseMeta,
                                      },
                                  }
                                : m
                        )
                    );
                } else if (responseMeta && Object.keys(responseMeta).length > 0) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === botId
                                ? {
                                      ...m,
                                      meta: {
                                          ...m.meta,
                                          ...responseMeta,
                                      },
                                  }
                                : m
                        )
                    );
                }
                
                // Auto-rename if this is the first assistant message
                if (isFirstAssistantMessage && onAutoRenameSession) {
                    const messageMeta = responseMeta || {};
                    setTimeout(() => {
                        onAutoRenameSession(activeSessionId, messageMeta, responseText);
                    }, 0);
                }
                
                postFailedLocal = false;
            } else {
                isRealError = true;
                postFailedLocal = true;
            }
        } catch (error) {
            console.error("[TUTOR_FRONTEND] Error sending follow-up:", error);
            
            if (error.code === "PNG_NOT_READY") {
                responseText = "Slides are still being prepared. Visual understanding will be available once preparation completes.";
                isRealError = false;
                postFailedLocal = false;
                await typeAssistantMessage(responseText, botId);
            } else {
                const isNetworkError = error.message?.includes("fetch") || 
                                      error.message?.includes("network") ||
                                      error.message?.includes("timeout");
                
                if (isNetworkError) {
                    responseText = await checkForResponseInDB(activeSessionId);
                    
                    if (responseText && responseText.trim()) {
                        await typeAssistantMessage(responseText, botId);
                        postFailedLocal = false;
                    } else {
                        isRealError = false;
                        postFailedLocal = true;
                    }
                } else {
                    isRealError = true;
                    postFailedLocal = true;
                }
            }
        } finally {
            setIsTyping(false);
            
            if (postFailedLocal && isRealError && (!responseText || !responseText.trim())) {
                const finalCheck = await checkForResponseInDB(activeSessionId);
                
                if (finalCheck && finalCheck.trim()) {
                    await typeAssistantMessage(finalCheck, botId);
                    setPostFailed(false);
                } else {
                    setPostFailed(true);
                    setMessages((prev) => 
                        prev.map((m) =>
                            m.id === botId
                                ? {
                                      ...m,
                                      content: "⚠️ Astra was unable to answer. Please try again.",
                                  }
                                : m
                        )
                    );
                }
            } else {
                setPostFailed(false);
            }
        }
    };

    /* ------------------------------------------------
     * Rendering
     * ----------------------------------------------*/
    // Empty state must depend on RAW messages length (not filtered)
    const showEmptyState = messages.length === 0;

    return (
        <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#1a1d24] relative">
            {/* Tutor State Bar */}
            <div className="h-8 flex-shrink-0 border-b border-white/5 bg-[#1a1d24] px-8 flex items-center text-xs text-muted">
                <span className="flex items-center gap-2">
                    <span className="text-teal font-medium">Astra</span>
                    <span>•</span>
                    <span>Early Clinical</span>
                    <span>•</span>
                    <span>Medicine</span>
                    <span>•</span>
                    <span>Tutor Mode</span>
                </span>
            </div>

            {/* Messages area - ONLY SCROLLER */}
            <div
                ref={chatRef}
                className="flex-1 overflow-y-auto overscroll-contain px-8 py-6 flex flex-col space-y-6 w-full relative scroll-smooth min-h-0"
                style={{ overscrollBehavior: 'contain' }}
            >
                {showEmptyState && (
                    <div className="flex flex-1 items-center justify-center text-muted text-sm">
                        Select or create a chat to start with Astra.
                    </div>
                )}

                {!showEmptyState &&
                    (() => {
                        // Filter messages by role (ONLY render condition)
                        // Messages with meta === null must still render
                        const validMessages = messages.filter((msg) => {
                            return msg.role === "user" || msg.role === "assistant";
                        });
                        
                        return validMessages.map((msg, index) => {
                            // Check if this is the last assistant message with follow-up
                            const isLastAssistant = msg.role === "assistant" && 
                                msg.meta?.follow_up_generated === true &&
                                !validMessages.slice(index + 1).some(m => m.role === "assistant");
                            
                            return (
                                <React.Fragment key={msg.id}>
                                    <MessageBubble message={msg} />
                                    {isLastAssistant && msg.meta?.follow_up_question && (
                                        <div className="ml-11">
                                            <FollowUpPrompt
                                                followUpQuestion={msg.meta.follow_up_question}
                                                onSendFollowUp={handleSendFollowUp}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        });
                    })()}

                {isTyping && (
                    <div className="flex justify-start w-full group relative">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        </div>
                        <div className="bg-[#1c1f26] border border-[#2a2f39] text-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-[0_0_10px_rgba(0,0,0,0.25)]">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-[#00e4d7] animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-[#00e4d7] animate-bounce delay-150" />
                                <div className="w-2 h-2 rounded-full bg-[#00e4d7] animate-bounce delay-300" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input row */}
            <div className="flex-shrink-0 border-t border-[#1f2127] p-6 bg-[#0f1115]/95 backdrop-blur">
                <div className="w-full relative">
                    <div className="w-full bg-[#0f1116]/90 backdrop-blur-md border border-white/5 rounded-full px-6 py-3 shadow-inner flex items-center space-x-4 focus-within:border-teal/50 focus-within:ring-1 focus-within:ring-teal/50 transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                // Clear follow-ups when user types manually
                                if (e.target.value.trim()) {
                                    setMessages((prev) =>
                                        prev.map((m) => {
                                            if (m.meta?.follow_up_generated) {
                                                const { follow_up_generated, follow_up_question, ...restMeta } = m.meta;
                                                return {
                                                    ...m,
                                                    meta: Object.keys(restMeta).length > 0 ? restMeta : undefined,
                                                };
                                            }
                                            return m;
                                        })
                                    );
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask a question or describe what you're studying..."
                            className="flex-1 bg-transparent border-none text-white placeholder-gray-500 outline-none resize-none max-h-[200px] py-1"
                            rows={1}
                            style={{ minHeight: "24px" }}
                            disabled={!activeSessionId}
                        />

                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                                accept=".pdf,.ppt,.pptx,.txt,.md,.doc,.docx"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || !activeSessionId}
                                className="text-muted hover:text-white transition-colors disabled:opacity-40"
                                title="Upload File"
                            >
                                <Paperclip size={20} />
                            </button>

                            <button
                                className="text-muted hover:text-white transition-colors"
                                title="Voice Input (Coming Soon)"
                            >
                                <Mic size={20} />
                            </button>

                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping || !activeSessionId}
                                className="p-2 bg-teal hover:bg-teal-neon text-black rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-3">
                    <p className="text-[10px] text-muted">
                        AI can make mistakes. Verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
