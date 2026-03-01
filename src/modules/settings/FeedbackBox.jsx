// src/modules/settings/FeedbackBox.jsx
import React, { useState } from "react";
import { sendFeedback } from "./settings.api";

const FeedbackBox = ({ user }) => {
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) return;

        try {
            setSubmitting(true);
            setError(null);
            await sendFeedback({ message, user });
            setSent(true);
            setMessage("");
            setTimeout(() => setSent(false), 3000);
        } catch (err) {
            console.error("Failed to send suggestion:", err);
            setError("Failed to send suggestion. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-[#0D0F12]/60 border border-white/[0.06] rounded-2xl backdrop-blur-sm p-6 space-y-4">
            <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-mono">Feedback</div>
                <h2 className="text-base font-semibold text-white">Suggestions & Feedback</h2>
            </div>

            <p className="text-sm text-white/40">
                Tell us what feels off, missing, or confusing. We read everything.
            </p>

            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write your suggestion here..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/30 outline-none focus:border-white/20 transition-colors resize-none"
            />

            <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl text-sm bg-transparent border border-white/[0.08] text-white/70 hover:border-teal/40 hover:text-teal transition-colors disabled:opacity-50"
                disabled={!message.trim() || submitting}
            >
                {submitting ? "Sending..." : "Send feedback"}
            </button>

            {sent && (
                <div className="text-xs text-white/50">
                    Thanks — your feedback was sent.
                </div>
            )}

            {error && (
                <div className="text-xs text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
};

export default FeedbackBox;
