import React, { useState, useEffect } from "react";
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
                const response = await api.get("/reports");
                setReports(response.data.data.reports);
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
                const response = await api.get(`/reports/${selectedReportId}`);
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
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => handleReportClick(report.id)}
                                    className={`p-4 rounded-lg border cursor-pointer transition ${
                                        selectedReportId === report.id
                                            ? "border-teal bg-teal/10"
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
                                            <span className="text-white">
                                                {report.summary?.overallQuestionAccuracy != null
                                                    ? `${Math.round(report.summary.overallQuestionAccuracy)}%`
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
                            ))}
                        </div>
                    )}
                </div>

                <div className="panel p-6">
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
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="text-xs text-muted mb-1">Total Questions</div>
                                        <div className="text-xl font-bold text-white">
                                            {selectedReport.report?.summary?.totalQuestionAttempts || 0}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="text-xs text-muted mb-1">Question Accuracy</div>
                                        <div className="text-xl font-bold text-white">
                                            {selectedReport.report?.summary?.overallQuestionAccuracy != null
                                                ? `${Math.round(selectedReport.report.summary.overallQuestionAccuracy)}%`
                                                : "N/A"}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="text-xs text-muted mb-1">Total Concepts</div>
                                        <div className="text-xl font-bold text-white">
                                            {selectedReport.report?.summary?.totalConceptAttempts || 0}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="text-xs text-muted mb-1">Concept Accuracy</div>
                                        <div className="text-xl font-bold text-white">
                                            {selectedReport.report?.summary?.overallConceptAccuracy != null
                                                ? `${Math.round(selectedReport.report.summary.overallConceptAccuracy)}%`
                                                : "N/A"}
                                        </div>
                                    </div>
                                </div>
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
                                                {selectedReport.report.facetBreakdown.map((facet, idx) => (
                                                    <tr key={idx} className="border-b border-white/5">
                                                        <td className="py-2 text-white">{facet.facetName}</td>
                                                        <td className="py-2 text-white">{facet.totalAttempts || 0}</td>
                                                        <td className="py-2 text-white">
                                                            {facet.accuracyPercentage != null
                                                                ? `${Math.round(facet.accuracyPercentage)}%`
                                                                : "N/A"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {selectedReport.report?.weakestConcepts && selectedReport.report.weakestConcepts.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Weakest Concepts</h3>
                                    <div className="space-y-2">
                                        {selectedReport.report.weakestConcepts.map((concept, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-center p-2 rounded bg-white/5"
                                            >
                                                <span className="text-white">{concept.name}</span>
                                                <span className="text-muted">
                                                    {concept.accuracy != null
                                                        ? `${Math.round(concept.accuracy)}%`
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedReport.report?.strongestConcepts && selectedReport.report.strongestConcepts.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Strongest Concepts</h3>
                                    <div className="space-y-2">
                                        {selectedReport.report.strongestConcepts.map((concept, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-center p-2 rounded bg-white/5"
                                            >
                                                <span className="text-white">{concept.name}</span>
                                                <span className="text-muted">
                                                    {concept.accuracy != null
                                                        ? `${Math.round(concept.accuracy)}%`
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
