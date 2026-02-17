/**
 * MCQ Performance Mentor Component
 * 
 * Chess.com-style performance analysis display.
 * Shows deterministic insights derived from attempt data.
 */

function formatSeconds(sec = 0) {
    if (sec < 60) return `${sec}s`;
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return ss > 0 ? `${mm}m ${ss}s` : `${mm}m`;
}

function SeverityBadge({ severity }) {
    const colors = {
        low: "text-teal/90 bg-teal/10 border-teal/30",
        med: "text-yellow-400/90 bg-yellow-400/10 border-yellow-400/30",
        high: "text-red-400/90 bg-red-400/10 border-red-400/30"
    };
    
    const labels = {
        low: "Note",
        med: "Warning",
        high: "Critical"
    };
    
    return (
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${colors[severity] || colors.low}`}>
            {labels[severity] || labels.low}
        </span>
    );
}

/**
 * Longitudinal Performance Component
 * Displays cross-deck intelligence and historical performance data
 */
function LongitudinalPerformance({ overview, analysis }) {
    if (!overview || !overview.totals) return null;

    const { totals, weakest_file, weakest_page, analytics } = overview;
    
    // Calculate global accuracy
    const globalAccuracy = totals.answers > 0 
        ? Math.round((totals.correct / totals.answers) * 100)
        : 0;
    
    // Check if we have 7-day improvement data
    const has7DayData = analytics?.seven_day_improvement_delta != null;
    const improvementDelta = has7DayData ? analytics.seven_day_improvement_delta : null;
    
    // Get contextual message based on cross-deck context
    const contextualMessage = getContextualMessage(analytics, analysis);

    return (
        <div className="border-t border-white/10 pt-5">
            <h4 className="text-sm font-semibold mb-3">Longitudinal Performance</h4>
            
            {/* Global Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="panel p-3 rounded-lg border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                        Total Answers
                    </div>
                    <div className="text-base font-semibold text-white">
                        {totals.answers.toLocaleString()}
                    </div>
                </div>

                <div className="panel p-3 rounded-lg border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                        Global Accuracy
                    </div>
                    <div className="text-base font-semibold text-teal">
                        {globalAccuracy}%
                    </div>
                </div>

                {has7DayData && (
                    <div className="panel p-3 rounded-lg border border-white/10">
                        <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                            7-Day Change
                        </div>
                        <div className={`text-base font-semibold ${
                            improvementDelta > 0 ? 'text-teal' : 
                            improvementDelta < 0 ? 'text-red-400' : 
                            'text-white'
                        }`}>
                            {improvementDelta > 0 ? '+' : ''}{improvementDelta}%
                        </div>
                    </div>
                )}
            </div>

            {/* Weakest Areas */}
            {(weakest_file || weakest_page) && (
                <div className="space-y-2 mb-4">
                    {weakest_file && weakest_file.file_title && (
                        <div className="panel p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                            <div className="text-xs text-muted mb-1">Weakest File</div>
                            <div className="text-sm font-medium text-white truncate">
                                {weakest_file.file_title}
                            </div>
                            <div className="text-xs text-red-400 mt-1">
                                {Math.round(weakest_file.accuracy * 100)}% accuracy
                            </div>
                        </div>
                    )}

                    {weakest_page && weakest_page.file_title && (
                        <div className="panel p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                            <div className="text-xs text-muted mb-1">Weakest Page</div>
                            <div className="text-sm font-medium text-white truncate">
                                {weakest_page.file_title} - Page {weakest_page.page_number}
                            </div>
                            <div className="text-xs text-red-400 mt-1">
                                {Math.round(weakest_page.accuracy * 100)}% accuracy
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Contextual Message */}
            {contextualMessage && (
                <div className={`panel p-3 rounded-lg border ${contextualMessage.color} bg-white/[0.02]`}>
                    <div className="text-xs leading-relaxed text-white">
                        {contextualMessage.text}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Generate contextual message based on cross-deck analytics
 */
function getContextualMessage(analytics, analysis) {
    if (!analytics || !analytics.cross_deck_context) return null;

    const { cross_deck_context } = analytics;
    const currentAccuracy = analysis?.signals?.percent || 0;

    // Check if file historically weak and current deck low score
    if (
        cross_deck_context.file_accuracy_historical != null &&
        cross_deck_context.file_accuracy_historical < 0.6 &&
        currentAccuracy < 60
    ) {
        return {
            text: `This file has historically low accuracy (${Math.round(cross_deck_context.file_accuracy_historical * 100)}%). Current performance (${currentAccuracy}%) suggests continued difficulty. Consider focused review of this material.`,
            color: 'border-red-400/30'
        };
    }

    // Check if current deck shows improvement over file historical accuracy
    if (
        cross_deck_context.file_accuracy_historical != null &&
        currentAccuracy > cross_deck_context.file_accuracy_historical * 100 + 10
    ) {
        return {
            text: `Improvement detected: Current accuracy (${currentAccuracy}%) exceeds historical file average (${Math.round(cross_deck_context.file_accuracy_historical * 100)}%) by ${currentAccuracy - Math.round(cross_deck_context.file_accuracy_historical * 100)}%.`,
            color: 'border-teal/30'
        };
    }

    return null;
}

export default function MCQPerformanceMentor({ analysis, overview }) {
    if (!analysis || !analysis.signals) return null;

    const { summary, signals, insights, suggestions } = analysis;
    
    // Defensive: Check if we have valid overview data
    const hasOverview = overview && overview.totals && typeof overview.totals.answers === 'number';
    const shouldShowLongitudinal = hasOverview && overview.totals.answers >= 20;

    return (
        <div className="panel p-6 rounded-2xl border border-white/10 max-w-4xl mx-auto mb-6">
            {/* Header */}
            <div className="mb-5">
                <h3 className="text-lg font-semibold mb-1">Performance Mentor</h3>
                <p className="text-sm text-muted leading-relaxed">{summary}</p>
            </div>

            {/* Key Signals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="panel p-3 rounded-lg border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                        Avg Correct
                    </div>
                    <div className="text-base font-semibold text-teal">
                        {formatSeconds(signals.avgCorrectTime)}
                    </div>
                </div>

                <div className="panel p-3 rounded-lg border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                        Avg Incorrect
                    </div>
                    <div className="text-base font-semibold text-red-400">
                        {signals.avgIncorrectTime > 0 ? formatSeconds(signals.avgIncorrectTime) : "—"}
                    </div>
                </div>

                <div className="panel p-3 rounded-lg border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                        Rushed Mistakes
                    </div>
                    <div className="text-base font-semibold">
                        {signals.rushedMistakesCount || "0"}
                    </div>
                </div>

                <div className="panel p-3 rounded-lg border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
                        Variability
                    </div>
                    <div className="text-base font-semibold">
                        ±{signals.timeStdDev}s
                    </div>
                </div>
            </div>

            {/* Insights Section */}
            {insights && insights.length > 0 && (
                <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-3">What this suggests</h4>
                    <div className="space-y-2">
                        {insights.map((insight, idx) => (
                            <div 
                                key={idx}
                                className="panel p-3 rounded-lg border border-white/10 bg-white/[0.02]"
                            >
                                <div className="flex items-start justify-between gap-3 mb-1">
                                    <div className="text-sm font-medium">{insight.title}</div>
                                    <SeverityBadge severity={insight.severity} />
                                </div>
                                <div className="text-xs text-muted leading-relaxed">
                                    {insight.detail}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions Section */}
            {suggestions && suggestions.length > 0 && (
                <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-3">Next attempt focus</h4>
                    <ul className="space-y-2">
                        {suggestions.map((suggestion, idx) => (
                            <li 
                                key={idx}
                                className="panel p-3 rounded-lg border border-white/10 bg-white/[0.02]"
                            >
                                <div className="text-sm font-medium mb-1">{suggestion.title}</div>
                                <div className="text-xs text-muted leading-relaxed">
                                    {suggestion.detail}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Longitudinal Performance Section */}
            {shouldShowLongitudinal && (
                <LongitudinalPerformance overview={overview} analysis={analysis} />
            )}

            {/* Empty State */}
            {(!insights || insights.length === 0) && (!suggestions || suggestions.length === 0) && !shouldShowLongitudinal && (
                <div className="text-center py-4">
                    <p className="text-sm text-muted">
                        No specific insights for this attempt. Continue practicing to build data.
                    </p>
                </div>
            )}
        </div>
    );
}
