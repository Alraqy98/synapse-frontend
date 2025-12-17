// src/modules/settings/settings.api.js

// Later you can replace these with Supabase calls

export async function sendFeedback({ message, user }) {
    // v1: just log it (or hook to Supabase later)
    console.log("📩 New Feedback:", {
        message,
        user,
        created_at: new Date().toISOString(),
    });

    return { success: true };
}

export async function fetchAnnouncements() {
    // v1: static, but structured like real data
    return [
        {
            id: 1,
            title: "Summaries Module – In Active Development",
            body:
                "We are actively building structured, exam-oriented summaries focused on clarity, references, and retention. First release will prioritize high-yield topics.",
            date: "Today",
        },
        {
            id: 2,
            title: "MCQ Engine Improvements",
            body:
                "We identified option-distribution bias and are refining answer balance and case depth. Improvements are being rolled out iteratively.",
            date: "Yesterday",
        },
        {
            id: 3,
            title: "Early Clinical Personalization",
            body:
                "Case-based logic is now adapted to your training stage. This will continue to improve as more feedback is collected.",
            date: "2 days ago",
        },
    ];
}
