import React, { useState } from "react";
import AnnouncementsPanel from "./AnnouncementsPanel";
import FeedbackBox from "./FeedbackBox";
import AstraPreferencesPanel from "./AstraPreferencesPanel";
import api from "../../lib/api";

const SettingsPage = ({ profile }) => {
    const [backfillProgress, setBackfillProgress] = useState(null);
    const showDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

    const handleBackfillConceptMentions = async () => {
        setBackfillProgress({ processed: 0, remaining: "?" });
        let totalProcessed = 0;
        try {
            for (;;) {
                const { data } = await api.post("/api/ai/mcq/backfill-concept-mentions", { limit: 50 });
                const processed = data?.processed ?? 50;
                const remaining = data?.questionsWithoutMentions ?? 0;
                totalProcessed += processed;
                setBackfillProgress({ processed: totalProcessed, remaining });
                if (remaining === 0) break;
            }
            setBackfillProgress({ processed: totalProcessed, remaining: 0, done: true });
        } catch (err) {
            console.error("Backfill failed:", err);
            setBackfillProgress((p) => ({ ...p, error: err.message }));
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10">

            {/* SYSTEM LIMITS (BETA) — TOP PRIORITY */}
            {/* TEMP SAFETY RAIL — communicates system limits for early beta users */}
            <div className="panel p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">System Limits (Beta)</h2>
                
                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Max upload size:</span>
                        <span className="text-white font-medium">25MB</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Supported formats:</span>
                        <span className="text-white">PDF, Images, DOC, DOCX, PPT, PPTX, TXT</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Automatic processing:</span>
                        <span className="text-white">Files are automatically rendered and OCR'd after upload</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Processing time:</span>
                        <span className="text-white">Large or complex files may take longer to process</span>
                    </div>
                </div>
                
                <p className="text-xs text-muted pt-2 border-t border-white/5">
                    Limits may change as Synapse evolves during beta.
                </p>
            </div>

            {/* Debug: Backfill Concept Mentions */}
            {showDebug && (
                <div className="panel p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">Debug</h2>
                    <button
                        onClick={handleBackfillConceptMentions}
                        disabled={backfillProgress && !backfillProgress.done && !backfillProgress.error}
                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Backfill Concept Mentions
                    </button>
                    {backfillProgress && (
                        <p className="text-sm text-white/70">
                            {backfillProgress.error
                                ? `Error: ${backfillProgress.error}`
                                : backfillProgress.done
                                ? `Done. Processed ${backfillProgress.processed} questions.`
                                : typeof backfillProgress.remaining === "number"
                                ? `Processing... ${backfillProgress.processed}/${backfillProgress.processed + backfillProgress.remaining}`
                                : `Processing... ${backfillProgress.processed}`}
                        </p>
                    )}
                </div>
            )}

            {/* ASTRA PREFERENCES */}
            <AstraPreferencesPanel />

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: ANNOUNCEMENTS */}
                <div className="lg:col-span-2">
                    <AnnouncementsPanel />
                </div>

                {/* RIGHT: FEEDBACK */}
                <div className="space-y-6">
                    <FeedbackBox user={profile} />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
