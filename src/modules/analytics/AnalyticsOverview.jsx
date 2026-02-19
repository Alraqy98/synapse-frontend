import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../lib/api";

const AnalyticsOverview = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get("/api/analytics/dashboard");
                setData(response.data.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4" />
                <p className="text-muted">Loading your performance...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted">No performance data available yet.</p>
                <p className="text-sm text-muted mt-2">Complete some MCQ sessions to get started.</p>
            </div>
        );
    }

    const { weakestConcepts, recentTrend, lastSessionId } = data;

    // Calculate momentum state
    const momentum = calculateMomentum(recentTrend);
    const momentumState = classifyMomentum(momentum);
    const overallAccuracy = recentTrend && recentTrend.length > 0 
        ? recentTrend[recentTrend.length - 1].accuracy 
        : null;

    return (
        <div>
            {/* Momentum Hero */}
            <MomentumHero 
                momentumState={momentumState}
                momentum={momentum}
                overallAccuracy={overallAccuracy}
                recentTrend={recentTrend}
            />

            {/* Primary Risk Block */}
            {weakestConcepts && weakestConcepts.length > 0 && (
                <PrimaryRiskCard 
                    concept={weakestConcepts[0]}
                    momentumState={momentumState}
                />
            )}

            {/* Command Bar */}
            <div className="mt-10">
                <AnalyticsCommandBar weakestConcept={weakestConcepts?.[0]} />
            </div>

            {/* Explore Tools - Below Fold */}
            <div className="mt-12">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Explore
                </h2>
                <AnalyticsQuickActions navigate={navigate} />
            </div>
        </div>
    );
};

// Momentum calculation helpers
function calculateMomentum(recentTrend) {
    if (!recentTrend || recentTrend.length < 2) return null;
    const first = recentTrend[0].accuracy;
    const last = recentTrend[recentTrend.length - 1].accuracy;
    return last - first;
}

function classifyMomentum(momentum) {
    if (momentum === null) return "INSUFFICIENT_DATA";
    if (momentum >= 3) return "RISING";
    if (momentum <= -2) return "DECLINING";
    return "STABLE";
}

// Momentum Hero - Dynamic headline based on trajectory
function MomentumHero({ momentumState, momentum, overallAccuracy, recentTrend }) {
    if (momentumState === "INSUFFICIENT_DATA") {
        return (
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Performance OS
                </h1>
                <p className="text-lg text-muted">
                    Not enough data yet. Complete more sessions to track your momentum.
                </p>
            </div>
        );
    }

    const momentumConfig = {
        RISING: {
            headline: "You're Gaining Momentum",
            color: "text-teal",
            borderColor: "border-teal/20",
            bgColor: "bg-teal/5"
        },
        STABLE: {
            headline: "Your Growth Has Plateaued",
            color: "text-yellow-400",
            borderColor: "border-yellow-400/20",
            bgColor: "bg-yellow-400/5"
        },
        DECLINING: {
            headline: "You're Slipping",
            color: "text-red-400",
            borderColor: "border-red-400/20",
            bgColor: "bg-red-400/5"
        }
    };

    const config = momentumConfig[momentumState];

    return (
        <div className={`mb-8 border-2 ${config.borderColor} ${config.bgColor} rounded-2xl p-6`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className={`text-3xl font-bold ${config.color} mb-2`}>
                        {config.headline}
                    </h1>
                    <p className="text-lg text-white">
                        {momentum > 0 ? "+" : ""}{Math.round(momentum)}% in last 7 days
                    </p>
                </div>
                {overallAccuracy != null && (
                    <div className="text-right">
                        <p className="text-sm text-muted uppercase tracking-wide mb-1">Current</p>
                        <p className="text-3xl font-bold text-white">
                            {Math.round(overallAccuracy)}%
                        </p>
                    </div>
                )}
            </div>

            {/* Mini Sparkline */}
            {recentTrend && recentTrend.length >= 2 && (
                <div className="mt-4">
                    <MiniSparkline data={recentTrend} momentumState={momentumState} />
                </div>
            )}
        </div>
    );
}

// Primary Risk Card - Shows weakest concept with severity labeling
function PrimaryRiskCard({ concept, momentumState }) {
    if (!concept) return null;

    const accuracy = concept.accuracy;
    const riskLevel = accuracy < 60 ? "HIGH_RISK" : accuracy < 70 ? "NEEDS_REINFORCEMENT" : "MAINTAIN";

    const riskConfig = {
        HIGH_RISK: {
            label: "High Risk",
            color: "text-red-400",
            borderColor: "border-red-400/40",
            bgColor: "bg-red-400/10",
            alert: "⚠ Weak concept decaying"
        },
        NEEDS_REINFORCEMENT: {
            label: "Needs Reinforcement",
            color: "text-yellow-400",
            borderColor: "border-yellow-400/40",
            bgColor: "bg-yellow-400/10",
            alert: null
        },
        MAINTAIN: {
            label: "Maintain",
            color: "text-teal",
            borderColor: "border-teal/40",
            bgColor: "bg-teal/10",
            alert: null
        }
    };

    const config = riskConfig[riskLevel];

    // Contextual CTA based on momentum
    const ctaConfig = {
        DECLINING: { label: "Recover Accuracy", duration: "20 mins" },
        STABLE: { label: "Break the Plateau", duration: "15 mins" },
        RISING: { label: "Lock In Gains", duration: "10 mins" }
    };

    const cta = ctaConfig[momentumState] || { label: "Start Practice", duration: "15 mins" };

    return (
        <div className={`border-2 ${config.borderColor} ${config.bgColor} rounded-2xl p-8 mb-8`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs uppercase tracking-wider text-muted mb-2">
                        Your Biggest Risk Right Now
                    </p>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {concept.name}
                    </h2>
                </div>
                <span className={`text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full ${config.color} border ${config.borderColor}`}>
                    {config.label}
                </span>
            </div>

            <div className="flex items-baseline gap-4 mb-6">
                <span className={`text-4xl font-bold ${config.color}`}>
                    {Math.round(accuracy)}%
                </span>
                <span className="text-sm text-muted">
                    {concept.totalAttempts} attempts
                </span>
            </div>

            {/* Behavioral Signal */}
            {config.alert && (
                <div className="mb-6 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
                    <p className="text-sm text-red-400">{config.alert}</p>
                </div>
            )}

            {momentumState === "DECLINING" && (
                <div className="mb-6 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
                    <p className="text-sm text-red-400">↓ Performance trending down</p>
                </div>
            )}

            {/* Contextual CTA */}
            <Link
                to={`/analytics/concepts/${concept.id}`}
                className="block w-full bg-teal-500 hover:bg-teal-600 text-black py-4 rounded-xl text-center text-lg font-semibold transition hover:scale-[1.01]"
            >
                {cta.label} ({cta.duration})
            </Link>
        </div>
    );
}

// Mini Sparkline Component
function MiniSparkline({ data, momentumState }) {
    const width = 200;
    const height = 40;
    
    const accuracies = data.map(d => d.accuracy);
    const max = Math.max(...accuracies);
    const min = Math.min(...accuracies);
    const range = max - min || 1;

    const xScale = (i) => (i / (data.length - 1)) * width;
    const yScale = (val) => height - ((val - min) / range) * height;

    const path = data
        .map((d, i) => {
            const x = xScale(i);
            const y = yScale(d.accuracy);
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(" ");

    const colorMap = {
        RISING: "rgb(0,245,204)",
        STABLE: "rgb(251,191,36)",
        DECLINING: "rgb(248,113,113)"
    };

    const strokeColor = colorMap[momentumState] || "rgb(245,245,247)";

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10">
            <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function AnalyticsCommandBar({ weakestConcept }) {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Analytics command:", input);
        // TODO: route to astra endpoint with analytics context
    };

    const placeholder = weakestConcept
        ? `Fix ${weakestConcept.name} (${Math.round(weakestConcept.accuracy)}%)`
        : "Ask about your performance...";

    return (
        <form 
            onSubmit={handleSubmit} 
            className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-teal/30 transition"
        >
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent outline-none text-white placeholder:text-muted"
            />
        </form>
    );
}

function AnalyticsQuickActions({ navigate }) {
    const actions = [
        { 
            title: "Generate Deck Report", 
            route: "/analytics/decks",
            description: "Deep dive into deck performance"
        },
        { 
            title: "Track File Progress", 
            route: "/analytics/files",
            description: "See how you're doing per file"
        },
        { 
            title: "Analyze Folder", 
            route: "/analytics/files?mode=folder",
            description: "Overview by folder grouping"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actions.map((action) => (
                <ActionCard 
                    key={action.route}
                    title={action.title}
                    description={action.description}
                    onClick={() => navigate(action.route)}
                />
            ))}
        </div>
    );
}

function ActionCard({ title, description, onClick }) {
    return (
        <button
            onClick={onClick}
            className="bg-white/5 hover:bg-white/10 p-4 rounded-xl text-left transition group text-sm"
        >
            <p className="font-medium text-white mb-1 group-hover:text-teal transition">
                {title}
            </p>
            <p className="text-xs text-muted">
                {description}
            </p>
        </button>
    );
}

export default AnalyticsOverview;
