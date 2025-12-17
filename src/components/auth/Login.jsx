import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Hexagon } from 'lucide-react';
import AuthInput from './AuthInput';
import { supabase } from '../../lib/supabaseClient';

const Login = ({ onSuccess, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Get full user data
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error("Failed to load user metadata:", userError);
            }

            const user = userData?.user;
            const fullName = user?.user_metadata?.full_name || "";
            const emailFromUser = user?.email || "";

            // Pass metadata to parent → goes into onboardingFlow initialData
            onSuccess({
                fullName,
                email: emailFromUser,
            });

        } catch (err) {
            alert(err.message);
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
                        <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-teal/20 border border-teal/20 text-teal mb-6">
                            <Hexagon size={24} />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-sm text-muted">Log in with your email and password.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <AuthInput
                            label="Email Address"
                            icon={Mail}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />

                        <AuthInput
                            label="Password"
                            icon={Lock}
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-teal text-black font-bold py-4 rounded-xl"
                        >
                            {loading ? "Signing In..." : "Log In"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-sm text-muted">
                            Don't have an account?{" "}
                            <button
                                onClick={onSwitchToSignup}
                                className="text-teal hover:underline"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
