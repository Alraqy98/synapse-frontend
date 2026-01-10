// src/components/auth/ForgotPassword.jsx
// Forgot Password page - sends password reset email via Supabase

import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthInput from './AuthInput';
import { supabase } from '../../lib/supabaseClient';
import AppLogo from '../AppLogo';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!email.trim()) {
            setError('Please enter your email address.');
            setLoading(false);
            return;
        }

        try {
            // Get the current origin for redirect URL
            const redirectUrl = `${window.location.origin}/reset-password`;
            
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            });

            if (resetError) {
                throw resetError;
            }

            // Always show success message (security best practice)
            setSuccess(true);
        } catch (err) {
            console.error('Password reset error:', err);
            // Still show success message to prevent email enumeration
            setSuccess(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal/20 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />

            <div className="w-full max-w-[420px] animate-fade-in-up relative z-10">
                <div className="panel p-8 backdrop-blur-xl bg-[#191D22]/80 border border-white/10 rounded-3xl">
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center mb-6">
                            <AppLogo size={32} />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="text-sm text-muted">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-4">
                            <div className="bg-teal/10 border border-teal/30 rounded-xl p-4">
                                <p className="text-sm text-teal text-center">
                                    If an account with that email exists, we've sent you a password reset link.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full mt-4 bg-teal text-black font-bold py-4 rounded-xl hover:bg-teal-neon transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <AuthInput
                                label="Email Address"
                                icon={Mail}
                                type="email"
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                required
                                autoFocus
                            />

                            {error && (
                                <p className="mt-2 text-sm text-red-400">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="w-full mt-6 bg-teal text-black font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-muted hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

