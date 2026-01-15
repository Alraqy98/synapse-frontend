// src/modules/settings/settings.api.js
import api from "../../lib/api";

/**
 * Send user suggestion/feedback to backend
 * POST /api/suggestions
 * 
 * TODO: Backend endpoint expected to accept:
 * { content: string, user_id: string }
 * 
 * Backend should return: { success: true }
 */
export async function sendFeedback({ message, user }) {
    try {
        const res = await api.post("/api/suggestions", {
            content: message.trim(),
            user_id: user?.id,
        });
        return res.data || { success: true };
    } catch (err) {
        console.error("Failed to send suggestion:", err);
        throw err;
    }
}

export async function fetchAnnouncements() {
    // v1: static, but structured like real data
    return [
        {
            id: 1,
            title: "Coming Soon to Synapse",
            body:
                "• Oral Exam Mode\nPractice structured oral-style questions with adaptive follow-ups.\n\n• Account Security Settings\nEmail and password management will be available soon.\n\nThese features will roll out after the beta stabilization phase.",
            date: "Today",
        },
    ];
}
