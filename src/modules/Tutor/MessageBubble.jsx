// src/modules/tutor/MessageBubble.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { Bot, Copy, Bookmark, Volume2 } from "lucide-react";

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
const copyToClipboard = (text) => {
    if (text) navigator.clipboard?.writeText(text).catch(() => { });
};

const speakText = (text) => {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis || !text) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
};

// ----------------------------------------------------
// Component
// ----------------------------------------------------
const MessageBubble = ({ message, onBookmark, onPlayAudio }) => {
    const isUser = message.role === "user";

    const ts = message.createdAt || message.id || Date.now();
    const timestamp = new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const handleBookmark = () => {
        onBookmark ? onBookmark(message) : console.log("bookmark:", message);
    };

    const handlePlayAudio = () => {
        onPlayAudio ? onPlayAudio(message) : speakText(message.content);
    };

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
                >
                    {isUser ? (
                        <div>{message.content}</div>
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
                                    <ul className="list-disc ml-5 space-y-1">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal ml-5 space-y-1">{children}</ol>
                                ),
                                li: ({ children }) => <li className="leading-snug">{children}</li>,
                                table: ({ children }) => (
                                    <div className="overflow-x-auto my-3">
                                        <table className="w-full text-sm border-collapse">
                                            {children}
                                        </table>
                                    </div>
                                ),
                                th: ({ children }) => (
                                    <th className="border border-white/10 px-2 py-1 bg-white/5 text-teal text-left">
                                        {children}
                                    </th>
                                ),
                                td: ({ children }) => (
                                    <td className="border border-white/10 px-2 py-1">{children}</td>
                                ),
                                code({ inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    if (!inline && match) {
                                        return (
                                            <div className="relative my-4 group">
                                                <div className="absolute -top-3 right-2 text-xs text-muted bg-[#0f1115] px-2 py-1 rounded border border-white/10">
                                                    {match[1]}
                                                </div>
                                                <pre className="bg-[#0f1115] p-4 rounded-xl border border-white/10 overflow-x-auto text-xs">
                                                    <code {...props}>{children}</code>
                                                </pre>
                                            </div>
                                        );
                                    }
                                    return (
                                        <code
                                            className="bg-white/10 px-1.5 py-0.5 rounded text-teal font-mono text-xs"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>

                {/* Timestamp */}
                <span
                    className={`text-[10px] text-white/40 mt-1 px-1 ${isUser ? "text-right" : "text-left"
                        }`}
                >
                    {timestamp}
                </span>

                {/* Quick Actions (AI only) */}
                {!isUser && (
                    <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-0.5">
                        <button
                            onClick={() => copyToClipboard(message.content)}
                            className="text-teal/60 hover:text-teal transition-colors p-1 rounded-md hover:bg-teal/10"
                            title="Copy"
                        >
                            <Copy size={14} />
                        </button>

                        <button
                            onClick={handleBookmark}
                            className="text-teal/60 hover:text-teal transition-colors p-1 rounded-md hover:bg-teal/10"
                            title="Save"
                        >
                            <Bookmark size={14} />
                        </button>

                        <button
                            onClick={handlePlayAudio}
                            className="text-teal/60 hover:text-teal transition-colors p-1 rounded-md hover:bg-teal/10"
                            title="Read aloud"
                        >
                            <Volume2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
