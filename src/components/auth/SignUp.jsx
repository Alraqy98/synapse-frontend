import React, { useState } from "react";
import { Mail, Lock, ArrowRight, User } from "lucide-react";
import AuthInput from "./AuthInput";
import VerifyOtp from "./VerifyOtp";
import LegalModal from "../LegalModal";
import AppLogo from "../AppLogo";

const SignUp = ({ onSwitchToLogin }) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [legalModal, setLegalModal] = useState({ open: false, type: null });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            alert("Email and password are required.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            // 1️⃣ Signup (email + password ONLY)
            const signupRes = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/signup`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        password,
                        full_name: fullName,
                    }),
                }
            );

            const signupJson = await signupRes.json();
            if (!signupRes.ok) {
                throw new Error(signupJson.error || "Signup failed");
            }

            // 2️⃣ Request OTP (backend controlled)
            const otpRes = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/request-otp`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );

            const otpJson = await otpRes.json();
            if (!otpRes.ok) {
                throw new Error(otpJson.error || "Failed to request OTP");
            }

            setShowOtp(true);
        } catch (err) {
            console.error("Signup error:", err);
            alert(err.message || "Signup failed.");
        } finally {
            setLoading(false);
        }
    };

    // 🔐 OTP STEP
    if (showOtp) {
        return (
            <VerifyOtp
                email={email}
                password={password}
                onVerified={() => {
                    // Let app-level auth listener decide onboarding/dashboard
                    onSwitchToLogin();
                }}
            />
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[500px] h-[500px] bg-teal/20 blur-[120px]
        rounded-full pointer-events-none animate-pulse-slow"
            />

            <div className="w-full max-w-[420px] animate-fade-in-up relative z-10">
                <div
                    className="panel p-8 md:p-10 backdrop-blur-xl bg-[#191D22]/80
          border border-white/10 shadow-2xl rounded-3xl"
                >
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center mb-6">
                            <AppLogo size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            Create Your Account
                        </h1>
                        <p className="text-sm text-muted">
                            Secure signup with verification.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <AuthInput
                            label="Full Name"
                            icon={User}
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />

                        <AuthInput
                            label="Email Address"
                            icon={Mail}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <AuthInput
                            label="Password"
                            icon={Lock}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <AuthInput
                            label="Confirm Password"
                            icon={Lock}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-teal hover:bg-teal-neon text-black
              font-bold py-4 rounded-xl
              shadow-[0_0_20px_rgba(0,200,180,0.3)]
              transition-all active:scale-[0.98]
              flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight
                                        size={18}
                                        className="group-hover:translate-x-1 transition-transform"
                                    />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Legal acceptance text */}
                    <p className="text-xs text-muted text-center mt-4">
                        By signing up, you agree to our{" "}
                        <button
                            type="button"
                            onClick={() => setLegalModal({ open: true, type: "terms" })}
                            className="text-teal hover:text-teal-neon hover:underline transition-colors"
                        >
                            Terms
                        </button>
                        {" "}and{" "}
                        <button
                            type="button"
                            onClick={() => setLegalModal({ open: true, type: "privacy" })}
                            className="text-teal hover:text-teal-neon hover:underline transition-colors"
                        >
                            Privacy Policy
                        </button>
                        .
                    </p>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-sm text-muted">
                            Already have an account?{" "}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-teal hover:text-teal-neon
                font-medium hover:underline transition-all"
                            >
                                Log In
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Legal Modal */}
            <LegalModal
                open={legalModal.open}
                type={legalModal.type}
                onClose={() => setLegalModal({ open: false, type: null })}
            />
        </div>
    );
};

export default SignUp;
