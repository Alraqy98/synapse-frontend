// src/modules/Library/DemoAstraChat.jsx
// Isolated demo-only Astra chat component - NO backend calls, NO persistence, NO tutor logic

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useDemo } from "../demo/DemoContext";
import { DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT, demoAstraExplainImageResponse } from "../demo/demoData/demoAstra";

// MessageBubble component (local copy, no imports from tutor)
const MessageBubble = ({ message }) => {
    const isUser = message.role === "user";

    return (
        <div
            className={`flex w-full mb-6 group animate-[fadeIn_0.25s_ease-out]
            ${isUser ? "justify-end" : "justify-start"}`}
        >
            {/* AI Avatar */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-teal-500/15 text-teal-300 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                    <Bot size={16} />
                </div>
            )}

            <div className={`flex flex-col max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                {/* Label */}
                <span
                    className={`text-[10px] mb-1 tracking-wide
                    ${isUser ? "text-teal/70 pr-1" : "text-teal/60 pl-1"}`}
                >
                    {isUser ? "You" : "Astra"}
                </span>

                {/* Bubble */}
                <div
                    className={`
                        px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative
                        max-w-full w-full whitespace-pre-wrap break-words overflow-hidden
                        ${isUser
                            ? "bg-[#00e4d7]/10 border border-[#00e4d7]/40 text-[#00f7e9] rounded-br-sm"
                            : "bg-[#1c1f26] border border-[#2a2f39] text-white rounded-bl-sm"}
                    `}
                    style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                    }}
                    data-demo={!isUser ? "astra-response-bubble" : undefined}
                >
                    {isUser ? (
                        message.content
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="text-lg font-bold text-teal mb-2">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-base font-semibold text-teal/90 mt-3 mb-1">
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 className="text-sm font-semibold text-teal/80 mt-2 mb-1">
                                        {children}
                                    </h3>
                                ),
                                strong: ({ children }) => (
                                    <strong className="font-semibold text-blue-200">{children}</strong>
                                ),
                                em: ({ children }) => (
                                    <em className="italic text-gray-300">{children}</em>
                                ),
                                a: ({ href, children }) => (
                                    <a
                                        className="text-teal underline hover:text-teal-neon"
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {children}
                                    </a>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                                ),
                                li: ({ children }) => (
                                    <li className="text-gray-300">{children}</li>
                                ),
                                p: ({ children }) => (
                                    <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                code: ({ children, className }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                        <code className="bg-[#2a2f39] px-1.5 py-0.5 rounded text-xs text-teal">
                                            {children}
                                        </code>
                                    ) : (
                                        <code className={className}>{children}</code>
                                    );
                                },
                                pre: ({ children }) => (
                                    <pre className="bg-[#0f1115] p-3 rounded-lg overflow-x-auto my-2">
                                        {children}
                                    </pre>
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * DemoAstraChat - Demo-only Astra chat component
 * 
 * Features:
 * - Local-only state (useState)
 * - No backend calls
 * - No tutor session logic
 * - No persistence
 * - Auto-types and sends "Explain this image" on Step 3
 * - Instantly renders canned demo response
 */
export default function DemoAstraChat({ file, activePage }) {
    const { isDemo, currentStep, nextStep } = useDemo() || {};
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Step 3: Auto-show response (no user interaction needed)
    useEffect(() => {
        if (!isDemo || currentStep !== 3) return;
        if (!file || file.id !== "demo-file-ct") return; // Only for demo file
        if (messages.length > 0) return; // Already shown

        // Auto-show user message and Astra response immediately
        const timer = setTimeout(() => {
            const userMsgId = `demo-user-${Date.now()}`;
            const userMsg = { id: userMsgId, role: "user", content: DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT };
            
            const assistantMsgId = `demo-assistant-${Date.now()}`;
            const assistantMsg = {
                id: assistantMsgId,
                role: "assistant",
                content: demoAstraExplainImageResponse,
            };
            
            setMessages([userMsg, assistantMsg]);
            setChatInput(DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT); // Prefill input for visual consistency
        }, 500);

        return () => clearTimeout(timer);
    }, [isDemo, currentStep, file, messages.length]);

    const handleSend = () => {
        if (!chatInput.trim()) return;

        const msg = chatInput;
        setChatInput("");

        const userMsgId = `demo-user-${Date.now()}`;
        const userMsg = { id: userMsgId, role: "user", content: msg };
        setMessages((prev) => [...prev, userMsg]);

        // In demo mode, return canned response for "Explain this image", otherwise empty
        if (msg.toLowerCase().includes("explain this image")) {
            const assistantMsgId = `demo-assistant-${Date.now()}`;
            const assistantMsg = {
                id: assistantMsgId,
                role: "assistant",
                content: demoAstraExplainImageResponse,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            
            // Step 3: After user sends and receives response, auto-advance to Step 4
            // Small delay to ensure message is rendered before advancing
            setTimeout(() => {
                if (currentStep === 3) {
                    nextStep?.();
                }
            }, 500);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-[#0f1115] overflow-hidden">
            <div className="p-3 border-b border-white/5 text-xs text-muted uppercase tracking-wider flex justify-between">
                <span>
                    Chat • <span className="text-white">{file?.title || "Demo File"}</span>
                </span>
                <span className="text-teal/60">
                    Demo Mode • Page {activePage || 1}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-white/5 bg-[#1a1d24]">
                <div 
                    className="flex items-center gap-2 bg-[#0f1115] border border-white/10 px-3 py-2 rounded-lg"
                    data-demo="astra-chat-container"
                    onClick={(e) => {
                        // Stop propagation for container clicks
                        e.stopPropagation();
                    }}
                >
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.stopPropagation();
                                handleSend();
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Ask Astra about this page or the whole file…"
                        className="flex-1 bg-transparent text-sm text-white outline-none"
                        data-demo="astra-chat-input"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleSend();
                        }}
                        disabled={!chatInput.trim()}
                        className="p-1.5 bg-teal text-black rounded hover:bg-teal-neon disabled:opacity-40"
                        data-demo="astra-chat-send"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

