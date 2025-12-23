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
 * POST /ai/summaries/generate
 * Returns: { success: true, jobId, render_status, rendered_pages, total_pages }
 * Backend responds immediately with render status
 */
export const generateSummary = async (payload) => {
    try {
        const res = await api.post("/ai/summaries/generate", payload);
        return res.data; // { success: true, jobId, render_status, rendered_pages, total_pages }
    } catch (err) {
        // Handle FILE_NOT_READY gracefully
        if (err.response?.status === 422 && 
            (err.response?.data?.code === "FILE_NOT_READY" || 
             err.response?.data?.error_code === "FILE_NOT_READY" ||
             err.response?.data?.error?.includes("FILE_NOT_READY"))) {
            const fileNotReadyError = new Error("Preparing slides. This usually takes a few seconds.");
            fileNotReadyError.code = "FILE_NOT_READY";
            throw fileNotReadyError;
        }
        throw err;
    }
};

/**
 * Get render status for a file
 * GET /library/render-status?fileId=...
 * Returns: { render_status, rendered_pages, total_pages }
 */
export const getRenderStatus = async (fileId) => {
    if (!fileId) throw new Error("File ID is missing");
    const res = await api.get(`/library/render-status?fileId=${fileId}`);
    return res.data; // { render_status, rendered_pages, total_pages }
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
    getRenderStatus,
};

