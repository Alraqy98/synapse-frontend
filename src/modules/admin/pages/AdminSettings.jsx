// src/modules/admin/pages/AdminSettings.jsx
import React, { useState } from "react";
import { runBackfillConceptMentionsAllUsers } from "../apiAdmin";

const AdminSettings = () => {
  const [backfillStatus, setBackfillStatus] = useState(null); // "running" | { users_processed, concepts_extracted } | { error }
  const [backfillRunning, setBackfillRunning] = useState(false);

  const handleRunBackfill = async () => {
    setBackfillRunning(true);
    setBackfillStatus("running");
    try {
      const data = await runBackfillConceptMentionsAllUsers();
      setBackfillStatus({
        users_processed: data?.users_processed ?? data?.usersProcessed ?? 0,
        concepts_extracted: data?.concepts_extracted ?? data?.conceptsExtracted ?? 0,
      });
    } catch (err) {
      setBackfillStatus({ error: err.response?.data?.message ?? err.message ?? "Backfill failed" });
    } finally {
      setBackfillRunning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Settings</h1>
          <p className="text-sm text-muted">Admin settings and preferences</p>
        </div>

        {/* Concept Mention Backfill */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Concept Mention Backfill</h2>
          <p className="text-sm text-muted mb-4">
            Backfill concept mentions for MCQ questions across all users.
          </p>
          <button
            onClick={handleRunBackfill}
            disabled={backfillRunning}
            className="px-4 py-2 rounded-lg bg-teal/20 border border-teal/40 text-teal text-sm font-medium hover:bg-teal/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Run Backfill for All Users
          </button>
          {backfillStatus && (
            <div className="mt-4 text-sm">
              {backfillStatus === "running" ? (
                <span className="text-white/70">Running...</span>
              ) : backfillStatus.error ? (
                <span className="text-red-400">{backfillStatus.error}</span>
              ) : (
                <span className="text-white/70">
                  Done — {backfillStatus.users_processed} users processed, {backfillStatus.concepts_extracted} concepts extracted
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
