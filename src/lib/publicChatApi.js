const API_URL = import.meta.env.VITE_API_URL;

export async function sendPublicMessage(message) {
    const res = await fetch(`${API_URL}/api/public-chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    if (!res.ok) {
        throw new Error("Public chat failed");
    }

    const data = await res.json();
    return data.reply;
}
