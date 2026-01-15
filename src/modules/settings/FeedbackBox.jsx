// src/modules/settings/FeedbackBox.jsx
import React, { useState } from "react";
import { sendFeedback } from "./settings.api";
import { MessageSquare } from "lucide-react";

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
        <div className="panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-white">
                <MessageSquare size={18} className="text-teal" />
                <h2 className="text-lg font-bold">Suggestions & Feedback</h2>
            </div>

            <p className="text-sm text-muted">
                Tell us what feels off, missing, or confusing. We read everything.
            </p>

            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write your suggestion here..."
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-muted outline-none focus:border-teal"
            />

            <button
                onClick={handleSubmit}
                className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                disabled={!message.trim() || submitting}
            >
                {submitting ? "Sending..." : "Send feedback"}
            </button>

            {sent && (
                <div className="text-xs text-teal">
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
