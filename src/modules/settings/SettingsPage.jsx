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

            {/* SYSTEM LIMITS (BETA) — TOP PRIORITY */}
            {/* TEMP SAFETY RAIL — communicates system limits for early beta users */}
            <div className="panel p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">System Limits (Beta)</h2>
                
                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Max upload size:</span>
                        <span className="text-white font-medium">25MB</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Supported formats:</span>
                        <span className="text-white">PDF, Images, DOC, DOCX, PPT, PPTX, TXT</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Automatic processing:</span>
                        <span className="text-white">Files are automatically rendered and OCR'd after upload</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Processing time:</span>
                        <span className="text-white">Large or complex files may take longer to process</span>
                    </div>
                </div>
                
                <p className="text-xs text-muted pt-2 border-t border-white/5">
                    Limits may change as Synapse evolves during beta.
                </p>
            </div>

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

                    {/* Account Security - Change Password */}
                    {/* Moved to account dropdown in header - keeping commented for reference */}
                    {/* <div className="panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Lock size={18} className="text-teal" />
                            <h3 className="text-sm font-semibold text-white">Account Security</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs text-muted mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-muted outline-none focus:border-teal transition-colors"
                                    disabled={passwordLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-muted mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-muted outline-none focus:border-teal transition-colors"
                                    disabled={passwordLoading}
                                />
                            </div>

                            {passwordError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                    <p className="text-red-400 text-xs">{passwordError}</p>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="bg-teal/10 border border-teal/30 rounded-lg p-3">
                                    <p className="text-teal text-xs">Password updated successfully</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={passwordLoading || !newPassword.trim() || !confirmPassword.trim()}
                                className="w-full py-2 px-4 bg-teal hover:bg-teal-neon text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {passwordLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </button>
                        </form>
                    </div> */}
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
