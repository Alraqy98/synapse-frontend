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
            title: "Coming Soon to Synapse",
            body:
                "• Oral Exam Mode\nPractice structured oral-style questions with adaptive follow-ups.\n\n• Account Security Settings\nEmail and password management will be available soon.\n\nThese features will roll out after the beta stabilization phase.",
            date: "Today",
        },
    ];
}
