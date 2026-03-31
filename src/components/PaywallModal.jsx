import React from "react";

export default function PaywallModal({ isOpen, onClose, onUpgrade }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-modal-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                className="bg-[#0D0F12] rounded-lg p-8 max-w-md w-full border border-teal-500/30"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4">
                    <div className="text-4xl" aria-hidden>
                        🔒
                    </div>
                </div>
                <h2 id="paywall-modal-title" className="text-2xl font-semibold text-white mb-2">
                    Unlock generation
                </h2>
                <p className="text-gray-400 mb-6">
                    MCQs, flashcards, and summaries are available with a paid subscription.
                </p>

                <div className="space-y-2 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-sm text-gray-300">✓ Generate unlimited MCQs</div>
                    <div className="text-sm text-gray-300">✓ Create flashcard decks</div>
                    <div className="text-sm text-gray-300">✓ Auto-generate summaries</div>
                    <div className="text-sm text-gray-300">✓ Use Astra AI tutor</div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
                    >
                        Later
                    </button>
                    <button
                        type="button"
                        onClick={onUpgrade}
                        className="flex-1 px-4 py-3 bg-teal-500 rounded-lg text-white font-semibold hover:bg-teal-600 transition-colors"
                    >
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );
}
