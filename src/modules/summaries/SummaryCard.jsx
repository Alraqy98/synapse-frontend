// src/modules/summaries/SummaryCard.jsx
import React from "react";
import UnifiedCard from "../../components/UnifiedCard";
import { apiSummaries } from "./apiSummaries";

export default function SummaryCard({
    summary,
    onClick,
    onDelete,
    onRename,
    onExportCode,
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

    // Check for generating status - support both generating flag and status field
    const isGenerating = summary.generating === true || summary.status === "generating";
    
    // Determine status and progress
    let status = "ready";
    let progress = 100;
    
    if (isGenerating) {
        status = "generating";
        progress = 60; // Simulated progress during generation
    } else if (summary.status === "failed") {
        status = "failed";
        progress = 0;
    }

    return (
        <UnifiedCard
            title={title}
            meta={file_name ? `From: ${file_name}` : null}
            contextNote={contextNote}
            progress={progress}
            status={status}
            statusText="Summary"
            date={created_at ? new Date(created_at).toLocaleDateString() : null}
            isGenerating={isGenerating}
            onClick={onClick}
            onDelete={() => onDelete && onDelete(id)}
            onRename={(newTitle) => onRename && onRename(id, newTitle)}
            onExportCode={(code) => {
                if (onExportCode) {
                    onExportCode(id, code);
                }
            }}
            itemId={id}
            shareItem={apiSummaries.shareSummary}
            overflowActions={[]}
        />
    );
}

