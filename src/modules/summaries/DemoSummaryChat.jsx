// src/modules/summaries/DemoSummaryChat.jsx
// Isolated demo-only Astra chat component for summaries - NO backend calls, NO persistence, NO tutor logic

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useDemo } from "../demo/DemoContext";

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
                    data-demo={!isUser ? "demo-summary-response" : undefined}
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
 * DemoSummaryChat - Demo-only Astra chat component for summaries
 * 
 * Features:
 * - Local-only state (useState)
 * - No backend calls
 * - No tutor session logic
 * - No persistence
 * - Handles text selection → Ask Astra flow
 * - Instantly renders canned demo response
 */
export default function DemoSummaryChat({ summary }) {
    const { isDemo } = useDemo() || {};
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (selectedText = null) => {
        const textToSend = selectedText || chatInput.trim();
        if (!textToSend) return;

        setChatInput("");

        const userMsgId = `demo-user-${Date.now()}`;
        const userMsg = { 
            id: userMsgId, 
            role: "user", 
            content: selectedText ? `About this selection: "${textToSend}"` : textToSend 
        };
        setMessages((prev) => [...prev, userMsg]);

        // Instantly render demo response (no delay, no spinner)
        const assistantMsgId = `demo-assistant-${Date.now()}`;
        const assistantMsg = {
            id: assistantMsgId,
            role: "assistant",
            content: `This is a demo response about the selected text: "${textToSend.substring(0, 50)}...". In the real app, Astra would provide detailed explanations based on the summary content and your selection.`,
        };
        setMessages((prev) => [...prev, assistantMsg]);
    };

    // Expose handleSend for external call (from selection bubble)
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.demoSummaryChatSend = (selectedText) => {
                handleSend(selectedText);
            };
        }
        return () => {
            if (typeof window !== "undefined") {
                delete window.demoSummaryChatSend;
            }
        };
    }, []);

    return (
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
                        Chat • <span className="text-white">{summary?.title || "Demo Summary"}</span>
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-white/5 bg-[#1a1d24]">
                    <div className="flex items-center gap-2 bg-[#0f1115] border border-white/10 px-3 py-2 rounded-lg">
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
                            placeholder="Ask Astra about this summary…"
                            className="flex-1 bg-transparent text-sm text-white outline-none"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleSend();
                            }}
                            disabled={!chatInput.trim()}
                            className="p-1.5 bg-teal text-black rounded hover:bg-teal-neon disabled:opacity-40"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

