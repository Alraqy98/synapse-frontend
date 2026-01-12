// src/modules/admin/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  getAdminOverview,
  getAdminFilesMetrics,
  getAdminContentMetrics,
  sendAdminNotification,
} from "./apiAdmin";

const AdminPanel = ({ profile }) => {
  const [overview, setOverview] = useState(null);
  const [filesMetrics, setFilesMetrics] = useState(null);
  const [contentMetrics, setContentMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notification form state
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationDescription, setNotificationDescription] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);

  // Fetch all metrics on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all metrics in parallel
        const [overviewData, filesData, contentData] = await Promise.all([
          getAdminOverview().catch(() => null),
          getAdminFilesMetrics().catch(() => null),
          getAdminContentMetrics().catch(() => null),
        ]);

        setOverview(overviewData);
        setFilesMetrics(filesData);
        setContentMetrics(contentData);
      } catch (err) {
        console.error("Failed to fetch admin metrics:", err);
        setError(err.message || "Failed to load admin metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Handle notification send
  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!notificationTitle.trim()) {
      setNotificationMessage({ type: "error", text: "Title is required" });
      return;
    }

    try {
      setSendingNotification(true);
      setNotificationMessage(null);

      await sendAdminNotification({
        type: "admin",
        title: notificationTitle.trim(),
        description: notificationDescription.trim() || null,
      });

      setNotificationMessage({ type: "success", text: "Notification sent successfully" });
      setNotificationTitle("");
      setNotificationDescription("");
    } catch (err) {
      console.error("Failed to send notification:", err);
      setNotificationMessage({
        type: "error",
        text: err.response?.data?.error || err.message || "Failed to send notification",
      });
    } finally {
      setSendingNotification(false);
    }
  };

  // Format number helper
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "—";
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-muted py-12">Loading admin metrics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-red-500/20 bg-black/40 p-6">
            <div className="text-red-400 font-semibold mb-2">Error</div>
            <div className="text-sm text-muted">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-sm text-muted">System metrics and notifications</p>
        </div>

        {/* A. Overview Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_users)}
                </div>
                <div className="text-sm text-muted">Total verified users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_files)}
                </div>
                <div className="text-sm text-muted">Total files</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_summaries)}
                </div>
                <div className="text-sm text-muted">Total summaries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_mcq_decks)}
                </div>
                <div className="text-sm text-muted">Total MCQ decks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_flashcard_decks)}
                </div>
                <div className="text-sm text-muted">Total flashcard decks</div>
              </div>
            </div>
          </div>
        </div>

        {/* B. File Processing Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">File Processing</h2>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Render Status */}
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                  Render Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Completed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(filesMetrics?.render?.completed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Pending</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(filesMetrics?.render?.pending)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Failed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(filesMetrics?.render?.failed)}
                    </span>
                  </div>
                </div>
              </div>

              {/* OCR Status */}
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                  OCR Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Completed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(filesMetrics?.ocr?.completed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Pending</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(filesMetrics?.ocr?.pending)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Failed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(filesMetrics?.ocr?.failed)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* C. Content Generation Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Content Generation</h2>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Summaries */}
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                  Summaries
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Completed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(contentMetrics?.summaries?.completed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Failed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(contentMetrics?.summaries?.failed)}
                    </span>
                  </div>
                </div>
              </div>

              {/* MCQ Decks */}
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                  MCQ Decks
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Completed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(contentMetrics?.mcq_decks?.completed)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Flashcard Decks */}
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                  Flashcard Decks
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Completed</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(contentMetrics?.flashcard_decks?.completed)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* D. Admin Notification Form */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Send Notification</h2>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-muted focus:outline-none focus:border-teal/50"
                  placeholder="Notification title"
                  required
                  disabled={sendingNotification}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={notificationDescription}
                  onChange={(e) => setNotificationDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-muted focus:outline-none focus:border-teal/50 resize-none"
                  placeholder="Notification description"
                  disabled={sendingNotification}
                />
              </div>

              {notificationMessage && (
                <div
                  className={`p-3 rounded-xl ${
                    notificationMessage.type === "success"
                      ? "bg-teal/20 border border-teal/30 text-teal"
                      : "bg-red-500/20 border border-red-500/30 text-red-400"
                  }`}
                >
                  <div className="text-sm">{notificationMessage.text}</div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sendingNotification || !notificationTitle.trim()}
                  className="px-6 py-2 rounded-xl bg-teal text-black font-semibold hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sendingNotification ? "Sending..." : "Send to all users"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
