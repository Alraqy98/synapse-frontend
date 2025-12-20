// PdfJsPage.jsx - PDF.js fallback renderer for PDF pages
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfJsPage({ pdfUrl, pageNumber, onRenderComplete }) {
    const canvasRef = useRef(null);
    const [isRendering, setIsRendering] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let pdfDocument = null;

        async function render() {
            if (!pdfUrl || !pageNumber) return;

            setIsRendering(true);
            setError(null);

            try {
                // Load PDF document
                const loadingTask = pdfjsLib.getDocument({
                    url: pdfUrl,
                    withCredentials: false,
                });
                pdfDocument = await loadingTask.promise;

                if (cancelled) return;

                // Get the specific page
                const page = await pdfDocument.getPage(pageNumber);

                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext("2d");

                // Calculate viewport with appropriate scale for quality
                const viewport = page.getViewport({ scale: 1.5 });

                // Set canvas dimensions
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render page to canvas
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;

                if (cancelled) return;

                setIsRendering(false);
                if (onRenderComplete) {
                    onRenderComplete();
                }
            } catch (err) {
                if (cancelled) return;
                console.error("PDF.js render error:", err);
                setError(err.message || "Failed to render PDF page");
                setIsRendering(false);
            }
        }

        render();

        return () => {
            cancelled = true;
            // Cleanup: cancel any ongoing rendering
            if (pdfDocument) {
                pdfDocument.destroy().catch(() => {});
            }
        };
    }, [pdfUrl, pageNumber, onRenderComplete]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-muted text-sm opacity-50">
                        Rendering page...
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-400 text-sm">
                        {error}
                    </div>
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="pdf-canvas max-w-full max-h-full object-contain"
                style={{ display: error ? "none" : "block" }}
            />
        </div>
    );
}

