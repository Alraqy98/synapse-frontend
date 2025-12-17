import React, { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;
const RESEND_DELAY = 30; // seconds

const maskEmail = (email) => {
    const [name, domain] = email.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
};

const VerifyOtp = ({ email, password, onVerified }) => {
    const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(RESEND_DELAY);

    const inputsRef = useRef([]);

    // Countdown timer
    useEffect(() => {
        if (timer <= 0) return;
        const id = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [timer]);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;

        const next = [...digits];
        next[index] = value;
        setDigits(next);

        if (value && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const otp = digits.join("");

    const handleVerify = async (e) => {
        e.preventDefault();
        setError(null);

        if (otp.length !== OTP_LENGTH) {
            setError("Please enter the full code.");
            return;
        }

        setLoading(true);

        try {
            // 1️⃣ Verify OTP
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, otp }),
                }
            );

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "OTP verification failed");

            // 2️⃣ Auto-login
            const loginRes = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                }
            );

            const loginJson = await loginRes.json();
            if (!loginRes.ok)
                throw new Error(loginJson.error || "Auto-login failed");

            // 3️⃣ Save token
            localStorage.setItem(
                "token",
                loginJson.data.session.access_token
            );

            onVerified();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setTimer(RESEND_DELAY);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();

        await fetch(`${import.meta.env.VITE_API_URL}/auth/request-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black/80">
            <form
                onSubmit={handleVerify}
                className="panel w-full max-w-md p-8 text-center animate-fade-in-up"
            >
                <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
                <p className="text-sm text-muted mb-6">
                    Enter the 6-digit code sent to <br />
                    <span className="font-medium text-white">
                        {maskEmail(email)}
                    </span>
                </p>

                <div className="flex justify-center gap-3 mb-6">
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => (inputsRef.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="w-12 h-14 text-center text-xl font-bold rounded-xl
                         bg-[#0f1317] border border-white/10
                         focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal hover:bg-teal-neon text-black
                     font-bold py-4 rounded-xl transition-all
                     shadow-[0_0_20px_rgba(0,200,180,0.35)]"
                >
                    {loading ? "Verifying..." : "Confirm & Continue"}
                </button>

                <div className="mt-6 text-sm text-muted">
                    {timer > 0 ? (
                        <span>Resend code in {timer}s</span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-teal hover:underline"
                        >
                            Resend code
                        </button>
                    )}
                </div>

                <p className="mt-4 text-xs text-muted flex items-center justify-center gap-1">
                    🔒 Code expires in 5 minutes
                </p>
            </form>
        </div>
    );
};

export default VerifyOtp;
