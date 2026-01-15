// PdfJsPage.jsx - PDF.js fallback renderer for PDF pages
import { useEffect, useRef, useState } from "react";
import { getPdfDoc } from "./pdfCache";

export default function PdfJsPage({ pdfUrl, pageNumber, onRenderComplete }) {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [isRendering, setIsRendering] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function render() {
            if (!pdfUrl || !pageNumber) {
                setIsRendering(false);
                return;
            }

            setIsRendering(true);
            setError(null);

            try {
                // Use cached PDF document
                const pdfDocument = await getPdfDoc(pdfUrl);

                if (cancelled) return;

                // Get the specific page
                const page = await pdfDocument.getPage(pageNumber);

                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) {
                    cancelled = true;
                    return;
                }

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

                // Store render task so we can cancel it
                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;

                await renderTask.promise;

                if (cancelled) return;

                setIsRendering(false);
                renderTaskRef.current = null;
                
                if (onRenderComplete) {
                    onRenderComplete();
                }
            } catch (err) {
                if (cancelled) return;
                console.error("PDF.js render error:", err);
                setError(err.message || "Failed to render PDF page");
                setIsRendering(false);
                renderTaskRef.current = null;
            }
        }

        render();

        return () => {
            cancelled = true;
            // Cancel any ongoing render task
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }
        };
    }, [pdfUrl, pageNumber, onRenderComplete]);

    return (
        <div className="relative w-full max-w-full h-full flex items-center justify-center">
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

