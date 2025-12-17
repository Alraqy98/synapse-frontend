import React from "react";
import AnnouncementsPanel from "./AnnouncementsPanel";
import FeedbackBox from "./FeedbackBox";
import { supabase } from "../../lib/supabaseClient";

const SettingsPage = ({ profile, onLogout }) => {
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.removeItem("access_token");
            onLogout();
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10">

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: ANNOUNCEMENTS */}
                <div className="lg:col-span-2">
                    <AnnouncementsPanel />
                </div>

                {/* RIGHT: FEEDBACK + ACCOUNT */}
                <div className="space-y-6">

                    <FeedbackBox user={profile} />

                    {/* Account summary (no actions here) */}
                    <div className="panel p-6">
                        <h3 className="text-sm text-muted mb-2">Account</h3>

                        <div className="text-sm font-semibold text-white">
                            {profile?.full_name || "User"}
                        </div>

                        <div className="text-xs text-muted">
                            {profile?.email}
                        </div>

                        <div className="text-xs text-muted mt-1">
                            Stage: {profile?.stage || "—"}
                        </div>
                    </div>
                </div>
            </div>

            {/* LOGOUT — SEPARATE, CENTERED, LOW PRIORITY */}
            <div className="flex justify-center pt-6 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="
            px-10 py-3 rounded-xl
            border border-red-500/30
            text-red-400 text-sm font-medium
            hover:bg-red-500/10 hover:border-red-500/60
            transition
          "
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
