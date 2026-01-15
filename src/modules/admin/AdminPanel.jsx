// src/modules/admin/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import {
  getAdminOverview,
  getAdminFilesMetrics,
  getAdminContentMetrics,
} from "./apiAdmin";

const AdminPanel = ({ profile }) => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [filesMetrics, setFilesMetrics] = useState(null);
  const [contentMetrics, setContentMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Reusable function to fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch admin metrics:", err);
      setError(err.message || "Failed to load admin metrics");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Fetch all metrics on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format relative time helper
  const formatRelativeTime = (date) => {
    if (!date) return "—";
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 10) return "just now";
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  // Format number helper
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "—";
    return new Intl.NumberFormat().format(num);
  };

  // Determine metric card visual state
  const getMetricCardStyle = (metricType) => {
    const hasFailedRenders = (filesMetrics?.render?.failed ?? 0) > 0;
    const hasFailedOCR = (filesMetrics?.ocr?.failed ?? 0) > 0;
    const hasHighPending = (filesMetrics?.render?.pending ?? 0) > 10;

    // Red accent for failed states
    if (hasFailedRenders || hasFailedOCR) {
      return "border-red-500/30 hover:border-red-500/50";
    }
    
    // Amber accent for high pending
    if (hasHighPending) {
      return "border-yellow-500/30 hover:border-yellow-500/50";
    }
    
    // Normal state
    return "border-white/10 hover:border-white/20";
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-sm text-muted">System metrics and notifications</p>
            {lastUpdated && (
              <p className="text-xs text-muted mt-1">
                Last updated: {formatRelativeTime(lastUpdated)}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-teal/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw 
              size={16} 
              className={refreshing ? "animate-spin" : ""}
            />
            <span className="text-sm text-white">
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        {/* A. Overview Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
          <div className={`rounded-2xl border ${getMetricCardStyle()} bg-black/40 p-6 transition-colors`}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <button
                onClick={() => navigate("/admin/users")}
                className="text-center p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_users)}
                </div>
                <div className="text-sm text-muted">Total verified users</div>
              </button>
              <button
                onClick={() => navigate("/admin/files")}
                className="text-center p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_files)}
                </div>
                <div className="text-sm text-muted">Total files</div>
              </button>
              <button
                onClick={() => navigate("/admin/content?type=summaries")}
                className="text-center p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_summaries)}
                </div>
                <div className="text-sm text-muted">Total summaries</div>
              </button>
              <button
                onClick={() => navigate("/admin/content?type=mcq")}
                className="text-center p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_mcq_decks)}
                </div>
                <div className="text-sm text-muted">Total MCQ decks</div>
              </button>
              <button
                onClick={() => navigate("/admin/content?type=flashcards")}
                className="text-center p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(overview?.total_flashcard_decks)}
                </div>
                <div className="text-sm text-muted">Total flashcard decks</div>
              </button>
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

        {/* D. Send Notification */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <p className="text-sm text-muted mb-4">
              Send announcements and notifications to all users
            </p>
            <button
              onClick={() => navigate("/admin/notifications")}
              className="px-6 py-2 rounded-xl bg-teal text-black font-semibold hover:bg-teal/90 transition-colors"
            >
              Send notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
