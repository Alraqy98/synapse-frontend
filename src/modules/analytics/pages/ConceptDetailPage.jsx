import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../lib/api";
import AccuracyTrendChart from "../components/AccuracyTrendChart";

const ConceptDetailPage = () => {
    const { conceptId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchConceptDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/api/analytics/concepts/${conceptId}/questions`);
                setData(response.data.data);
            } catch (err) {
                console.error("Failed to fetch concept details:", err);
                setError(err.response?.data?.error || "Failed to load concept details");
            } finally {
                setLoading(false);
            }
        };
        fetchConceptDetails();
    }, [conceptId]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4" />
                <p className="text-muted">Loading concept details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => navigate("/analytics")} className="btn btn-secondary">
                    Back to Analytics
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted">No data available</p>
            </div>
        );
    }

    const { concept, questions, accuracyHistory } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/analytics")}
                    className="flex items-center gap-2 text-muted hover:text-white transition"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
            </div>

            {/* Concept Overview */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-white mb-2">
                    {concept.name}
                </h1>
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span className="text-muted">Current Accuracy:</span>{" "}
                        <span className={`font-semibold ${
                            concept.accuracy >= 70 ? "text-teal" : 
                            concept.accuracy >= 50 ? "text-yellow-400" : 
                            "text-red-400"
                        }`}>
                            {Math.round(concept.accuracy)}%
                        </span>
                    </div>
                    <div>
                        <span className="text-muted">Total Attempts:</span>{" "}
                        <span className="text-white">{concept.totalAttempts}</span>
                    </div>
                    <div>
                        <span className="text-muted">Correct:</span>{" "}
                        <span className="text-teal">{concept.correctAttempts}</span>
                    </div>
                </div>
            </div>

            {/* Accuracy Trend */}
            {accuracyHistory && accuracyHistory.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Accuracy Over Time
                    </h2>
                    <AccuracyTrendChart data={accuracyHistory} />
                </div>
            )}

            {/* Question Evidence */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                    Question Evidence ({questions.length})
                </h2>
                <div className="space-y-4">
                    {questions.map((question) => (
                        <QuestionCard key={question.id} question={question} />
                    ))}
                </div>
            </div>
        </div>
    );
};

function QuestionCard({ question }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                    <p className="text-sm text-white leading-relaxed">
                        {question.text.length > 150 && !expanded
                            ? `${question.text.substring(0, 150)}...`
                            : question.text}
                    </p>
                    {question.text.length > 150 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-teal hover:underline mt-1"
                        >
                            {expanded ? "Show less" : "Show more"}
                        </button>
                    )}
                </div>
                {question.sourcePages && question.sourcePages.length > 0 && (
                    <a
                        href={`/library/file/${question.fileId}?page=${question.sourcePages[0]}`}
                        className="text-xs text-teal hover:underline whitespace-nowrap"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Page {question.sourcePages.join(", ")} →
                    </a>
                )}
            </div>

            {/* Attempt History */}
            {question.attempts && question.attempts.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-muted uppercase tracking-wide">
                        Attempt History
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {question.attempts.map((attempt, idx) => (
                            <div
                                key={idx}
                                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-2 ${
                                    attempt.isCorrect
                                        ? "bg-teal/10 border border-teal/30 text-teal"
                                        : "bg-red-400/10 border border-red-400/30 text-red-400"
                                }`}
                            >
                                <span className="font-medium">
                                    {attempt.isCorrect ? "✓" : "✗"}
                                </span>
                                <span>{Math.round(attempt.timeMs / 1000)}s</span>
                                <span className="text-muted">
                                    {new Date(attempt.attemptedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConceptDetailPage;
