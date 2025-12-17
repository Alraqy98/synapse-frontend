import React from "react";
import { Star, StarOff, Trash2, Share2 } from "lucide-react";

export default function DeckCard({
    deck,
    onClick,
    onDelete,
    onToggleFavorite,
    onShare,
}) {
    const {
        id,
        title,
        mode_default,
        created_at,
        is_favorite,
        card_count,
    } = deck;

    const modeLabel =
        mode_default === "high_yield"
            ? "High-Yield"
            : mode_default === "deep"
                ? "Deep Mastery"
                : "Turbo Recall";

    return (
        <div
            className="
            relative
            bg-white/5
            hover:bg-white/10
            border border-white/10
            hover:border-teal/50
            rounded-2xl
            p-6
            h-44
            flex flex-col
            justify-between
            cursor-pointer
            transition-all
            shadow-[0_0_30px_rgba(0,255,200,0.05)]
            hover:shadow-[0_0_35px_rgba(0,255,200,0.15)]
        "
            onClick={onClick}
        >
            {/* Top Right Buttons */}
            <div className="absolute top-4 right-4 flex gap-3 z-20">
                {/* Share */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare && onShare(id);
                    }}
                    className="text-teal hover:text-teal-300 transition"
                    title="Share deck"
                >
                    <Share2 size={20} />
                </button>

                {/* Favorite */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite && onToggleFavorite(id);
                    }}
                    className="text-yellow-400 hover:text-yellow-500 transition"
                    title="Favorite"
                >
                    {is_favorite ? (
                        <Star size={22} fill="yellow" />
                    ) : (
                        <StarOff size={22} />
                    )}
                </button>

                {/* Delete */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(id);
                    }}
                    className="text-red-400 hover:text-red-500 transition"
                    title="Delete deck"
                >
                    <Trash2 size={22} />
                </button>
            </div>

            {/* Title */}
            <div className="text-lg font-bold text-white pr-12">
                {title}
            </div>

            {/* Bottom Info */}
            <div className="mt-auto flex items-center justify-between text-xs text-muted">
                <span className="px-2 py-1 rounded-full bg-teal/10 border border-teal/30 text-teal">
                    {modeLabel}
                </span>

                <span>{card_count || 0} cards</span>

                <span>
                    {created_at
                        ? new Date(created_at).toLocaleDateString()
                        : ""}
                </span>
            </div>
        </div>
    );
}
