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

export default function MCQPerformanceMentor({ analysis }) {
    if (!analysis || !analysis.signals) return null;

    const { summary, signals, insights, suggestions } = analysis;

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
                <div>
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

            {/* Empty State */}
            {(!insights || insights.length === 0) && (!suggestions || suggestions.length === 0) && (
                <div className="text-center py-4">
                    <p className="text-sm text-muted">
                        No specific insights for this attempt. Continue practicing to build data.
                    </p>
                </div>
            )}
        </div>
    );
}
