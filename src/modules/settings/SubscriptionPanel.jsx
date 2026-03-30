import React, { useMemo, useState, useEffect } from "react";

/** Matches LandingPricing paid-tier feature bullets */
const MODAL_PAID_FEATURES = [
    "Unlimited access — every feature, no caps",
    "Full Learning State, Performance Mentor & Planner",
    "Summaries, MCQ, flashcards, reinforcement & more",
    "Cancel anytime — no long-term lock-in",
];

const BADGE_CLASS =
    "inline-flex items-center font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 rounded-md bg-teal-500/20 text-teal-400";

// TODO: Query subscription status from API
// Endpoint: GET /api/subscriptions/:userId
// Returns: {
//   status: 'no_subscription' | 'free_trial' | 'monthly_active' | 'annual_active' | 'canceled',
//   trial_end_date: ISO string | null,
//   next_billing_date: ISO string | null,
//   current_plan: 'monthly' | 'annual' | null
// }

function isUniversityEmail(email) {
    if (!email || typeof email !== "string") return false;
    const lower = email.toLowerCase().trim();
    const domain = lower.split("@")[1];
    if (!domain) return false;
    return domain.endsWith(".edu") || domain.endsWith(".std");
}

function deriveSubscription(profile) {
    const raw = profile?.subscription;
    if (raw && typeof raw === "object") {
        return {
            status: raw.status ?? null,
            trialEndDate: raw.trial_end_date ?? null,
            nextBillingDate: raw.next_billing_date ?? null,
            currentPlan: raw.current_plan ?? null,
        };
    }
    return {
        status: profile?.subscription_status ?? null,
        trialEndDate: profile?.trial_end_date ?? null,
        nextBillingDate: profile?.next_billing_date ?? null,
        currentPlan: profile?.current_plan ?? null,
    };
}

function formatDisplayDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function daysRemaining(iso) {
    if (!iso) return null;
    const end = new Date(iso);
    if (Number.isNaN(end.getTime())) return null;
    const diff = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Default / new users: no `status` or explicit `no_subscription` */
function normalizeSubscriptionStatus(status) {
    if (status === null || status === undefined || status === "") {
        return "no_subscription";
    }
    return status;
}

export default function SubscriptionPanel({ profile }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    const sub = useMemo(() => deriveSubscription(profile), [profile]);
    const email = profile?.email ?? "";
    const university = isUniversityEmail(email);

    const effectiveStatus = useMemo(() => normalizeSubscriptionStatus(sub.status), [sub.status]);

    const statusLine = useMemo(() => {
        const { trialEndDate, nextBillingDate } = sub;
        if (effectiveStatus === "no_subscription") {
            return "No active subscription";
        }
        if (effectiveStatus === "free_trial") {
            const days = daysRemaining(trialEndDate);
            if (days == null) return "Free trial: —";
            return `Free trial: ${days} day${days === 1 ? "" : "s"} remaining`;
        }
        if (effectiveStatus === "monthly_active" || effectiveStatus === "annual_active") {
            return `Next billing date: ${formatDisplayDate(nextBillingDate)}`;
        }
        if (effectiveStatus === "canceled") {
            return "Subscription canceled";
        }
        return "No active subscription";
    }, [sub, effectiveStatus]);

    const showStartSubscription = effectiveStatus === "no_subscription";
    const showUpgradeNow = effectiveStatus === "free_trial";
    const showUpgradeToAnnual = effectiveStatus === "monthly_active";
    const showReactivate = effectiveStatus === "canceled";
    const showAnyUpgrade =
        showStartSubscription || showUpgradeNow || showUpgradeToAnnual || showReactivate;

    const openModal = (planPref) => {
        const next = planPref === "annual" ? "annual" : "monthly";
        setSelectedPlan(next);
        setModalOpen(true);
    };

    useEffect(() => {
        if (!modalOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") setModalOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [modalOpen]);

    const handleConfirmCheckout = () => {
        // TODO: Integrate Lemon Squeezy / Stripe checkout
        // Pass: email, plan (monthly/annual), price (15/10/80)
        // Redirect to: https://lemonsqueezy.com/checkout/... or Stripe session
        // On success: Return to /settings with profile updated
        setModalOpen(false);
    };

    const upgradeButtonClass =
        "bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-md font-medium transition-colors";

    return (
        <div className="space-y-8">
            <div>
                <div className="text-xs uppercase tracking-wider text-teal-400 mb-3">Subscription</div>
                <h2 className="text-2xl font-semibold text-white mb-6">Billing &amp; plan</h2>

                <div className="space-y-6">
                    <div className="bg-white/[0.02] rounded-md p-4 text-base text-gray-300">{statusLine}</div>

                    {showAnyUpgrade && (
                        <div>
                            {showStartSubscription && (
                                <button
                                    type="button"
                                    className={upgradeButtonClass}
                                    onClick={() => openModal("monthly")}
                                >
                                    Start your subscription
                                </button>
                            )}
                            {showUpgradeNow && (
                                <button type="button" className={upgradeButtonClass} onClick={() => openModal("monthly")}>
                                    Upgrade Now
                                </button>
                            )}
                            {showUpgradeToAnnual && (
                                <button type="button" className={upgradeButtonClass} onClick={() => openModal("annual")}>
                                    Upgrade to Annual
                                </button>
                            )}
                            {showReactivate && (
                                <button type="button" className={upgradeButtonClass} onClick={() => openModal("monthly")}>
                                    Reactivate Subscription
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* TODO: Connect to subscription cancellation API */}
            {/* Should show confirmation modal before canceling */}
            {/* Update profile.subscription_status = "canceled" */}
            {(effectiveStatus === "monthly_active" ||
                effectiveStatus === "annual_active" ||
                effectiveStatus === "free_trial") && (
                <div className="pt-2 border-t border-white/5">
                    <button
                        type="button"
                        className="px-6 py-2 rounded-md font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={() => {
                            // TODO: confirmation modal + cancel API
                        }}
                    >
                        Cancel subscription
                    </button>
                </div>
            )}

            {modalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="subscription-modal-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModalOpen(false);
                    }}
                >
                    <div className="bg-[#0D0F12] border border-white/10 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 id="subscription-modal-title" className="text-2xl font-bold text-white mb-8">
                            Choose your plan
                        </h3>

                        <div className="flex flex-col sm:flex-row gap-6">
                            {/* Monthly — LandingPricing-aligned */}
                            <button
                                type="button"
                                onClick={() => setSelectedPlan("monthly")}
                                className={`flex-1 flex flex-col text-left rounded-lg border p-6 cursor-pointer transition-all duration-200 relative overflow-hidden min-w-0 ${
                                    selectedPlan === "monthly"
                                        ? "border-teal-500 bg-teal-500/10"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                }`}
                            >
                                {selectedPlan === "monthly" && (
                                    <span
                                        className={`absolute top-4 right-4 ${BADGE_CLASS}`}
                                        aria-hidden
                                    >
                                        Recommended
                                    </span>
                                )}
                                <div className="text-base font-bold text-white mb-4 pr-16">Monthly</div>
                                <div className="text-2xl font-bold text-white leading-none">
                                    <span className="text-lg opacity-60 font-semibold">$</span>15
                                    <span className="text-lg opacity-60 font-semibold">/mo</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-2 mb-4">Billed monthly, cancel anytime</p>

                                {university && (
                                    <div className="border-2 border-teal-500 bg-teal-500/5 rounded-lg p-4 mt-2 mb-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wide">
                                                University email
                                            </span>
                                            <span className={BADGE_CLASS}>Save $60/year</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mb-1">.edu or .std</div>
                                        <div className="text-2xl font-bold text-white leading-none">
                                            <span className="text-lg opacity-60 font-semibold">$</span>10
                                            <span className="text-lg opacity-60 font-semibold">/mo</span>
                                        </div>
                                        <p className="text-xs text-teal-400/90 font-medium mt-2">
                                            Student &amp; faculty discount
                                        </p>
                                    </div>
                                )}

                                <div className="h-px bg-white/10 my-4" />
                                <ul className="space-y-2.5 text-left flex-1">
                                    {MODAL_PAID_FEATURES.map((line) => (
                                        <li
                                            key={`m-${line}`}
                                            className="flex items-start gap-2.5 text-sm text-gray-300"
                                        >
                                            <span className="text-teal-400 flex-shrink-0 mt-0.5" aria-hidden>
                                                ✓
                                            </span>
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                            </button>

                            {/* Annual */}
                            <button
                                type="button"
                                onClick={() => setSelectedPlan("annual")}
                                className={`flex-1 flex flex-col text-left rounded-lg border p-6 cursor-pointer transition-all duration-200 relative overflow-hidden min-w-0 ${
                                    selectedPlan === "annual"
                                        ? "border-teal-500 bg-teal-500/10"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                }`}
                            >
                                <span
                                    className={`absolute top-4 right-4 ${BADGE_CLASS}`}
                                    aria-hidden
                                >
                                    Best value
                                </span>
                                <div className="text-base font-bold text-white mb-4 pr-16">Annual</div>
                                <div className="text-2xl font-bold text-white leading-none">
                                    <span className="text-lg opacity-60 font-semibold">$</span>80
                                    <span className="text-lg opacity-60 font-semibold">/yr</span>
                                </div>
                                <p className="text-sm text-teal-400 font-medium mt-2 mb-1">Save 33% vs monthly</p>
                                <p className="text-xs text-gray-400 mb-4">
                                    Unlimited access · billed once per year · cancel anytime
                                </p>

                                <div className="h-px bg-white/10 my-4" />
                                <ul className="space-y-2.5 text-left flex-1">
                                    {MODAL_PAID_FEATURES.map((line) => (
                                        <li
                                            key={`a-${line}`}
                                            className="flex items-start gap-2.5 text-sm text-gray-300"
                                        >
                                            <span className="text-teal-400 flex-shrink-0 mt-0.5" aria-hidden>
                                                ✓
                                            </span>
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8">
                            <button
                                type="button"
                                className="px-6 py-2 rounded-md font-medium border border-white/10 text-gray-300 hover:bg-white/[0.06] transition-colors"
                                onClick={() => setModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-6 py-2 rounded-md font-medium bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                                onClick={handleConfirmCheckout}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
