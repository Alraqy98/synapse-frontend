// src/components/ChangePasswordModal.jsx
// Reusable Change Password modal component

import React, { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Client-side validation
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setError("Both fields are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                throw updateError;
            }

            // Success
            setSuccess(true);
            setNewPassword("");
            setConfirmPassword("");
            
            // Close modal after 1.5 seconds
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err) {
            console.error("Password update error:", err);
            const errorMessage = err.message || "Failed to update password. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setNewPassword("");
            setConfirmPassword("");
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleClose}
        >
            <div 
                className="w-full max-w-md bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <Lock size={20} className="text-teal" />
                        <h2 className="text-xl font-bold text-white">Change Password</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-muted hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-muted mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-muted outline-none focus:border-teal transition-colors"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-muted mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-muted outline-none focus:border-teal transition-colors"
                            disabled={loading}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-teal/10 border border-teal/30 rounded-lg p-3">
                            <p className="text-teal text-sm">Password updated successfully</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                            className="px-6 py-2 bg-teal hover:bg-teal-neon text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;

