// src/components/auth/ResetPassword.jsx
// Reset Password page - handles password reset from email link

import React, { useState, useEffect } from 'react';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthInput from './AuthInput';
import { supabase } from '../../lib/supabaseClient';
import AppLogo from '../AppLogo';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [validatingSession, setValidatingSession] = useState(true);

    // Check if we have a valid session from the reset link
    useEffect(() => {
        const checkSession = async () => {
            try {
                // Wait a bit for Supabase to process hash fragments from the reset link
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    // No valid session, redirect to login
                    navigate('/login');
                } else {
                    setValidatingSession(false);
                }
            } catch (err) {
                console.error('Session check error:', err);
                navigate('/login');
            }
        };

        checkSession();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Client-side validation
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setError('Both fields are required.');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                throw updateError;
            }

            // Success
            setSuccess(true);
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Password reset error:', err);
            const errorMessage = err.message || 'Failed to reset password. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (validatingSession) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-teal mx-auto mb-4" />
                    <p className="text-muted">Validating reset link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal/20 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />

            <div className="w-full max-w-[420px] animate-fade-in-up relative z-10">
                <div className="panel p-8 backdrop-blur-xl bg-[#191D22]/80 border border-white/10 rounded-3xl">
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center mb-6">
                            <AppLogo size={32} />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
                        <p className="text-sm text-muted">
                            Enter your new password below.
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-4">
                            <div className="bg-teal/10 border border-teal/30 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle size={20} className="text-teal flex-shrink-0" />
                                <p className="text-sm text-teal">
                                    Password reset successfully! Redirecting to login...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <AuthInput
                                label="New Password"
                                icon={Lock}
                                type="password"
                                value={newPassword}
                                onChange={e => {
                                    setNewPassword(e.target.value);
                                    setError(null);
                                }}
                                required
                                autoFocus
                            />

                            <AuthInput
                                label="Confirm New Password"
                                icon={Lock}
                                type="password"
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value);
                                    setError(null);
                                }}
                                required
                            />

                            {error && (
                                <p className="mt-2 text-sm text-red-400">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                                className="w-full mt-6 bg-teal text-black font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

