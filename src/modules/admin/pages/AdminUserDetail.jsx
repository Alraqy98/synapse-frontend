// src/modules/admin/pages/AdminUserDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getAdminUserDetail } from "../apiAdmin";

const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminUserDetail(userId);
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch user detail:", err);
        setError(err.message || "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
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
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center text-muted py-12">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="rounded-2xl border border-red-500/20 bg-black/40 p-6">
            <div className="text-red-400 font-semibold mb-2">Error</div>
            <div className="text-sm text-muted">{error}</div>
            <button
              onClick={() => navigate("/admin/users")}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="text-white font-semibold mb-2">User not found</div>
            <div className="text-sm text-muted mb-4">The requested user could not be found.</div>
            <button
              onClick={() => navigate("/admin/users")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats, activity } = userData;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>

        {/* Header Section */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">
              {user.full_name || "—"}
            </h1>
            {user.is_admin && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-muted mb-1">{user.email || "—"}</p>
          <p className="text-sm text-muted">Joined {formatDate(user.created_at)}</p>
        </div>

        {/* A. User Info Card */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted mb-1">University</div>
                <div className="text-white">{user.university || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Field of Study</div>
                <div className="text-white">{user.field_of_study || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Year</div>
                <div className="text-white">{user.student_year || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Country</div>
                <div className="text-white">{user.country || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* B. Usage Stats */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Usage Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatNumber(stats?.files_count)}
              </div>
              <div className="text-sm text-muted">Files uploaded</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatNumber(stats?.summaries_count)}
              </div>
              <div className="text-sm text-muted">Summaries generated</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatNumber(stats?.mcq_decks_count)}
              </div>
              <div className="text-sm text-muted">MCQ decks generated</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatNumber(stats?.flashcard_decks_count)}
              </div>
              <div className="text-sm text-muted">Flashcard decks generated</div>
            </div>
          </div>
        </div>

        {/* C. Activity */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Activity</h2>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted mb-1">Last file upload</div>
                <div className="text-white">
                  {activity?.last_file_upload_at ? formatDate(activity.last_file_upload_at) : "No activity yet"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Last summary generated</div>
                <div className="text-white">
                  {activity?.last_summary_at ? formatDate(activity.last_summary_at) : "No activity yet"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Last MCQ attempt</div>
                <div className="text-white">
                  {activity?.last_mcq_attempt_at ? formatDate(activity.last_mcq_attempt_at) : "No activity yet"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
