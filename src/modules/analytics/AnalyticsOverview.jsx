import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

const AnalyticsOverview = () => {
    const navigate = useNavigate();
    const [snapshot, setSnapshot] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestData = async () => {
            try {
                const response = await api.get("/api/reports");
                const reports = response.data.data.reports || [];
                if (reports.length > 0) {
                    const latest = reports[0];
                    setSnapshot({
                        summary: {
                            overallQuestionAccuracy: latest.summary?.overallQuestionAccuracy,
                            overallConceptAccuracy: latest.summary?.overallConceptAccuracy,
                            totalQuestionAttempts: latest.summary?.totalQuestionAttempts,
                            totalConceptAttempts: latest.summary?.totalConceptAttempts,
                        },
                        createdAt: latest.createdAt
                    });

                    // Fetch full report for recommendations
                    const fullReport = await api.get(`/api/reports/${latest.id}`);
                    const recs = fullReport.data.data.report?.recommendations || [];
                    setRecommendations(recs);
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestData();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4" />
                <p className="text-muted">Loading your performance...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Intelligence */}
            <HeroIntelligence snapshot={snapshot} recommendations={recommendations} />

            {/* Command Bar */}
            <AnalyticsCommandBar recommendations={recommendations} />

            {/* Next Steps */}
            {recommendations.length > 0 && (
                <NextSteps recommendations={recommendations} navigate={navigate} />
            )}

            {/* Additional Tools */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                    More Tools
                </h2>
                <AnalyticsQuickActions navigate={navigate} />
            </div>

            {/* Current State */}
            {snapshot && (
                <CurrentState snapshot={snapshot} />
            )}
        </div>
    );
};

function HeroIntelligence({ snapshot, recommendations }) {
    const weak = recommendations?.filter(r => r.severity === "critical" || r.severity === "weak") || [];
    const currentAccuracy = snapshot?.summary?.overallQuestionAccuracy || 0;
    const projected = Math.round(currentAccuracy + 6);

    return (
        <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">
                Your Performance Today
            </h1>

            {weak.length > 0 ? (
                <p className="text-lg text-muted">
                    You're at {Math.round(currentAccuracy)}%.{" "}
                    {weak.length} weak {weak.length === 1 ? "area is" : "areas are"} holding you back.
                    Fix them and you'll cross ~{projected}%.
                </p>
            ) : currentAccuracy > 0 ? (
                <p className="text-lg text-muted">
                    You're stable at {Math.round(currentAccuracy)}%. Maintain momentum.
                </p>
            ) : (
                <p className="text-lg text-muted">
                    Start practicing to track your progress.
                </p>
            )}
        </div>
    );
}

function AnalyticsCommandBar({ recommendations }) {
    const [input, setInput] = useState("");
    const weak = recommendations?.filter(r => r.severity === "critical" || r.severity === "weak") || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Analytics command:", input);
        // TODO: route to astra endpoint with analytics context
    };

    const placeholder = weak.length > 0
        ? `Fix ${weak[0].conceptName} (${Math.round(weak[0].currentAccuracy)}%)`
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

function NextSteps({ recommendations, navigate }) {
    const weak = recommendations
        .filter(r => r.severity === "critical" || r.severity === "weak")
        .slice(0, 3);

    if (weak.length === 0) return null;

    return (
        <div>
            <h2 className="text-xl font-semibold text-white mb-4">
                Next Steps
            </h2>

            <div className="space-y-3">
                {weak.map((rec) => (
                    <button
                        key={rec.conceptId || rec.conceptName}
                        onClick={() => console.log("Practice:", rec.conceptName)}
                        className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal/40 p-4 rounded-xl transition group"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-white group-hover:text-teal transition">
                                    {rec.conceptName}
                                </p>
                                <p className="text-sm text-muted mt-1">
                                    {rec.nextActionLabel || "Review and practice"}
                                </p>
                            </div>
                            <span className="text-lg font-semibold text-white">
                                {Math.round(rec.currentAccuracy)}%
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
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
        },
        { 
            title: "Build Study Plan", 
            route: "/analytics/study-plan",
            description: "Get a personalized roadmap"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal/40 p-5 rounded-xl text-left transition group"
        >
            <p className="font-semibold text-white mb-1 group-hover:text-teal transition">
                {title}
            </p>
            <p className="text-sm text-muted">
                {description}
            </p>
        </button>
    );
}

function CurrentState({ snapshot }) {
    const formatDate = (dateString) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-muted uppercase tracking-wide">
                    Current State
                </h3>
                <span className="text-xs text-muted">
                    {formatDate(snapshot.createdAt)}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SnapshotStat 
                    label="Overall Accuracy" 
                    value={snapshot.summary?.overallQuestionAccuracy != null ? `${Math.round(snapshot.summary.overallQuestionAccuracy)}%` : "N/A"}
                />
                <SnapshotStat 
                    label="Concept Accuracy" 
                    value={snapshot.summary?.overallConceptAccuracy != null ? `${Math.round(snapshot.summary.overallConceptAccuracy)}%` : "N/A"}
                />
                <SnapshotStat 
                    label="Total Attempts" 
                    value={snapshot.summary?.totalQuestionAttempts || 0}
                />
                <SnapshotStat 
                    label="Concepts Tracked" 
                    value={snapshot.summary?.totalConceptAttempts || 0}
                />
            </div>
        </div>
    );
}

function SnapshotStat({ label, value }) {
    return (
        <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">
                {value}
            </div>
            <div className="text-xs text-muted">
                {label}
            </div>
        </div>
    );
}

export default AnalyticsOverview;
