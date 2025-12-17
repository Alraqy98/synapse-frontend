import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDeckCards } from "./apiFlashcards";
import CardViewer from "./CardViewer";

export default function ReviewScreen({ deckId, goBack }) {
    const [cards, setCards] = useState([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [resetFlipKey, setResetFlipKey] = useState(0); // Forces CardViewer flip reset

    useEffect(() => {
        load();
    }, [deckId]);

    async function load() {
        setLoading(true);
        const data = await getDeckCards(deckId);
        setCards(data || []);
        setIndex(0);
        setResetFlipKey(prev => prev + 1);
        setLoading(false);
    }

    if (loading) {
        return <div className="text-muted">Loading cards…</div>;
    }

    if (!cards.length) {
        return (
            <div>
                <button className="btn btn-secondary mb-4" onClick={goBack}>
                    ← Back
                </button>
                <div className="text-muted">No cards available for this deck.</div>
            </div>
        );
    }

    const card = cards[index];

    function nextCard() {
        if (index < cards.length - 1) {
            setIndex(index + 1);
        } else {
            alert("Review complete!");
            goBack();
            return;
        }
        setResetFlipKey(prev => prev + 1); // reset flip
    }

    function prevCard() {
        if (index > 0) {
            setIndex(index - 1);
            setResetFlipKey(prev => prev + 1); // reset flip
        }
    }

    return (
        <div className="w-full h-full flex flex-col items-center pt-4 relative">

            {/* Back button */}
            <button
                className="btn btn-secondary absolute left-6 top-4"
                onClick={goBack}
            >
                ← Back
            </button>

            {/* Progress indicator */}
            <div className="text-sm text-muted mt-2">
                Card {index + 1} / {cards.length}
            </div>

            {/* Navigation arrows */}
            <div className="flex items-center justify-center w-full h-full">

                {/* LEFT ARROW */}
                <button
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition mr-6"
                    disabled={index === 0}
                    onClick={prevCard}
                >
                    <ChevronLeft size={28} className="text-white" />
                </button>

                {/* CARD CENTERED */}
                <CardViewer key={resetFlipKey} card={card} />

                {/* RIGHT ARROW */}
                <button
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition ml-6"
                    onClick={nextCard}
                >
                    <ChevronRight size={28} className="text-white" />
                </button>

            </div>
        </div>
    );
}
