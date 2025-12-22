// src/lib/api.js
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: false
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Diagnostic logging for summary generation
    if (config.url?.includes("/ai/summaries/generate")) {
        console.log("🟡 [DIAGNOSTIC] Axios interceptor: POST request to /ai/summaries/generate");
        console.log("🟡 [DIAGNOSTIC] Method:", config.method);
        console.log("🟡 [DIAGNOSTIC] URL:", config.url);
        console.log("🟡 [DIAGNOSTIC] Full URL:", config.baseURL + config.url);
        console.log("🟡 [DIAGNOSTIC] Payload:", config.data);
        console.log("🟡 [DIAGNOSTIC] Headers:", config.headers);
    }
    return config;
});

export default api;
