import React from "react";

/**
 * Simple SVG line chart for accuracy trends
 * No external dependencies - pure SVG
 */
const AccuracyTrendChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-muted text-sm">
                No trend data available yet
            </div>
        );
    }

    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get last 10 sessions
    const sessions = data.slice(-10);

    // Find min/max for scaling
    const accuracies = sessions.map((s) => s.accuracy);
    const maxAccuracy = Math.max(...accuracies, 100);
    const minAccuracy = Math.max(0, Math.min(...accuracies) - 10);

    // Scale functions
    const xScale = (index) => {
        return padding.left + (index / (sessions.length - 1)) * chartWidth;
    };

    const yScale = (accuracy) => {
        const normalized = (accuracy - minAccuracy) / (maxAccuracy - minAccuracy);
        return padding.top + chartHeight - normalized * chartHeight;
    };

    // Generate line path
    const linePath = sessions
        .map((session, index) => {
            const x = xScale(index);
            const y = yScale(session.accuracy);
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(" ");

    // Generate area path (for fill)
    const areaPath =
        linePath +
        ` L ${xScale(sessions.length - 1)} ${padding.top + chartHeight}` +
        ` L ${xScale(0)} ${padding.top + chartHeight} Z`;

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ maxWidth: "600px" }}
            >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((tick) => {
                    const y = yScale(tick);
                    return (
                        <g key={tick}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                            />
                            <text
                                x={padding.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill="rgba(245,245,247,0.6)"
                                fontSize="12"
                            >
                                {tick}%
                            </text>
                        </g>
                    );
                })}

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill="rgba(0,245,204,0.1)"
                    stroke="none"
                />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="rgb(0,245,204)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {sessions.map((session, index) => {
                    const x = xScale(index);
                    const y = yScale(session.accuracy);
                    return (
                        <g key={index}>
                            <circle
                                cx={x}
                                cy={y}
                                r="4"
                                fill="rgb(0,245,204)"
                                stroke="rgba(0,0,0,0.5)"
                                strokeWidth="2"
                            />
                            {/* Hover tooltip */}
                            <title>
                                {formatDate(session.date)}: {Math.round(session.accuracy)}%
                            </title>
                        </g>
                    );
                })}

                {/* X-axis labels */}
                {sessions.map((session, index) => {
                    // Only show every other label to avoid crowding
                    if (sessions.length > 5 && index % 2 !== 0) return null;

                    const x = xScale(index);
                    return (
                        <text
                            key={index}
                            x={x}
                            y={height - padding.bottom + 20}
                            textAnchor="middle"
                            fill="rgba(245,245,247,0.6)"
                            fontSize="11"
                        >
                            {formatDate(session.date)}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

export default AccuracyTrendChart;
