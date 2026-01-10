import React, { useEffect, useState } from "react";

export default function CardViewer({ card, onGrade }) {
    const [flipped, setFlipped] = useState(false);
    const [showRef, setShowRef] = useState(false);

    useEffect(() => {
        setFlipped(false);
        setShowRef(false);
    }, [card?.id]);

    if (!card) return null;

    // ------------------------------
    // 🔥 FIX 1: Normalize ANY answer
    // ------------------------------
    function normalizeAnswer(raw) {
        if (!raw) return ["No answer provided."];

        // If it's already a string → split into lines
        if (typeof raw === "string") {
            return raw
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length);
        }

        // If it's an array → flatten into strings
        if (Array.isArray(raw)) {
            return raw.map((item) =>
                typeof item === "string" ? item : JSON.stringify(item)
            );
        }

        // If it's an object → convert to bullet structure
        if (typeof raw === "object") {
            let lines = [];

            for (const key of Object.keys(raw)) {
                const value = raw[key];

                if (Array.isArray(value)) {
                    lines.push(`${key}: ${value.join(", ")}`);
                } else if (typeof value === "object") {
                    lines.push(`${key}: ${JSON.stringify(value)}`);
                } else {
                    lines.push(`${key}: ${value}`);
                }
            }

            return lines;
        }

        // Fallback
        return [String(raw)];
    }

    // Normalize answer into bullet-safe string array
    const lines = normalizeAnswer(card.answer);

    const bulletItems = lines.map((l) =>
        l.startsWith("•") ? l : `• ${l}`
    );

    // ------------------------------
    // Clean reference rendering
    // ------------------------------
    const refPage = card.reference_page || null;
    const refTitle = card.source_file_title || null;
    const refFallback = card.source_file_id || null;

    const label = flipped ? "ANSWER" : "QUESTION";

    return (
        <div className="w-full flex flex-col items-center select-none">
            <div
                className="
                    relative w-full max-w-3xl
                    rounded-3xl border border-white/10
                    bg-gradient-to-br from-white/5 via-white/[0.03] to-black/40
                    shadow-[0_0_60px_rgba(0,255,200,0.12)]
                    px-8 py-12
                    transition-all duration-300 ease-out
                    hover:border-teal/70 hover:shadow-[0_0_80px_rgba(0,255,200,0.20)]
                    cursor-pointer
                    overflow-y-auto
                    max-h-[65vh]
                "
                onClick={() => setFlipped((v) => !v)}
            >
                <div className="text-center text-xs tracking-[0.25em] text-teal mb-6 uppercase">
                    {label}
                </div>

                {!flipped && (
                    <div className="text-center text-lg font-semibold text-white">
                        {card.question || "No question provided."}
                    </div>
                )}

                {flipped && (
                    <div className="text-left text-sm md:text-base text-white leading-relaxed space-y-2">
                        {bulletItems.map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="mt-[6px] text-teal text-xs">•</span>
                                <p className="text-white/90">
                                    {line.replace(/^•\s*/, "")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    className="
                        absolute bottom-4 right-4 w-7 h-7 rounded-full
                        border border-white/20 flex items-center justify-center
                        text-xs text-white/70 bg-black/40 hover:border-teal hover:text-teal
                        transition backdrop-blur-sm
                    "
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowRef((v) => !v);
                    }}
                >
                    i
                </button>

                {showRef && (
                    <div
                        className="
                            absolute bottom-16 right-4
                            max-w-xs text-[11px] text-muted
                            bg-black/80 border border-white/15
                            rounded-xl px-3 py-2 shadow-xl backdrop-blur
                        "
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-white/90 space-y-1">
                            {refPage && <div><strong>Page:</strong> {refPage}</div>}

                            {refTitle ? (
                                <div><strong>File:</strong> {refTitle}</div>
                            ) : refFallback ? (
                                <div><strong>File:</strong> {refFallback}</div>
                            ) : (
                                <div>No reference available.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Grading Buttons - Only show when flipped AND onGrade is provided */}
            {flipped && onGrade && (
                <div className="mt-4 w-full max-w-3xl">
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGrade && card?.id) {
                                    onGrade(card.id, "correct");
                                }
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium"
                        >
                            Correct
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGrade && card?.id) {
                                    onGrade(card.id, "not_sure");
                                }
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium"
                        >
                            Not sure
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGrade && card?.id) {
                                    onGrade(card.id, "incorrect");
                                }
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium"
                        >
                            Incorrect
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-3 text-[11px] text-muted text-center">
                Click to flip. Use arrows to move between cards.
            </div>
        </div>
    );
}
