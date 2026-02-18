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
                console.log("RAW API RESPONSE:", response.data);
                console.log("Extracted reports:", response.data?.data?.reports);
                console.log("Response shape check:");
                console.log("  - response.data.success:", response.data?.success);
                console.log("  - response.data.data:", response.data?.data);
                console.log("  - response.data.data.reports:", response.data?.data?.reports);
                console.log("  - Is array?", Array.isArray(response.data?.data?.reports));
                console.log("  - Length:", response.data?.data?.reports?.length);
                
                const fetchedReports = response.data.data.reports || [];
                console.log("fetchedReports after extraction:", fetchedReports);
                console.log("fetchedReports.length:", fetchedReports.length);
                
                setReports(fetchedReports);
                
                if (fetchedReports.length > 0) {
                    console.log("Auto-selecting first report:", fetchedReports[0].id);
                    setSelectedReportId(fetchedReports[0].id);
                } else {
                    console.log("No reports to auto-select");
                }
            } catch (err) {
                console.error("FETCH REPORTS ERROR:", err);
                console.error("Error response:", err.response?.data);
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

    const previousReport = useMemo(() => {
        if (reports.length < 2) return null;

        const currentIndex = reports.findIndex(r => r.id === selectedReportId);
        if (currentIndex === -1 || currentIndex + 1 >= reports.length) return null;

        return reports[currentIndex + 1];
    }, [reports, selectedReportId]);

    const accuracyTrend = useMemo(() => {
        if (!previousReport || !selectedReport?.report?.summary) return null;

        const current = selectedReport.report.summary.overallQuestionAccuracy || 0;
        const previous = previousReport.summary?.overallQuestionAccuracy || 0;

        return current - previous;
    }, [selectedReport, previousReport]);

    const focusRecommendation = useMemo(() => {
        if (!selectedReport?.report?.facetBreakdown?.length) return null;

        const sorted = [...selectedReport.report.facetBreakdown].sort(
            (a, b) => a.accuracyPercentage - b.accuracyPercentage
        );

        return sorted[0];
    }, [selectedReport]);

    const handleReportClick = (reportId) => {
        setSelectedReportId(reportId);
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

    const getAccuracyColor = (percent) => {
        if (percent >= 80) return "text-green-400";
        if (percent >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                    Analytics
                </h1>
                <p className="text-lg text-muted">
                    Track your performance over time.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="panel p-6">
                    <h2 className="text-2xl font-semibold text-white mb-4">Reports</h2>
                    
                    {loadingReports && (
                        <div className="text-muted">Loading...</div>
                    )}

                    {reportsError && (
                        <div className="text-red-400">{reportsError}</div>
                    )}

                    {!loadingReports && !reportsError && reports.length === 0 && (
                        <div className="text-muted">No reports found.</div>
                    )}

                    {!loadingReports && !reportsError && reports.length > 0 && (
                        <div className="space-y-3">
                            {reports.map((report) => {
                                const isEmpty = report.summary?.totalQuestionAttempts === 0;
                                const accuracy = report.summary?.overallQuestionAccuracy;
                                
                                return (
                                    <div
                                        key={report.id}
                                        onClick={() => handleReportClick(report.id)}
                                        className={`p-4 rounded-lg border cursor-pointer transition ${
                                            selectedReportId === report.id
                                                ? "border-teal bg-teal/10"
                                                : isEmpty
                                                ? "border-white/10 bg-white/5 opacity-60 hover:opacity-80"
                                                : "border-white/10 bg-white/5 hover:bg-white/10"
                                        }`}
                                    >
                                        <div className="text-sm text-muted mb-2">
                                            {formatDate(report.createdAt)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-muted">Questions: </span>
                                                <span className="text-white">{report.summary?.totalQuestionAttempts || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted">Accuracy: </span>
                                                <span className={accuracy != null ? getAccuracyColor(accuracy) : "text-white"}>
                                                    {accuracy != null
                                                        ? `${Math.round(accuracy)}%`
                                                        : "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted">Weak: </span>
                                                <span className="text-white">{report.summary?.weakestConceptCount || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted">Strong: </span>
                                                <span className="text-white">{report.summary?.strongestConceptCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="panel p-6 lg:sticky lg:top-6 h-fit">
                    <h2 className="text-2xl font-semibold text-white mb-4">Report Details</h2>

                    {!selectedReportId && (
                        <div className="text-muted">Select a report to view details.</div>
                    )}

                    {selectedReportId && loadingReport && (
                        <div className="text-muted">Loading...</div>
                    )}

                    {selectedReportId && reportError && (
                        <div className="text-red-400">{reportError}</div>
                    )}

                    {selectedReportId && !loadingReport && !reportError && selectedReport && (
                        <div className="space-y-6">
                            {(() => {
                                const summary = selectedReport?.report?.summary || {};
                                const hasData = summary.totalQuestionAttempts > 0;
                                
                                if (!hasData) {
                                    return (
                                        <div className="text-center py-8 text-muted">
                                            No activity recorded for this session.
                                        </div>
                                    );
                                }
                                
                                const questionAccuracy = summary.overallQuestionAccuracy;
                                const conceptAccuracy = summary.overallConceptAccuracy;
                                
                                return (
                                    <>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <MetricCard
                                                    label="Total Questions"
                                                    value={summary.totalQuestionAttempts || 0}
                                                />
                                                <div className="p-3 rounded-lg bg-white/5">
                                                    <div className="text-xs text-muted mb-1">Question Accuracy</div>
                                                    <div className={`text-xl font-bold ${questionAccuracy != null ? getAccuracyColor(questionAccuracy) : "text-white"}`}>
                                                        {questionAccuracy != null ? `${Math.round(questionAccuracy)}%` : "N/A"}
                                                    </div>
                                                    {accuracyTrend !== null && (
                                                        <div
                                                            className={`text-sm mt-1 ${
                                                                accuracyTrend > 0
                                                                    ? "text-green-400"
                                                                    : accuracyTrend < 0
                                                                    ? "text-red-400"
                                                                    : "text-muted"
                                                            }`}
                                                        >
                                                            {accuracyTrend > 0
                                                                ? "↑"
                                                                : accuracyTrend < 0
                                                                ? "↓"
                                                                : "→"}{" "}
                                                            {Math.abs(Math.round(accuracyTrend))}% from last session
                                                        </div>
                                                    )}
                                                </div>
                                                <MetricCard
                                                    label="Total Concepts"
                                                    value={summary.totalConceptAttempts || 0}
                                                />
                                                <MetricCard
                                                    label="Concept Accuracy"
                                                    value={conceptAccuracy != null ? `${Math.round(conceptAccuracy)}%` : "N/A"}
                                                    color={conceptAccuracy != null ? getAccuracyColor(conceptAccuracy) : undefined}
                                                />
                                            </div>

                                            {focusRecommendation && (
                                                <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                                    <div className="text-sm text-red-400 font-semibold mb-1">
                                                        Focus Area
                                                    </div>
                                                    <div className="text-white">
                                                        {focusRecommendation.facetName} —{" "}
                                                        {Math.round(focusRecommendation.accuracyPercentage)}% accuracy
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {selectedReport.report?.facetBreakdown && selectedReport.report.facetBreakdown.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-3">Facet Breakdown</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="border-b border-white/10">
                                                            <tr className="text-left">
                                                                <th className="pb-2 text-muted font-medium">Facet</th>
                                                                <th className="pb-2 text-muted font-medium">Attempts</th>
                                                                <th className="pb-2 text-muted font-medium">Accuracy</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedReport.report.facetBreakdown.map((facet, idx) => {
                                                                const facetAccuracy = facet.accuracyPercentage;
                                                                return (
                                                                    <tr key={idx} className="border-b border-white/5">
                                                                        <td className="py-2 text-white">{facet.facetName}</td>
                                                                        <td className="py-2 text-white">{facet.totalAttempts || 0}</td>
                                                                        <td className={`py-2 ${facetAccuracy != null ? getAccuracyColor(facetAccuracy) : "text-white"}`}>
                                                                            {facetAccuracy != null
                                                                                ? `${Math.round(facetAccuracy)}%`
                                                                                : "N/A"}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {selectedReport.report?.weakestConcepts && selectedReport.report.weakestConcepts.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-3">Weakest Concepts</h3>
                                                <div className="space-y-2">
                                                    {selectedReport.report.weakestConcepts.map((concept, idx) => {
                                                        const conceptAccuracy = concept.accuracy;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between items-center p-2 rounded bg-white/5"
                                                            >
                                                                <span className="text-white">{concept.name}</span>
                                                                <span className={conceptAccuracy != null ? getAccuracyColor(conceptAccuracy) : "text-muted"}>
                                                                    {conceptAccuracy != null
                                                                        ? `${Math.round(conceptAccuracy)}%`
                                                                        : "N/A"}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {selectedReport.report?.strongestConcepts && selectedReport.report.strongestConcepts.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-3">Strongest Concepts</h3>
                                                <div className="space-y-2">
                                                    {selectedReport.report.strongestConcepts.map((concept, idx) => {
                                                        const conceptAccuracy = concept.accuracy;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between items-center p-2 rounded bg-white/5"
                                                            >
                                                                <span className="text-white">{concept.name}</span>
                                                                <span className={conceptAccuracy != null ? getAccuracyColor(conceptAccuracy) : "text-muted"}>
                                                                    {conceptAccuracy != null
                                                                        ? `${Math.round(conceptAccuracy)}%`
                                                                        : "N/A"}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, color }) => (
    <div className="p-3 rounded-lg bg-white/5">
        <div className="text-xs text-muted mb-1">{label}</div>
        <div className={`text-xl font-bold ${color || "text-white"}`}>
            {value}
        </div>
    </div>
);

export default AnalyticsPage;
