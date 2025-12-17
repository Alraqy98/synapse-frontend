// src/modules/flashcards/DeckView.jsx

import React, { useEffect, useState } from "react";
import { getDeck, getDeckCards } from "./apiFlashcards";
import CardViewer from "./CardViewer";

export default function DeckView({ deckId, goBack }) {
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // ------------------------------------------------------------
    // LOAD ONE TIME + POLLING WHILE GENERATING
    // ------------------------------------------------------------
    useEffect(() => {
        if (!deckId) return;

        let poller = null;

        async function loadOnce() {
            try {
                const d = await getDeck(deckId);
                setDeck(d || null);

                // load cards only if not generating
                if (d && !d.generating) {
                    const c = await getDeckCards(deckId);
                    setCards(Array.isArray(c) ? c : []);
                    setIndex(0);
                }
            } catch (err) {
                console.error("❌ Deck load error:", err);
            } finally {
                setLoading(false);
            }
        }

        // Initial load
        loadOnce();

        // 🔥 Poll every 3 seconds ONLY while generating
        poller = setInterval(async () => {
            try {
                const d = await getDeck(deckId);
                if (!d) return;

                setDeck(d);

                if (!d.generating) {
                    // finished → load cards, then stop polling
                    const c = await getDeckCards(deckId);
                    setCards(Array.isArray(c) ? c : []);
                    setIndex(0);

                    clearInterval(poller);
                    poller = null;
                }
            } catch (err) {
                console.error("❌ Deck polling error:", err);
            }
        }, 3000);

        return () => {
            if (poller) clearInterval(poller);
        };
    }, [deckId]);

    // ------------------------------------------------------------
    // UI STATES
    // ------------------------------------------------------------
    if (loading) {
        return <div className="text-muted pt-10">Loading deck…</div>;
    }

    if (!deck) {
        return (
            <div className="text-muted pt-10">
                Deck not found.
                <button className="btn-secondary ml-3" onClick={goBack}>
                    ← Back
                </button>
            </div>
        );
    }

    const current = cards[index] || null;
    const total = cards.length;

    const atFirst = index === 0;
    const atLast = index === total - 1;

    function goPrev() {
        if (!atFirst) setIndex((i) => i - 1);
    }

    function goNext() {
        if (!atLast) setIndex((i) => i + 1);
        else goBack();
    }

    return (
        <div className="w-full h-full flex flex-col items-center pt-6 relative">

            {/* HEADER */}
            <div className="w-full max-w-5xl flex items-center justify-between mb-6 px-2">
                <button
                    className="btn-secondary px-4 py-2"
                    type="button"
                    onClick={goBack}
                >
                    ← Back
                </button>

                <div className="text-right">
                    <h1 className="text-xl md:text-2xl font-bold text-white">
                        {deck.title || "Untitled Deck"}
                    </h1>

                    <p className="text-[11px] text-muted mt-1">
                        {deck.card_count || total} cards • Mode:{" "}
                        <span className="text-teal font-medium">
                            {deck.mode === "high_yield"
                                ? "High-Yield"
                                : deck.mode === "deep"
                                    ? "Deep Mastery"
                                    : "Turbo Recall"}
                        </span>
                    </p>
                </div>
            </div>

            {/* --------------------------------------------------------
               GENERATING OVERLAY
            --------------------------------------------------------- */}
            {deck.generating && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <div className="animate-spin h-10 w-10 border-4 border-teal border-t-transparent rounded-full mb-4"></div>
                    <div className="text-white text-lg font-semibold">
                        Generating flashcards…
                    </div>
                    <div className="text-muted text-sm mt-2">
                        You can leave this page — generation continues in background.
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------
               NO CARDS YET (but generation finished)
            --------------------------------------------------------- */}
            {!deck.generating && !current && (
                <div className="text-muted text-sm mt-10">
                    No cards generated for this deck yet.
                </div>
            )}

            {/* --------------------------------------------------------
               CARD RENDER
            --------------------------------------------------------- */}
            {!deck.generating && current && (
                <>
                    <CardViewer key={current.id} card={current} />

                    {/* Navigation */}
                    <div className="mt-6 flex items-center gap-8">
                        <button
                            className="btn-secondary px-4 py-2"
                            type="button"
                            onClick={goPrev}
                            disabled={atFirst}
                        >
                            ← Previous
                        </button>

                        <span className="text-xs text-muted tracking-wide">
                            Card {index + 1} / {total}
                        </span>

                        <button
                            className="btn btn-primary px-6 py-2"
                            type="button"
                            onClick={goNext}
                        >
                            {atLast ? "Finish" : "Next →"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
