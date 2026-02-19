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

    const startFocusSession = (session) => {
        console.log("Starting focus session:", session);
        // TODO: route to MCQ drill mode
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4" />
                <p className="text-muted">Loading your performance...</p>
            </div>
        );
    }

    const primary = recommendations
        ?.filter(r => r.severity === "critical" || r.severity === "weak")
        ?.sort((a,b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];

    return (
        <div>
            {/* Subtle Hero */}
            <div className="space-y-2 mb-6">
                <h1 className="text-3xl font-semibold text-white">
                    Performance OS
                </h1>
                <p className="text-muted text-sm">
                    One thing matters right now.
                </p>
            </div>

            {/* Primary Focus Card - DOMINANT */}
            <PrimaryFocusCard 
                primary={primary}
                snapshot={snapshot}
                onStartFocus={startFocusSession}
            />

            {/* Command Bar */}
            <div className="mt-10">
                <AnalyticsCommandBar primary={primary} />
            </div>

            {/* Explore Tools - Below Fold */}
            <div className="mt-12">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Explore
                </h2>
                <AnalyticsQuickActions navigate={navigate} />
            </div>

            {/* Compact Snapshot */}
            {snapshot && (
                <CompactSnapshot snapshot={snapshot} />
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

function CompactSnapshot({ snapshot }) {
    const accuracy = snapshot.summary?.overallQuestionAccuracy;
    const concepts = snapshot.summary?.totalConceptAttempts;
    const attempts = snapshot.summary?.totalQuestionAttempts;

    return (
        <div className="mt-12 text-sm text-muted flex flex-wrap gap-6">
            {accuracy != null && (
                <span>Overall: {Math.round(accuracy)}%</span>
            )}
            {concepts != null && (
                <span>Concepts: {concepts}</span>
            )}
            {attempts != null && (
                <span>Attempts: {attempts}</span>
            )}
        </div>
    );
}

export default AnalyticsOverview;
