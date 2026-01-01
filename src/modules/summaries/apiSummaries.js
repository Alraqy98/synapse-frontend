// src/modules/summaries/apiSummaries.js
import api from "../../lib/api";

// ===============================================================
// SUMMARIES API
// ===============================================================

/**
 * Get all summaries for a file
 * GET /ai/summaries/file/:fileId
 */
export const getSummariesByFile = async (fileId) => {
    if (!fileId) throw new Error("File ID is missing");
    const res = await api.get(`/ai/summaries/file/${fileId}`);
    return res.data?.summaries || [];
};

/**
 * Get all summaries for the current user
 * GET /ai/summaries
 * Returns: { summaries: [...] }
 */
export const getAllSummaries = async () => {
    try {
        const res = await api.get("/ai/summaries");
        return res.data?.summaries || [];
    } catch (err) {
        // If endpoint doesn't exist, return empty array
        if (err.response?.status === 404) {
            return [];
        }
        throw err;
    }
};

/**
 * Get a single summary by ID
 * GET /ai/summaries/:id
 */
export const getSummary = async (summaryId) => {
    if (!summaryId) throw new Error("Summary ID is missing");
    const res = await api.get(`/ai/summaries/${summaryId}`);
    return res.data?.summary || null;
};

/**
 * Generate a new summary
 * Tries POST /ai/summaries/generate first, falls back to POST /ai/summaries if 404
 * Returns: { success: true, jobId, render_status, rendered_pages, total_pages }
 * Backend responds immediately with render status
 */
export const generateSummary = async (payload) => {
    // Try primary route first: POST /ai/summaries/generate
    try {
        const res = await api.post("/ai/summaries/generate", payload);
        return res.data; // { success: true, jobId, render_status, rendered_pages, total_pages }
    } catch (err) {
        // If 404, try alternative route: POST /ai/summaries
        if (err.response?.status === 404) {
            console.warn("⚠️ [SUMMARY GENERATION] Route /ai/summaries/generate not found, trying /ai/summaries");
            try {
                const res = await api.post("/ai/summaries", payload);
                return res.data;
            } catch (fallbackErr) {
                // Both routes failed - fail loudly
                const routeError = new Error(
                    "Summary generation endpoint not found. Tried both POST /ai/summaries/generate and POST /ai/summaries. " +
                    "Please check backend configuration."
                );
                routeError.code = "ROUTE_NOT_FOUND";
                routeError.status = 404;
                console.error("❌ [SUMMARY GENERATION] Both routes failed:", {
                    attemptedRoutes: ["/ai/summaries/generate", "/ai/summaries"],
                    method: "POST",
                    baseURL: err.config?.baseURL,
                });
                throw routeError;
            }
        }
        // Handle FILE_NOT_READY gracefully
        if (err.response?.status === 422 && 
            (err.response?.data?.code === "FILE_NOT_READY" || 
             err.response?.data?.error_code === "FILE_NOT_READY" ||
             err.response?.data?.error?.includes("FILE_NOT_READY"))) {
            const fileNotReadyError = new Error("Preparing content. This usually takes a few seconds.");
            fileNotReadyError.code = "FILE_NOT_READY";
            throw fileNotReadyError;
        }
        throw err;
    }
};


/**
 * Get summary generation job status
 * GET /ai/summaries/job/:jobId
 * Returns: { status: "pending" | "completed" | "failed", summaryId?: "<uuid>" }
 */
export const getSummaryJobStatus = async (jobId) => {
    if (!jobId) throw new Error("Job ID is missing");
    const res = await api.get(`/ai/summaries/job/${jobId}`);
    return res.data; // { status, summaryId }
};

/**
 * Delete a summary
 * DELETE /ai/summaries/:id
 */
export const deleteSummary = async (summaryId) => {
    if (!summaryId) throw new Error("Summary ID is missing");
    await api.delete(`/ai/summaries/${summaryId}`);
};

/**
 * Share a summary (generate import code)
 * POST /ai/summaries/:id/share
 * Returns: { share_code: "SYN-XXXXXX" } or { code: "SYN-XXXXXX" }
 */
export const shareSummary = async (summaryId) => {
    if (!summaryId) throw new Error("Summary ID is missing");
    const res = await api.post(`/ai/summaries/${summaryId}/share`);
    return res.data; // Backend returns { share_code } or { code }
};

/**
 * Import a summary by code
 * POST /ai/summaries/import
 * Body: { code: "SYN-XXXXXX" }
 * Returns: { success: true, summary: {...} } or { success: false, error: "..." }
 */
export const importSummary = async (code) => {
    if (!code) throw new Error("Import code is missing");
    try {
        const res = await api.post("/ai/summaries/import", { code });
        return res.data; // Backend returns { success, summary } or { success: false, error }
    } catch (err) {
        // Return error in same format for consistent handling
        return {
            success: false,
            error: err.response?.data?.error || err.response?.data?.message || err.message || "Import failed"
        };
    }
};

// ===============================================================
// DEFAULT EXPORT
// ===============================================================

export const apiSummaries = {
    getSummariesByFile,
    getAllSummaries,
    getSummary,
    generateSummary,
    getSummaryJobStatus,
    deleteSummary,
    shareSummary,
    importSummary,
};

