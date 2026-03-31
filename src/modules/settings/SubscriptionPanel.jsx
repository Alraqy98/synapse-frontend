import React, { useMemo } from "react";
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
    const sub = useMemo(() => deriveSubscription(profile), [profile]);

    const effectiveStatus = useMemo(() => normalizeSubscriptionStatus(sub.status), [sub.status]);

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
        if (effectiveStatus === "canceled") {
            return "Subscription canceled";
        }
        return "No active subscription";
    }, [sub, effectiveStatus]);

    const showCancelButton = ["monthly_active", "annual_active", "free_trial"].includes(effectiveStatus);
    /** Upgrade / subscribe CTAs — not for founder_lifetime or annual_active */
    const showUpgradeButton = ["no_subscription", "free_trial", "monthly_active", "canceled"].includes(
        effectiveStatus
    );

    const showStartSubscription = effectiveStatus === "no_subscription";
    const showUpgradeNow = effectiveStatus === "free_trial";
    const showUpgradeToAnnual = effectiveStatus === "monthly_active";
    const showReactivate = effectiveStatus === "canceled";

    const upgradeButtonClass =
        "bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-md font-medium transition-colors";

    return (
        <div className="space-y-8">
            <div>
                <div className="text-xs uppercase tracking-wider text-teal-400 mb-3">Subscription</div>
                <h2 className="text-2xl font-semibold text-white mb-6">Billing &amp; plan</h2>

                <div className="space-y-6">
                    <div className="bg-white/[0.02] rounded-md p-4 text-base text-gray-300">{statusLine}</div>

                    {showUpgradeButton && (
                        <div>
                            {showStartSubscription && (
                                <button
                                    type="button"
                                    className={upgradeButtonClass}
                                    onClick={() => redirectToStripeCheckout("monthly")}
                                >
                                    Start your subscription
                                </button>
                            )}
                            {showUpgradeNow && (
                                <button
                                    type="button"
                                    className={upgradeButtonClass}
                                    onClick={() => redirectToStripeCheckout("monthly")}
                                >
                                    Upgrade Now
                                </button>
                            )}
                            {showUpgradeToAnnual && (
                                <button
                                    type="button"
                                    className={upgradeButtonClass}
                                    onClick={() => redirectToStripeCheckout("annual")}
                                >
                                    Upgrade to Annual
                                </button>
                            )}
                            {showReactivate && (
                                <button
                                    type="button"
                                    className={upgradeButtonClass}
                                    onClick={() => redirectToStripeCheckout("monthly")}
                                >
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
            {showCancelButton && (
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
        </div>
    );
}
