import React, { useState } from "react";
import AnnouncementsPanel from "./AnnouncementsPanel";
import FeedbackBox from "./FeedbackBox";
import AstraPreferencesPanel from "./AstraPreferencesPanel";
import api from "../../lib/api";

const TABS = [
    { id: "General", label: "General" },
    { id: "Preferences", label: "Preferences" },
    { id: "Announcements", label: "Announcements" },
    { id: "Subscription", label: "Subscription" },
    { id: "Feedback", label: "Feedback" },
];

const SettingsPage = ({ profile }) => {
    const [activeTab, setActiveTab] = useState("General");
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
        <div className="max-w-7xl mx-auto min-h-full bg-[#0D0F12] font-sans text-base text-gray-300 antialiased">
            <div className="flex gap-8 p-6">
                {/* Sidebar */}
                <aside className="w-48 flex-shrink-0 sticky top-6 self-start">
                    <nav
                        className="rounded-lg border border-white/10 bg-white/[0.02] backdrop-blur-sm p-2 space-y-1"
                        aria-label="Settings sections"
                    >
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium border-l-2 transition-colors duration-200 ${
                                        isActive
                                            ? "bg-teal-500/15 text-teal-400 border-teal-500"
                                            : "border-transparent text-gray-400 hover:text-white hover:bg-white/[0.06]"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                    <div
                        key={activeTab}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-8 md:p-10 min-h-[min(70vh,720px)] transition-opacity duration-200 ease-out"
                    >
                        {activeTab === "General" && (
                            <div className="space-y-8">
                                {/* System limits */}
                                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
                                    <div className="text-xs uppercase tracking-wider text-teal-400 mb-3">Limits</div>
                                    <h2 className="text-2xl font-semibold text-white mb-6">System Limits (Beta)</h2>
                                    <div className="space-y-3 text-base leading-relaxed">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                            <span className="text-gray-400 min-w-[140px] shrink-0">Max upload size</span>
                                            <span className="text-gray-300">25MB</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                            <span className="text-gray-400 min-w-[140px] shrink-0">Supported formats</span>
                                            <span className="text-gray-300">PDF, Images, DOC, DOCX, PPT, PPTX, TXT</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                            <span className="text-gray-400 min-w-[140px] shrink-0">Automatic processing</span>
                                            <span className="text-gray-300">Files are automatically rendered and OCR&apos;d after upload</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                            <span className="text-gray-400 min-w-[140px] shrink-0">Processing time</span>
                                            <span className="text-gray-300">Large or complex files may take longer to process</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 italic pt-6 mt-6 border-t border-white/5">
                                        Limits may change as Synapse evolves during beta.
                                    </p>
                                </div>

                                {/* Debug */}
                                {showDebug && (
                                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
                                        <div className="text-xs uppercase tracking-wider text-teal-400 mb-3">Dev</div>
                                        <h2 className="text-2xl font-semibold text-white mb-6">Debug</h2>
                                        <button
                                            type="button"
                                            onClick={handleBackfillConceptMentions}
                                            disabled={backfillProgress && !backfillProgress.done && !backfillProgress.error}
                                            className="px-4 py-2.5 rounded-md text-sm font-medium bg-white/[0.03] border border-white/10 text-gray-300 hover:bg-white/[0.06] hover:border-teal-500/40 hover:text-teal-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-gray-300"
                                        >
                                            Backfill Concept Mentions
                                        </button>
                                        {backfillProgress && (
                                            <p className="text-base text-gray-300 mt-4">
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
                            </div>
                        )}

                        {activeTab === "Preferences" && <AstraPreferencesPanel />}

                        {activeTab === "Announcements" && <AnnouncementsPanel />}

                        {activeTab === "Subscription" && (
                            <div className="text-base text-gray-300 leading-relaxed">Subscription management coming soon</div>
                        )}

                        {activeTab === "Feedback" && <FeedbackBox user={profile} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
