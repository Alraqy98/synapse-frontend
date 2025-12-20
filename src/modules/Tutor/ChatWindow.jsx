// src/modules/tutor/ChatWindow.jsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import MessageBubble from "./MessageBubble";
import {
    sendMessageToTutor,
    uploadFile,
    getSessionMessages,
} from "./apiTutor";

const ChatWindow = ({ activeSessionId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const chatRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

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
     * Load session history when activeSessionId changes
     * ----------------------------------------------*/
    useEffect(() => {
        const loadMessages = async () => {
            if (!activeSessionId) {
                setMessages([]);
                return;
            }

            setIsLoadingHistory(true);

            try {
                const data = await getSessionMessages(activeSessionId);

                if (!data || data.length === 0) {
                    // Fresh session → show one welcome message
                    setMessages([
                        {
                            id: "welcome",
                            role: "assistant",
                            content:
                                "Hello! I am Astra — your dedicated AI medical tutor. How can I help you today?",
                            createdAt: new Date().toISOString(),
                        },
                    ]);
                    return;
                }

                setMessages(
                    data.map((m) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        createdAt: m.createdAt,
                    }))
                );
            } catch (err) {
                console.error("Failed to load session messages:", err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadMessages();
    }, [activeSessionId]);

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

        try {
            const response = await sendMessageToTutor({
                sessionId: activeSessionId,
                message: text,
                lastAIMessage: getLastAIMessage(),
                lastUserMessage: getLastUserMessage(),
            });

            // Use response.text (not response.response)
            responseText = response.text || response.response || "";
            
            if (!responseText || !responseText.trim()) {
                // Empty response - check DB as fallback
                responseText = await checkForResponseInDB(activeSessionId);
            }

            if (responseText && responseText.trim()) {
                // Update assistant message with response
                await typeAssistantMessage(responseText, botId);
            } else {
                // No response found - this is a real error
                isRealError = true;
            }

        } catch (error) {
            console.error("Error sending message:", error);
            
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
                } else {
                    // No response in DB - this might be a real error, but don't show error message yet
                    // Keep the empty message and let user retry
                    isRealError = false; // Don't show error for network issues
                }
            } else {
                // Real backend error (4xx/5xx)
                isRealError = true;
            }
        } finally {
            setIsTyping(false);
            
            // Only show error message if it's a real backend error AND no response was found
            if (isRealError && (!responseText || !responseText.trim())) {
                // Check DB one more time before showing error (in case response was saved after our check)
                const finalCheck = await checkForResponseInDB(activeSessionId);
                
                if (finalCheck && finalCheck.trim()) {
                    // Response found in final check - update message instead of showing error
                    await typeAssistantMessage(finalCheck, botId);
                } else {
                    // No response found - show error message
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

            const response = await sendMessageToTutor({
                sessionId: activeSessionId,
                message: uploadRes.extracted_text,
                lastAIMessage: getLastAIMessage(),
                lastUserMessage: getLastUserMessage(),
                fileId: uploadRes.file_id,
                // page left null here → normal global context
            });

            // Use response.text (not response.response)
            const responseText = response.text || response.response || "";
            
            const botMsg = {
                id: `bot_${Date.now()}`,
                role: "assistant",
                content: responseText,
                createdAt: new Date().toISOString(),
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

    /* ------------------------------------------------
     * Rendering
     * ----------------------------------------------*/
    const showEmptyState = !activeSessionId && !isLoadingHistory;

    return (
        <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#0f1115] relative">
            {/* Messages area */}
            <div
                ref={chatRef}
                className="flex-1 overflow-y-auto px-8 py-6 flex flex-col space-y-6 w-full relative scroll-smooth"
            >
                {showEmptyState && (
                    <div className="flex flex-1 items-center justify-center text-muted text-sm">
                        Select or create a chat to start with Astra.
                    </div>
                )}

                {!showEmptyState &&
                    messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}

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
            <div className="border-t border-[#1f2127] p-6 bg-[#0f1115]/95 backdrop-blur">
                <div className="w-full relative">
                    <div className="w-full bg-[#0f1116]/90 backdrop-blur-md border border-white/5 rounded-full px-6 py-3 shadow-inner flex items-center space-x-4 focus-within:border-teal/50 focus-within:ring-1 focus-within:ring-teal/50 transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask anything..."
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
