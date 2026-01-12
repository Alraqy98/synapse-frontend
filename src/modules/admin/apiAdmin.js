// src/modules/admin/apiAdmin.js
import api from "../../lib/api";

/**
 * Get admin overview metrics
 * GET /api/admin/metrics/overview
 * 
 * Backend response: { success, total_verified_users, total_files, total_summaries_completed, total_mcq_decks_completed, total_flashcard_decks_completed }
 * Frontend expects: { total_users, total_files, total_summaries, total_mcq_decks, total_flashcard_decks }
 */
export const getAdminOverview = async () => {
  try {
    const res = await api.get("/admin/metrics/overview");
    const data = res.data;
    
    // Map backend fields to frontend-friendly keys
    return {
      total_users: data.total_verified_users ?? 0,
      total_files: data.total_files ?? 0,
      total_summaries: data.total_summaries_completed ?? 0,
      total_mcq_decks: data.total_mcq_decks_completed ?? 0,
      total_flashcard_decks: data.total_flashcard_decks_completed ?? 0,
    };
  } catch (err) {
    if (err.response?.status === 403) {
      // Redirect to dashboard on 403
      window.location.href = "/dashboard";
      throw new Error("Access denied");
    }
    // Return null-safe zero values on any other error
    return {
      total_users: 0,
      total_files: 0,
      total_summaries: 0,
      total_mcq_decks: 0,
      total_flashcard_decks: 0,
    };
  }
};

/**
 * Get file processing metrics
 * GET /api/admin/metrics/files
 * 
 * Backend response: { success, render_completed, render_pending, render_failed, ocr_completed, ocr_pending, ocr_failed }
 * Frontend expects: { render: { completed, pending, failed }, ocr: { completed, pending, failed } }
 */
export const getAdminFilesMetrics = async () => {
  try {
    const res = await api.get("/admin/metrics/files");
    const data = res.data;
    
    // Transform flat backend fields into nested objects
    return {
      render: {
        completed: data.render_completed ?? 0,
        pending: data.render_pending ?? 0,
        failed: data.render_failed ?? 0,
      },
      ocr: {
        completed: data.ocr_completed ?? 0,
        pending: data.ocr_pending ?? 0,
        failed: data.ocr_failed ?? 0,
      },
    };
  } catch (err) {
    if (err.response?.status === 403) {
      window.location.href = "/dashboard";
      throw new Error("Access denied");
    }
    // Return null-safe zero values on any other error
    return {
      render: {
        completed: 0,
        pending: 0,
        failed: 0,
      },
      ocr: {
        completed: 0,
        pending: 0,
        failed: 0,
      },
    };
  }
};

/**
 * Get content generation metrics
 * GET /api/admin/metrics/content
 * 
 * Backend response: { success, summaries_completed, summaries_failed, mcq_decks_completed, flashcard_decks_completed }
 * Frontend expects: { summaries: { completed, failed }, mcq_decks: { completed }, flashcard_decks: { completed } }
 */
export const getAdminContentMetrics = async () => {
  try {
    const res = await api.get("/admin/metrics/content");
    const data = res.data;
    
    // Map backend fields into grouped frontend shape
    return {
      summaries: {
        completed: data.summaries_completed ?? 0,
        failed: data.summaries_failed ?? 0,
      },
      mcq_decks: {
        completed: data.mcq_decks_completed ?? 0,
      },
      flashcard_decks: {
        completed: data.flashcard_decks_completed ?? 0,
      },
    };
  } catch (err) {
    if (err.response?.status === 403) {
      window.location.href = "/dashboard";
      throw new Error("Access denied");
    }
    // Return null-safe zero values on any other error
    return {
      summaries: {
        completed: 0,
        failed: 0,
      },
      mcq_decks: {
        completed: 0,
      },
      flashcard_decks: {
        completed: 0,
      },
    };
  }
};

/**
 * Send admin notification to all users
 * POST /api/admin/notifications
 */
export const sendAdminNotification = async (payload) => {
  try {
    const res = await api.post("/admin/notifications", payload);
    return res.data;
  } catch (err) {
    if (err.response?.status === 403) {
      window.location.href = "/dashboard";
      throw new Error("Access denied");
    }
    throw err;
  }
};
