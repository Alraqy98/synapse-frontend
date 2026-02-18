import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../lib/api";

const DeckReportsPage = () => {
    const navigate = useNavigate();
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeckId, setSelectedDeckId] = useState("");
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const response = await api.get("/api/mcq/decks");
                setDecks(response.data.data || []);
            } catch (err) {
                console.error("Failed to fetch decks:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDecks();
    }, []);

    const handleGenerateReport = async () => {
        if (!selectedDeckId) return;

        setGenerating(true);
        try {
            console.log("Generating report for deck:", selectedDeckId);
            // TODO: Call backend to generate deck report
            // await api.post("/api/reports/deck", { deckId: selectedDeckId });
            
            // For now, just navigate back with success message
            setTimeout(() => {
                navigate("/analytics");
            }, 1000);
        } catch (err) {
            console.error("Failed to generate report:", err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-2 text-muted hover:text-white transition"
            >
                <ArrowLeft size={18} />
                <span>Back to Analytics</span>
            </button>

            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Deck Reports
                </h1>
                <p className="text-muted">
                    Generate performance reports for specific MCQ decks.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Select Deck
                </h2>

                {loading ? (
                    <p className="text-muted">Loading decks...</p>
                ) : decks.length === 0 ? (
                    <p className="text-muted">No decks available. Create an MCQ deck first.</p>
                ) : (
                    <>
                        <select
                            value={selectedDeckId}
                            onChange={(e) => setSelectedDeckId(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white outline-none focus:border-teal transition mb-4"
                        >
                            <option value="">-- Select a deck --</option>
                            {decks.map((deck) => (
                                <option key={deck.id} value={deck.id}>
                                    {deck.title} ({deck.total_questions} questions)
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleGenerateReport}
                            disabled={!selectedDeckId || generating}
                            className="w-full bg-teal hover:bg-teal-600 disabled:bg-white/10 disabled:text-muted text-black font-semibold py-3 rounded-lg transition"
                        >
                            {generating ? "Generating..." : "Generate Report"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeckReportsPage;
