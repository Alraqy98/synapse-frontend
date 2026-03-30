// src/lib/api.js
import axios from "axios";
import { supabase } from "./supabaseClient";

// If VITE_API_URL is missing, browser requests hit the dev server origin and return HTML (SPA index).
const envBase = import.meta.env.VITE_API_URL;
const baseURL =
    typeof envBase === "string" && envBase.trim() !== ""
        ? envBase.replace(/\/$/, "")
        : import.meta.env.DEV
          ? "http://localhost:3000"
          : "";

const api = axios.create({
    baseURL,
    withCredentials: false
});

// Attach token to every request - always fetch live session
api.interceptors.request.use(
    async (config) => {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
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
    },
    (error) => Promise.reject(error)
);

export default api;
