// src/modules/admin/pages/AdminSuggestions.jsx
import React, { useState, useEffect } from "react";
import { getAdminSuggestions } from "../apiAdmin";

const AdminSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const suggestionsData = await getAdminSuggestions();
        setSuggestions(suggestionsData);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setError(err.message || "Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">User Suggestions</h1>
          <p className="text-sm text-muted">View and manage all submitted suggestions from users</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">Loading suggestions…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">No suggestions yet</p>
          </div>
        )}

        {/* Suggestions Table */}
        {!loading && !error && suggestions.length > 0 && (
          <div className="bg-[#1a1d24] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Suggestion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {suggestions.map((suggestion) => (
                    <tr key={suggestion.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {suggestion.user_name || suggestion.user_email || "—"}
                        </div>
                        {suggestion.user_email && suggestion.user_name && (
                          <div className="text-xs text-muted mt-1">{suggestion.user_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white max-w-2xl">{suggestion.content || "—"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">{formatDate(suggestion.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-teal/20 text-teal border border-teal/30">
                          {suggestion.status || "New"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSuggestions;
