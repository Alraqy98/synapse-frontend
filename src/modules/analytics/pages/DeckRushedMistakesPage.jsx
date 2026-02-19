import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../lib/api";

const DeckRushedMistakesPage = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchRushedMistakes = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/api/analytics/decks/${deckId}/rushed`);
                setData(response.data.data);
            } catch (err) {
                console.error("Failed to fetch rushed mistakes:", err);
                setError(err.response?.data?.error || "Failed to load rushed mistakes");
            } finally {
                setLoading(false);
            }
        };
        fetchRushedMistakes();
    }, [deckId]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4" />
                <p className="text-muted">Loading rushed mistakes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => navigate(-1)} className="btn btn-secondary">
                    Go Back
                </button>
            </div>
        );
    }

    if (!data || !data.questions || data.questions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted mb-2">No rushed mistakes found</p>
                <p className="text-sm text-muted">This is a good sign!</p>
                <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">
                    Go Back
                </button>
            </div>
        );
    }

    const { deckTitle, avgCorrectTime, threshold, questions } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted hover:text-white transition"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
            </div>

            {/* Overview */}
            <div className="bg-white/5 border border-red-400/20 rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-white mb-3">
                    Rushed Mistakes
                </h1>
                <p className="text-sm text-muted mb-4">
                    {deckTitle && `Deck: ${deckTitle}`}
                </p>
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span className="text-muted">Found:</span>{" "}
                        <span className="text-red-400 font-semibold">{questions.length}</span>{" "}
                        <span className="text-muted">questions</span>
                    </div>
                    {threshold && (
                        <div>
                            <span className="text-muted">Rushed threshold:</span>{" "}
                            <span className="text-white font-semibold">{threshold}s</span>
                        </div>
                    )}
                    {avgCorrectTime && (
                        <div>
                            <span className="text-muted">Your avg correct time:</span>{" "}
                            <span className="text-white font-semibold">{avgCorrectTime}s</span>
                        </div>
                    )}
                </div>
                <div className="mt-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <p className="text-sm text-white">
                        These questions were answered incorrectly in under {threshold || "avg"}s.
                        This suggests rushing compromised accuracy.
                    </p>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {questions.map((question, idx) => (
                    <RushedMistakeCard
                        key={question.id || idx}
                        question={question}
                        index={idx}
                    />
                ))}
            </div>
        </div>
    );
};

function RushedMistakeCard({ question, index }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white/5 border border-red-400/20 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-muted">#{index + 1}</span>
                        <span className="text-xs px-2 py-1 rounded bg-red-400/10 border border-red-400/20 text-red-400">
                            {Math.round(question.timeSpent / 1000)}s
                        </span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">
                        {question.text.length > 200 && !expanded
                            ? `${question.text.substring(0, 200)}...`
                            : question.text}
                    </p>
                    {question.text.length > 200 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-teal hover:underline mt-2"
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

            {/* Answer comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {question.yourAnswer && (
                    <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20">
                        <p className="text-xs text-muted mb-1 uppercase tracking-wide">
                            Your Answer
                        </p>
                        <p className="text-sm text-red-400 font-medium">
                            {question.yourAnswer}
                        </p>
                    </div>
                )}
                {question.correctAnswer && (
                    <div className="p-3 rounded-lg bg-teal/10 border border-teal/20">
                        <p className="text-xs text-muted mb-1 uppercase tracking-wide">
                            Correct Answer
                        </p>
                        <p className="text-sm text-teal font-medium">
                            {question.correctAnswer}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DeckRushedMistakesPage;
