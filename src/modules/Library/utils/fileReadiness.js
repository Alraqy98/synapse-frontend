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
 * Returns "Ready" ONLY if both status and ocr_status are "completed"
 * Otherwise returns "Processing"
 * 
 * This function is called on every render to ensure it reflects the latest
 * file_render_state from the backend. Do NOT cache or memoize this result.
 * 
 * @param {object} file - File object with file_render_state
 * @returns {string} "Ready" | "Processing"
 */
export const getFileProcessingStatus = (file) => {
    // Folders are always "Ready"
    if (!file || file.is_folder) {
        return "Ready";
    }

    // Use file_render_state as single source of truth (always read from latest file object)
    const renderState = file.file_render_state;
    
    // If file_render_state doesn't exist, default to "Processing" (conservative)
    if (!renderState) {
        return "Processing";
    }

    // Show "Ready" ONLY if both status and ocr_status are "completed"
    // Read directly from file_render_state - never cache or derive from other sources
    const status = renderState.status;
    const ocr_status = renderState.ocr_status;

    if (status === "completed" && ocr_status === "completed") {
        return "Ready";
    }

    // Otherwise show "Processing"
    return "Processing";
};

