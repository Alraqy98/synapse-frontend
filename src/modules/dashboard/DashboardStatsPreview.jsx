import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import api from "../../lib/api";

const DashboardStatsPreview = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchDashboardAnalytics = async () => {
            try {
                const response = await api.get("/api/analytics/dashboard");
                setData(response.data.data);
            } catch (err) {
                console.error("Failed to fetch dashboard analytics:", err);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Performance Snapshot</h2>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                    <div className="text-center text-muted text-sm">Loading...</div>
                </div>
            </div>
        );
    }

    if (!data || !data.weakestConcepts || data.weakestConcepts.length === 0) {
        return (
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Performance Snapshot</h2>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
                    <p className="text-sm text-muted">
                        Complete some MCQ sessions to see your performance insights.
                    </p>
                </div>
            </div>
        );
    }

    const { weakestConcepts, recentTrend, lastSessionId } = data;

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Focus Today</h2>
            
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                {/* Weakest Concepts */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
                        Priority Concepts
                    </h3>
                    <div className="space-y-2">
                        {weakestConcepts.slice(0, 3).map((concept) => (
                            <Link
                                key={concept.id}
                                to={`/analytics/concepts/${concept.id}`}
                                className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-teal/40 transition group"
                            >
                                <div>
                                    <p className="text-sm font-medium text-white group-hover:text-teal transition">
                                        {concept.name}
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        {concept.totalAttempts} attempts
                                    </p>
                                </div>
                                <span className={`text-lg font-semibold ${
                                    concept.accuracy >= 70 ? "text-teal" :
                                    concept.accuracy >= 50 ? "text-yellow-400" :
                                    "text-red-400"
                                }`}>
                                    {Math.round(concept.accuracy)}%
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Trend Mini Chart */}
                {recentTrend && recentTrend.length > 0 && (
                    <div className="mb-6 pb-6 border-b border-white/10">
                        <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
                            Recent Trend
                        </h3>
                        <MiniTrendChart data={recentTrend} />
                    </div>
                )}

                {/* CTAs */}
                <div className="flex gap-3">
                    {lastSessionId && (
                        <button
                            onClick={() => navigate(`/mcq/${lastSessionId}`)}
                            className="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-teal/40 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                        >
                            Resume Last Session
                        </button>
                    )}
                    <Link
                        to="/learning"
                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-black font-semibold py-2 px-4 rounded-lg transition text-sm text-center"
                    >
                        View Full Analytics
                    </Link>
                </div>
            </div>
        </div>
    );
};

function MiniTrendChart({ data }) {
    if (!data || data.length === 0) return null;

    const width = 100;
    const height = 40;
    const sessions = data.slice(-7);

    if (sessions.length < 2) return null;

    const accuracies = sessions.map((s) => s.accuracy);
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    const range = maxAccuracy - minAccuracy || 1;

    const xScale = (index) => (index / (sessions.length - 1)) * width;
    const yScale = (accuracy) => {
        const normalized = (accuracy - minAccuracy) / range;
        return height - normalized * height;
    };

    const linePath = sessions
        .map((session, index) => {
            const x = xScale(index);
            const y = yScale(session.accuracy);
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(" ");

    const trend = sessions[sessions.length - 1].accuracy - sessions[0].accuracy;
    const trendColor = trend > 0 ? "rgb(0,245,204)" : trend < 0 ? "rgb(248,113,113)" : "rgb(245,245,247)";

    return (
        <div className="flex items-center gap-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-10">
                <path
                    d={linePath}
                    fill="none"
                    stroke={trendColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="text-sm">
                <span className={trend >= 0 ? "text-teal" : "text-red-400"}>
                    {trend > 0 ? "+" : ""}{Math.round(trend)}%
                </span>
                <span className="text-muted ml-1">last 7 days</span>
            </div>
        </div>
    );
}

export default DashboardStatsPreview;
