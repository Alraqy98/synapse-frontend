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
 */
export const generateSummary = async (payload) => {
    const res = await api.post("/ai/summaries/generate", payload);
    return res.data?.summary;
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
    getSummary,
    generateSummary,
    deleteSummary,
};

