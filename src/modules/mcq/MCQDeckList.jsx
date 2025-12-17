import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2 } from "lucide-react";
import { apiMCQ } from "./apiMCQ";

export default function MCQDeckList({ decks, loading, onOpenDeck }) {
    const handleShare = async (e, deckId) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const { code } = await apiMCQ.shareDeck(deckId);
            await navigator.clipboard.writeText(code);
            alert("CODE COPIED: " + code);
        } catch (err) {
            console.error(err);
            alert("Failed to generate share code");
        }
    };

    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (!decks || decks.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No MCQ decks yet. Click “Generate MCQs” to create one.
            </p>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => {
                const isGenerating = Boolean(deck.generating);

                return (
                    <div
                        key={deck.id}
                        onClick={() => onOpenDeck(deck.id)}
                        className="cursor-pointer rounded-xl border border-white/10 bg-background p-5 transition hover:border-teal/60 hover:shadow-md"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-semibold text-base truncate">
                                {deck.title}
                            </h3>

                            <button
                                type="button"
                                onClick={(e) => handleShare(e, deck.id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-white/5 transition"
                                title="Share deck"
                            >
                                <Share2 size={16} />
                            </button>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs mb-3">
                            <span className="text-muted-foreground">
                                {deck.question_count ?? 0} Questions
                            </span>

                            <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wide border-white/20 text-muted-foreground"
                            >
                                {deck.difficulty}
                            </Badge>
                        </div>

                        {/* Status */}
                        {isGenerating ? (
                            <div>
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full w-2/3 animate-pulse bg-teal rounded-full" />
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                    Generating questions…
                                </p>
                            </div>
                        ) : (
                            <Badge className="bg-teal/10 text-teal border border-teal/30 text-[11px]">
                                Ready
                            </Badge>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
