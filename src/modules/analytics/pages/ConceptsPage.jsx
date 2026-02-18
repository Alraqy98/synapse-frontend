import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ConceptsPage = () => {
    const navigate = useNavigate();

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
                    Concept Analytics
                </h1>
                <p className="text-muted">
                    Track performance across all concepts.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p className="text-muted">
                    Concept analytics coming soon.
                </p>
            </div>
        </div>
    );
};

export default ConceptsPage;
