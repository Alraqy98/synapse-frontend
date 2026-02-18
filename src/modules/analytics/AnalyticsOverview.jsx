import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

const AnalyticsOverview = () => {
    const navigate = useNavigate();
    const [snapshot, setSnapshot] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestSnapshot = async () => {
            try {
                const response = await api.get("/api/reports");
                const reports = response.data.data.reports || [];
                if (reports.length > 0) {
                    const latest = reports[0];
                    setSnapshot({
                        overallAccuracy: latest.summary?.overallQuestionAccuracy,
                        conceptAccuracy: latest.summary?.overallConceptAccuracy,
                        totalAttempts: latest.summary?.totalQuestionAttempts,
                        conceptsTracked: latest.summary?.totalConceptAttempts,
                        createdAt: latest.createdAt
                    });
                }
            } catch (err) {
                console.error("Failed to fetch snapshot:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestSnapshot();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                    Performance OS
                </h1>
                <p className="text-lg text-muted">
                    Ask questions, generate reports, and accelerate mastery.
                </p>
            </div>

            {/* Command Bar */}
            <AnalyticsCommandBar />

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                    Quick Actions
                </h2>
                <AnalyticsQuickActions navigate={navigate} />
            </div>

            {/* Compact Snapshot */}
            {!loading && snapshot && (
                <CompactSnapshot snapshot={snapshot} />
            )}
        </div>
    );
};

function AnalyticsCommandBar() {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Analytics command:", input);
        // TODO: route to astra endpoint with analytics context
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-teal/30 transition"
        >
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your performance, study gaps, or generate a report..."
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
            description: "Analyze specific deck performance"
        },
        { 
            title: "Analyze File", 
            route: "/analytics/files",
            description: "Track file-level progress"
        },
        { 
            title: "Analyze Folder", 
            route: "/analytics/files?mode=folder",
            description: "Overview by folder grouping"
        },
        { 
            title: "Build Study Plan", 
            route: "/analytics/study-plan",
            description: "Generate targeted plan"
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

function CompactSnapshot({ snapshot }) {
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
                    Latest Snapshot
                </h3>
                <span className="text-xs text-muted">
                    {formatDate(snapshot.createdAt)}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SnapshotStat 
                    label="Overall Accuracy" 
                    value={snapshot.overallAccuracy != null ? `${Math.round(snapshot.overallAccuracy)}%` : "N/A"}
                />
                <SnapshotStat 
                    label="Concept Accuracy" 
                    value={snapshot.conceptAccuracy != null ? `${Math.round(snapshot.conceptAccuracy)}%` : "N/A"}
                />
                <SnapshotStat 
                    label="Total Attempts" 
                    value={snapshot.totalAttempts || 0}
                />
                <SnapshotStat 
                    label="Concepts Tracked" 
                    value={snapshot.conceptsTracked || 0}
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
