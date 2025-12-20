// pdfCache.js - Cache PDF documents to prevent repeated fetches
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Configure PDF.js worker (only once)
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

// Cache of PDF documents by URL
const pdfCache = new Map();

/**
 * Get or create a cached PDF document for the given URL
 * @param {string} pdfUrl - The URL of the PDF file
 * @returns {Promise<Object>} Promise that resolves to the PDF document
 */
export function getPdfDoc(pdfUrl) {
    if (!pdfUrl) {
        return Promise.reject(new Error("PDF URL is required"));
    }

    // Return cached promise if exists
    if (pdfCache.has(pdfUrl)) {
        return pdfCache.get(pdfUrl);
    }

    // Create new loading task
    const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: false,
        disableRange: true,
        disableStream: true,
    });

    // Cache the promise
    const pdfPromise = loadingTask.promise;
    pdfCache.set(pdfUrl, pdfPromise);

    // Handle errors - remove from cache on failure so we can retry
    pdfPromise.catch((err) => {
        pdfCache.delete(pdfUrl);
        throw err;
    });

    return pdfPromise;
}

/**
 * Clear the PDF cache (useful for cleanup or testing)
 */
export function clearPdfCache() {
    // Destroy all cached PDFs
    pdfCache.forEach((pdfPromise) => {
        pdfPromise.then((pdf) => {
            pdf.destroy().catch(() => {});
        });
    });
    pdfCache.clear();
}

/**
 * Remove a specific PDF from cache
 * @param {string} pdfUrl - The URL of the PDF to remove
 */
export function removePdfFromCache(pdfUrl) {
    if (pdfCache.has(pdfUrl)) {
        const pdfPromise = pdfCache.get(pdfUrl);
        pdfPromise.then((pdf) => {
            pdf.destroy().catch(() => {});
        });
        pdfCache.delete(pdfUrl);
    }
}

