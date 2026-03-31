import React, { useMemo, useState, useEffect } from "react";
import api from "../../lib/api";

// TODO: Query subscription status from API
// Endpoint: GET /api/subscriptions/:userId
// Returns: {
//   status: 'no_subscription' | 'founder_lifetime' | 'free_trial' | 'monthly_active' | 'annual_active' | 'canceled',
//   trial_end_date: ISO string | null,
//   next_billing_date: ISO string | null,
//   current_plan: 'monthly' | 'annual' | null
// }

function deriveSubscription(profile) {
    const raw = profile?.subscription;
    if (raw && typeof raw === "object") {
        return {
            status: raw.status ?? null,
            trialEndDate: raw.trial_end_date ?? null,
            /** End of paid period (billing cycle / Stripe grace); prefer explicit next bill, else period end */
            nextBillingDate:
                raw.next_billing_date ?? raw.current_period_end ?? raw.subscription_ends_at ?? null,
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

async function redirectToStripeCheckout(planType) {
    try {
        const res = await api.post("/api/checkout/create-session", { planType });
        const url = res.data?.url ?? res.data?.data?.url;
        if (url) {
            window.location.href = url;
        } else {
            console.error("Checkout failed: no redirect URL in response", res.data);
        }
    } catch (err) {
        console.error("Checkout failed:", err);
    }
}

export default function SubscriptionPanel({ profile }) {
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [, setSelectedPlan] = useState(null); // 'monthly' | 'annual' | null — set before checkout redirect
    const [cancelLoading, setCancelLoading] = useState(false);
    const [modal, setModal] = useState(null); // 'confirm' | 'alert' | null
    const [modalContent, setModalContent] = useState({ title: "", message: "", action: null });

    const sub = useMemo(() => deriveSubscription(profile), [profile]);

    const handleCancelSubscription = () => {
        setModalContent({
            title: "Cancel Subscription?",
            message:
                "Your subscription will end at the current billing date. You can reactivate anytime.",
            action: async () => {
                setCancelLoading(true);
                try {
                    const res = await api.post("/api/subscriptions/cancel");
                    if (res.data?.success) {
                        setModalContent({
                            title: "Subscription Canceled",
                            message: "Your subscription has been canceled.",
                            action: () => {
                                window.location.reload();
                            },
                        });
                        setModal("alert");
                    } else {
                        setModalContent({
                            title: "Could not cancel",
                            message: "The server did not confirm cancellation. Please try again.",
                            action: () => setModal(null),
                        });
                        setModal("alert");
                    }
                } catch (err) {
                    const msg =
                        err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        "Unknown error";
                    setModalContent({
                        title: "Error",
                        message: `Failed to cancel: ${msg}`,
                        action: () => setModal(null),
                    });
                    setModal("alert");
                } finally {
                    setCancelLoading(false);
                }
            },
        });
        setModal("confirm");
    };

    const effectiveStatus = useMemo(() => normalizeSubscriptionStatus(sub.status), [sub.status]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key !== "Escape") return;
            if (modal) {
                setModal(null);
                return;
            }
            if (showPlanModal) setShowPlanModal(false);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [showPlanModal, modal]);

    const statusLine = useMemo(() => {
        const { trialEndDate, nextBillingDate } = sub;
        if (effectiveStatus === "no_subscription") {
            return "No active subscription";
        }
        if (effectiveStatus === "founder_lifetime") {
            return "⭐ Founder access — Free for life";
        }
        if (effectiveStatus === "free_trial") {
            const days = daysRemaining(trialEndDate);
            if (days == null) return "Free trial: —";
            return `Free trial: ${days} day${days === 1 ? "" : "s"} remaining`;
        }
        if (effectiveStatus === "monthly_active" || effectiveStatus === "annual_active") {
            return `Next billing date: ${formatDisplayDate(nextBillingDate)}`;
        }
        return "No active subscription";
    }, [sub, effectiveStatus]);

    const nextBillingDateObj = useMemo(() => {
        const d = sub.nextBillingDate;
        if (!d) return null;
        const dt = new Date(d);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }, [sub.nextBillingDate]);

    const showCancelButton = ["monthly_active", "annual_active", "free_trial"].includes(effectiveStatus);
    /** Upgrade / subscribe CTAs — not for founder_lifetime, annual_active, or canceled (canceled has its own block) */
    const showUpgradeButton = ["no_subscription", "free_trial", "monthly_active"].includes(effectiveStatus);

    const showStartSubscription = effectiveStatus === "no_subscription";
    const showUpgradeNow = effectiveStatus === "free_trial";
    const showUpgradeToAnnual = effectiveStatus === "monthly_active";

    const upgradeButtonClass =
        "bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-md font-medium transition-colors";

    return (
        <div className="space-y-8">
            <div>
                <div className="text-xs uppercase tracking-wider text-teal-400 mb-3">Subscription</div>
                <h2 className="text-2xl font-semibold text-white mb-6">Billing &amp; plan</h2>

                <div className="space-y-6">
                    {effectiveStatus === "canceled" ? (
                        <div>
                            <p className="text-gray-400 mb-4">
                                Your subscription will end on{" "}
                                {nextBillingDateObj
                                    ? nextBillingDateObj.toLocaleDateString()
                                    : "the specified date"}
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowPlanModal(true)}
                                className="w-full px-4 py-3 bg-teal-500/20 border border-teal-500/50 rounded-lg text-teal-400 hover:bg-teal-500/30 transition"
                            >
                                Reactivate Subscription
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/[0.02] rounded-md p-4 text-base text-gray-300">
                                {statusLine}
                            </div>

                            {showUpgradeButton && (
                                <div>
                                    {showStartSubscription && (
                                        <button
                                            type="button"
                                            className={upgradeButtonClass}
                                            onClick={() => setShowPlanModal(true)}
                                        >
                                            Start your subscription
                                        </button>
                                    )}
                                    {showUpgradeNow && (
                                        <button
                                            type="button"
                                            className={upgradeButtonClass}
                                            onClick={() => setShowPlanModal(true)}
                                        >
                                            Upgrade Now
                                        </button>
                                    )}
                                    {showUpgradeToAnnual && (
                                        <button
                                            type="button"
                                            className={upgradeButtonClass}
                                            onClick={() => setShowPlanModal(true)}
                                        >
                                            Upgrade to Annual
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showCancelButton && (
                <div className="pt-2 border-t border-white/5">
                    <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        className="w-full px-4 py-2 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                        {cancelLoading ? "Canceling..." : "Cancel subscription"}
                    </button>
                </div>
            )}

            {modal === "confirm" && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-modal-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModal(null);
                    }}
                >
                    <div
                        className="bg-[#0D0F12] rounded-lg p-6 max-w-sm w-full border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="confirm-modal-title" className="text-lg font-semibold text-white mb-2">
                            {modalContent.title}
                        </h2>
                        <p className="text-gray-400 mb-6">{modalContent.message}</p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={cancelLoading}
                                onClick={async () => {
                                    setModal(null);
                                    if (modalContent.action) await modalContent.action();
                                }}
                                className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "alert" && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="alert-modal-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModal(null);
                    }}
                >
                    <div
                        className="bg-[#0D0F12] rounded-lg p-6 max-w-sm w-full border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="alert-modal-title" className="text-lg font-semibold text-white mb-2">
                            {modalContent.title}
                        </h2>
                        <p className="text-gray-400 mb-6">{modalContent.message}</p>
                        <button
                            type="button"
                            onClick={() => {
                                setModal(null);
                                if (modalContent.action) modalContent.action();
                            }}
                            className="w-full px-4 py-2 bg-teal-500/20 border border-teal-500/50 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showPlanModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="plan-modal-title"
                    onClick={() => setShowPlanModal(false)}
                >
                    <div
                        className="bg-[#0D0F12] rounded-lg p-8 max-w-2xl w-full border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="plan-modal-title"
                            className="text-2xl font-semibold text-white mb-8 text-center"
                        >
                            Choose your plan
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPlan("monthly");
                                    redirectToStripeCheckout("monthly");
                                    setShowPlanModal(false);
                                }}
                                className="group relative p-6 rounded-lg border-2 border-white/10 hover:border-teal-500/50 bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer text-left"
                            >
                                <div className="text-sm text-gray-400 mb-2">MONTHLY</div>
                                <div className="text-3xl font-bold text-white mb-1">$15</div>
                                <div className="text-sm text-gray-400 mb-4">per month</div>
                                <div className="text-xs text-teal-400">or $10/month with .edu/.std email</div>
                                <div className="mt-4 text-xs text-gray-500">✓ Full access to all features</div>
                                <div className="text-xs text-gray-500">✓ Cancel anytime</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPlan("annual");
                                    redirectToStripeCheckout("annual");
                                    setShowPlanModal(false);
                                }}
                                className="group relative p-6 rounded-lg border-2 border-teal-500/50 bg-teal-500/5 hover:bg-teal-500/10 transition cursor-pointer text-left ring-1 ring-teal-500/20"
                            >
                                <div className="absolute -top-3 left-4 bg-teal-500/20 text-teal-300 text-xs font-semibold px-3 py-1 rounded-full border border-teal-500/30">
                                    BEST VALUE
                                </div>
                                <div className="text-sm text-gray-400 mb-2 mt-2">ANNUAL</div>
                                <div className="text-3xl font-bold text-white mb-1">$80</div>
                                <div className="text-sm text-gray-400 mb-4">per year</div>
                                <div className="text-xs text-teal-400">Save $100 vs monthly</div>
                                <div className="mt-4 text-xs text-gray-500">✓ Full access to all features</div>
                                <div className="text-xs text-gray-500">✓ Best long-term value</div>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowPlanModal(false)}
                            className="w-full px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
