// src/modules/summaries/SummaryViewerPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import SummaryViewer from "./SummaryViewer";
import { apiSummaries } from "./apiSummaries";

export default function SummaryViewerPage() {
    const { summaryId } = useParams();
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate("/summaries", { replace: true });
    };

    const handleRename = async (id, newTitle) => {
        // Update local state immediately
        // TODO: Backend rename endpoint when available
        // For now, this is UI-only
        console.log(`Rename summary ${id} to ${newTitle}`);
    };

    const handleDelete = async (id) => {
        try {
            await apiSummaries.deleteSummary(id);
            navigate("/summaries", { replace: true });
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <SummaryViewer
            summaryId={summaryId}
            goBack={handleGoBack}
            onRename={handleRename}
            onDelete={handleDelete}
        />
    );
}
