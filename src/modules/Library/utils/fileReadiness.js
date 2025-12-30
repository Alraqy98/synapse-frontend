// src/modules/Library/utils/fileReadiness.js
import { useState, useEffect, useRef } from "react";
import { getItemById } from "../apiLibrary";

/**
 * Check if a file is ready for generation (ingestion_status === "ready")
 */
export const isFileReady = (file) => {
    if (!file || file.is_folder) return true; // Folders are always "ready"
    return file.ingestion_status === "ready";
};

/**
 * Get rendering progress for a file
 * @param {object} file - File object
 * @returns {object} { ready, rendered, total }
 */
export function getRenderProgress(file) {
    if (!file || file.is_folder) {
        return { ready: true, rendered: 0, total: 0 };
    }

    const total = file.total_pages || 0;
    const rendered = file.rendered_pages || 0;
    const ready = file.ingestion_status === "ready";

    return { ready, rendered, total };
}

/**
 * Hook to poll file metadata until ready
 * @param {string} fileId - File ID to poll
 * @param {boolean} enabled - Whether polling should be active
 * @returns {object} { isReady, file, isLoading }
 */
export const useFileReadiness = (fileId, enabled = true) => {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const pollingRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!fileId || !enabled) {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        const pollFile = async () => {
            try {
                setIsLoading(true);
                const fetchedFile = await getItemById(fileId);
                
                if (!mountedRef.current) return;
                
                setFile(fetchedFile);

                // If file is ready, stop polling
                if (isFileReady(fetchedFile)) {
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                }
            } catch (err) {
                console.error("Failed to poll file:", err);
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        // Initial fetch
        pollFile();

        // Poll every 4 seconds (between 3-5 seconds as requested)
        pollingRef.current = setInterval(pollFile, 4000);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [fileId, enabled]);

    const isReady = isFileReady(file);

    return {
        isReady,
        ready: isReady,
        ingestionStatus: file?.ingestion_status || null,
        renderedPages: file?.rendered_pages || 0,
        totalPages: file?.total_pages || 0,
        file,
        isLoading
    };
};

/**
 * Check multiple files for readiness
 * @param {Array} files - Array of file objects
 * @returns {boolean} - True if all files are ready
 */
export const areFilesReady = (files) => {
    if (!files || files.length === 0) return true;
    return files.every(file => isFileReady(file));
};

/**
 * Get file processing status for display indicator
 * Uses ONLY backend terminal states - no derived logic, counters, or flags
 * 
 * Returns "Ready" ONLY if both status and ocr_status are "completed"
 * Otherwise returns "Processing"
 * 
 * This function is called on every render to ensure it reflects the latest
 * render_state from the backend. Do NOT cache or memoize this result.
 * 
 * @param {object} file - File object with render_state
 * @returns {string} "Ready" | "Processing"
 */
export const getFileProcessingStatus = (file) => {
    // Folders are always "Ready"
    if (!file || file.is_folder) {
        return "Ready";
    }

    // Use render_state as single source of truth (check both possible property names)
    // Backend may return as render_state or file_render_state
    const renderState = file.render_state || file.file_render_state;
    
    // If render_state doesn't exist, log error and default to "Processing" (temporary)
    // Backend MUST ALWAYS include render_state - this is a safety fallback only
    if (!renderState) {
        if (file.id) {
            console.error(
                "[LIBRARY_UI] Missing render_state in API response",
                {
                    fileId: file.id,
                    fileName: file.title,
                    hasRenderState: !!file.render_state,
                    hasFileRenderState: !!file.file_render_state,
                    message: "Backend API must include render_state object for all file items. Showing 'Processing' as temporary fallback."
                }
            );
        }
        return "Processing";
    }

    // Show "Ready" ONLY if both status and ocr_status are "completed"
    // Read directly from render_state - never cache or derive from other sources
    // Do NOT use rendered_pages, ocr_pages_completed, total_pages, or any counters
    const status = renderState.status;
    const ocr_status = renderState.ocr_status;

    // Terminal state check: both must be "completed"
    if (status === "completed" && ocr_status === "completed") {
        return "Ready";
    }

    // Otherwise show "Processing"
    return "Processing";
};

