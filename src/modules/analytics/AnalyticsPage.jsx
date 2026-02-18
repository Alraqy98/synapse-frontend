import React, { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";

const AnalyticsPage = () => {
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [reportsError, setReportsError] = useState(null);
    
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            setLoadingReports(true);
            setReportsError(null);
            try {
                const response = await api.get("/api/reports");
                const fetchedReports = response.data.data.reports || [];
                setReports(fetchedReports);
                
                if (fetchedReports.length > 0) {
                    setSelectedReportId(fetchedReports[0].id);
                }
            } catch (err) {
                setReportsError(err.response?.data?.error || err.message || "Failed to fetch reports");
            } finally {
                setLoadingReports(false);
            }
        };
        fetchReports();
    }, []);

    useEffect(() => {
        if (!selectedReportId) {
            setSelectedReport(null);
            return;
        }

        const fetchReport = async () => {
            setLoadingReport(true);
            setReportError(null);
            try {
                const response = await api.get(`/api/reports/${selectedReportId}`);
                setSelectedReport(response.data.data);
            } catch (err) {
                setReportError(err.response?.data?.error || err.message || "Failed to fetch report");
            } finally {
                setLoadingReport(false);
            }
        };
        fetchReport();
    }, [selectedReportId]);

    const handleReportClick = (reportId) => {
        setSelectedReportId(reportId);
    };

    const startFocusSession = (session) => {
        console.log("Launching focus session:", session);
        // TODO: route to MCQ drill mode
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                    Performance Command Center
                </h1>
                <p className="text-lg text-muted">
                    Data-driven insights to accelerate mastery.
                </p>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* LEFT - Reports Timeline */}
                <div className="col-span-3">
                    <ReportsTimeline 
                        reports={reports}
                        loading={loadingReports}
                        error={reportsError}
                        selectedId={selectedReportId}
                        onSelect={handleReportClick}
                        formatDate={formatDate}
                    />
                </div>

                {/* RIGHT - Command Center */}
                <div className="col-span-9 space-y-8">
                    {loadingReport && (
                        <div className="text-center py-12 text-muted">Loading...</div>
                    )}

                    {reportError && (
                        <div className="text-center py-12 text-red-400">{reportError}</div>
                    )}

                    {!loadingReport && !reportError && selectedReport && (
                        <>
                            <PerformanceSnapshot 
                                report={selectedReport}
                                formatDate={formatDate}
                            />
                            <PriorityZone 
                                recommendations={selectedReport.report?.recommendations || []}
                                onStartFocus={startFocusSession}
                            />
                            <StabilityZone 
                                recommendations={selectedReport.report?.recommendations || []}
                            />
                        </>
                    )}

                    {!selectedReportId && !loadingReport && (
                        <div className="text-center py-12 text-muted">
                            Select a report to view insights.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// SUB-COMPONENTS
// ====================================================================

function ReportsTimeline({ reports, loading, error, selectedId, onSelect, formatDate }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>
            
            {loading && <div className="text-sm text-muted">Loading...</div>}
            {error && <div className="text-sm text-red-400">{error}</div>}
            
            {!loading && !error && reports.length === 0 && (
                <div className="text-sm text-muted">No reports yet.</div>
            )}

            {!loading && !error && reports.length > 0 && (
                <div className="space-y-2">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            onClick={() => onSelect(report.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition text-sm ${
                                selectedId === report.id
                                    ? "border-teal bg-teal/10"
                                    : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                        >
                            <div className="text-xs text-muted mb-2">
                                {formatDate(report.createdAt)}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Accuracy:</span>
                                <span className="text-white font-medium">
                                    {report.summary?.overallQuestionAccuracy != null
                                        ? `${Math.round(report.summary.overallQuestionAccuracy)}%`
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PerformanceSnapshot({ report, formatDate }) {
    const summary = report?.report?.summary || {};
    const questionAccuracy = summary.overallQuestionAccuracy;
    const conceptAccuracy = summary.overallConceptAccuracy;

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">
                    Performance Snapshot
                </h2>
                <span className="text-sm text-muted">
                    {formatDate(report.createdAt)}
                </span>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <StatCard 
                    label="Overall Accuracy" 
                    value={questionAccuracy != null ? `${Math.round(questionAccuracy)}%` : "N/A"}
                />
                <StatCard 
                    label="Concept Accuracy" 
                    value={conceptAccuracy != null ? `${Math.round(conceptAccuracy)}%` : "N/A"}
                />
                <StatCard 
                    label="Total Attempts" 
                    value={summary.totalQuestionAttempts || 0}
                />
                <StatCard 
                    label="Concepts Tracked" 
                    value={summary.totalConceptAttempts || 0}
                />
            </div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
                {value}
            </div>
            <div className="text-xs text-muted">
                {label}
            </div>
        </div>
    );
}

function PriorityZone({ recommendations, onStartFocus }) {
    const urgent = useMemo(() => {
        return recommendations
            .filter(r => r.severity === "critical" || r.severity === "weak")
            .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    }, [recommendations]);

    if (!urgent.length) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">
                🔥 Immediate Focus
            </h2>

            {urgent.map((rec) => (
                <PriorityCard key={rec.conceptId || rec.conceptName} rec={rec} onStartFocus={onStartFocus} />
            ))}
        </div>
    );
}

function PriorityCard({ rec, onStartFocus }) {
    const severityStyle = {
        critical: "border-red-500 bg-red-500/10",
        weak: "border-yellow-500 bg-yellow-500/10"
    };

    return (
        <div className={`border-2 rounded-2xl p-6 ${severityStyle[rec.severity] || severityStyle.weak} animate-fade-in-up`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">
                        {rec.conceptName}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                        {rec.currentAccuracy != null ? `${Math.round(rec.currentAccuracy)}%` : "N/A"} 
                        {rec.targetAccuracy != null ? ` → Target ${Math.round(rec.targetAccuracy)}%` : ""}
                    </p>
                </div>

                <span className="uppercase text-xs tracking-wide font-semibold text-muted">
                    {rec.nextActionLabel || "REVIEW"}
                </span>
            </div>

            {/* Low Confidence Warning */}
            {rec.lowConfidenceSignal && (
                <div className="text-sm text-blue-400 mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    You answer correctly but with low confidence. Review for deeper mastery.
                </div>
            )}

            {/* Study Materials */}
            {rec.recommendedStudy && rec.recommendedStudy.length > 0 && (
                <div className="mt-4 space-y-3">
                    <div className="text-sm text-muted font-medium">Study Materials</div>
                    {rec.recommendedStudy.map((material, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-medium text-white">
                                        {material.fileTitle}
                                    </p>
                                    {material.pageRangeText && (
                                        <p className="text-sm text-muted mt-1">
                                            Pages {material.pageRangeText}
                                        </p>
                                    )}
                                </div>

                                {material.openUrl && (
                                    <a
                                        href={material.openUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-teal-400 hover:underline whitespace-nowrap ml-4"
                                    >
                                        Open →
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CTA Button */}
            {rec.focusSession && (
                <button
                    onClick={() => onStartFocus(rec.focusSession)}
                    className="mt-6 w-full bg-teal-500 hover:bg-teal-600 text-black py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                >
                    Practice {rec.recommendedPracticeCount || 10} Questions
                </button>
            )}
        </div>
    );
}

function StabilityZone({ recommendations }) {
    const [open, setOpen] = useState(false);

    const stable = useMemo(() => {
        return recommendations.filter(
            r => r.severity === "borderline" || r.severity === "stable"
        );
    }, [recommendations]);

    if (!stable.length) return null;

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="text-muted text-sm hover:text-white transition flex items-center gap-2"
            >
                <span>{open ? "▼" : "▶"}</span>
                <span>Concepts Under Control ({stable.length})</span>
            </button>

            {open && (
                <div className="mt-4 space-y-3">
                    {stable.map((rec, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                            <span className="text-white font-medium">{rec.conceptName}</span>
                            <span className="text-muted text-sm">
                                {rec.currentAccuracy != null ? `${Math.round(rec.currentAccuracy)}%` : "N/A"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AnalyticsPage;
