// src/modules/dashboard/DashboardStatsPreview.jsx
import React from "react";
import { BarChart2 } from "lucide-react";

const DashboardStatsPreview = () => {
    const stats = [
        { label: "Questions created", value: "—" },
        { label: "Files uploaded", value: "—" },
        { label: "Study days tracked", value: "—" },
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Stats Preview</h2>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-3xl font-bold text-white mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm text-muted">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-muted">
                        <BarChart2 size={14} />
                        <span>Stats coming soon</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStatsPreview;

