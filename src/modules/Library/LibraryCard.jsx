// src/modules/Library/LibraryCard.jsx
import React from "react";
import UnifiedCard from "../../components/UnifiedCard";
import { FolderOpen, ArrowLeftRight, Edit2 } from "lucide-react";
import { getFileProcessingStatus } from "./utils/fileReadiness";

const LibraryCard = ({
    item,
    onOpen,
    onDelete,
    onMoveToFolder,
    onChangeCategory,
    onRename,
}) => {
    const isFolder =
        item.is_folder === true ||
        item.type === "folder" ||
        item.kind === "folder";

    // Determine status and progress for files
    let status = "ready";
    let progress = 100;
    let isProcessing = false;

    if (!isFolder) {
        const processingStatus = getFileProcessingStatus(item);
        isProcessing = processingStatus === "Processing";
        
        if (isProcessing) {
            status = "generating";
            // Calculate progress based on render_state
            const renderState = item.render_state || item.file_render_state;
            if (renderState) {
                const total = item.total_pages || 0;
                const rendered = item.rendered_pages || 0;
                if (total > 0) {
                    progress = Math.min(90, Math.round((rendered / total) * 100));
                } else {
                    progress = 30; // Default progress for files without page count
                }
            } else {
                progress = 30; // Default progress when render_state is missing
            }
        } else {
            status = "ready";
            progress = 100;
        }
    } else {
        // Folders are always ready
        status = "ready";
        progress = 100;
    }

    // Build overflow actions (Library uses its own modals, so we use custom actions)
    const overflowActions = [
        ...(onRename ? [{
            label: "Rename",
            icon: Edit2,
            onClick: () => onRename?.(item),
        }] : []),
        ...(onMoveToFolder ? [{
            label: isFolder ? "Move folder" : "Move to folder",
            icon: FolderOpen,
            onClick: () => onMoveToFolder?.(item),
        }] : []),
        ...(!isFolder && onChangeCategory ? [{
            label: "Change category",
            icon: ArrowLeftRight,
            onClick: () => onChangeCategory?.(item),
        }] : []),
    ];

    return (
        <UnifiedCard
                title={item.title}
            meta={isFolder ? null : (item.uiCategory || "File")}
            progress={progress}
            status={status}
            statusText={isFolder ? "Folder" : (item.uiCategory || "File")}
            date={item.updated_at ? new Date(item.updated_at).toLocaleDateString() : null}
            isGenerating={isProcessing}
            onClick={() => onOpen?.(item)}
            onDelete={() => onDelete?.(item.id)}
            overflowActions={overflowActions}
        />
    );
};

export default LibraryCard;
