// src/modules/summaries/SummaryCard.jsx
import React from "react";
import { Trash2, MoreHorizontal } from "lucide-react";

export default function SummaryCard({
    summary,
    onClick,
    onDelete,
}) {
    const {
        id,
        title,
        academic_stage,
        specialty,
        goal,
        file_name,
        created_at,
    } = summary;

    // Format context note
    const contextParts = [];
    if (academic_stage) contextParts.push(academic_stage);
    if (specialty) contextParts.push(specialty);
    if (goal) contextParts.push(goal);
    const contextNote = contextParts.length > 0 ? contextParts.join(" · ") : null;

    return (
        <div
            className="group cursor-pointer rounded-2xl border border-white/10 bg-black/40 p-6 transition-all hover:-translate-y-1 hover:border-teal/40"
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        {title}
                    </h3>
                    {contextNote && (
                        <p className="text-xs text-muted mb-1">
                            {contextNote}
                        </p>
                    )}
                    {file_name && (
                        <p className="text-xs text-muted">
                            From: {file_name}
                        </p>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-500"
                    title="Delete summary"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted mt-4 pt-4 border-t border-white/5">
                <span>
                    {created_at
                        ? new Date(created_at).toLocaleDateString()
                        : ""}
                </span>
                <span className="px-2 py-1 rounded-full bg-teal/10 border border-teal/30 text-teal text-[10px]">
                    Summary
                </span>
            </div>
        </div>
    );
}

