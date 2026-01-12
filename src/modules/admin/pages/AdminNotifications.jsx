// src/modules/admin/pages/AdminNotifications.jsx
import React, { useState } from "react";
import { sendAdminNotification } from "../apiAdmin";

const AdminNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle) {
      setStatusMessage({ type: "error", text: "Title is required" });
      return;
    }

    if (!trimmedMessage) {
      setStatusMessage({ type: "error", text: "Message is required" });
      return;
    }

    if (trimmedTitle.length > 120) {
      setStatusMessage({ type: "error", text: "Title must be 120 characters or less" });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);

      await sendAdminNotification({
        type: "admin",
        title: trimmedTitle,
        description: trimmedMessage,
        userIds: "all",
      });

      // Success: show message and clear form
      setStatusMessage({ type: "success", text: "Notification sent successfully" });
      setTitle("");
      setMessage("");
    } catch (err) {
      console.error("Failed to send notification:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || err.message || "Failed to send notification",
      });
      // Do NOT clear form on error
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title.trim().length > 0 && message.trim().length > 0 && title.trim().length <= 120;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-sm text-muted">Send announcements to all users</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setStatusMessage(null); // Clear error when user types
                }}
                maxLength={120}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-muted focus:outline-none focus:border-teal/50"
                placeholder="Notification title"
                required
                disabled={loading}
              />
              <div className="mt-1 text-xs text-muted">
                {title.trim().length}/120 characters
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setStatusMessage(null); // Clear error when user types
                }}
                rows={6}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-muted focus:outline-none focus:border-teal/50 resize-none"
                placeholder="Notification message"
                required
                disabled={loading}
              />
            </div>

            {/* Info Text */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-sm text-muted">
                This notification will be sent to all users.
              </p>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl ${
                  statusMessage.type === "success"
                    ? "bg-teal/20 border border-teal/30 text-teal"
                    : "bg-red-500/20 border border-red-500/30 text-red-400"
                }`}
              >
                <div className="text-sm">{statusMessage.text}</div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="px-6 py-2 rounded-xl bg-teal text-black font-semibold hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Sending..." : "Send notification"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
