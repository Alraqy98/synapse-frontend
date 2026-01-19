// src/modules/Library/AnnotationCanvas.jsx
// Annotation canvas overlay for pages
// Phase 2A: Read-only rendering + local drawing (no backend save)

import React, { useRef, useEffect, useLayoutEffect } from "react";

/**
 * AnnotationCanvas - Canvas overlay for rendering and drawing annotations
 * 
 * @param {Object} props
 * @param {React.RefObject<HTMLElement>} props.pageRef - DOM ref of the page container
 * @param {number} props.zoomLevel - Current zoom level (1.0 = 100%)
 * @param {Array|null} props.strokes - Array of stroke objects or null (from backend + local)
 * @param {boolean} props.isAnnotating - Whether annotation mode is active
 * @param {Function} props.onStrokeComplete - Callback when stroke is completed: (stroke) => void
 * 
 * Stroke format:
 * {
 *   color: string (e.g., "#000000"),
 *   width: number (stroke width in pixels),
 *   points: Array<{x: number, y: number}> (normalized coordinates 0-1)
 * }
 */
const AnnotationCanvas = ({ pageRef, zoomLevel, strokes, isAnnotating = false, onStrokeComplete }) => {
    const canvasRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef(null);
    const primaryPointerIdRef = useRef(null);
    const rafIdRef = useRef(null);
    const pendingStrokesRef = useRef([]); // Strokes completed but not yet in props

    // Render strokes to canvas
    const renderStrokes = () => {
        const canvas = canvasRef.current;
        const pageEl = pageRef?.current;

        if (!canvas || !pageEl) {
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Find the actual image/PDF element (child of pageEl)
        // The pageEl is the div with data-page, we need to find the img or PDF container inside
        const imageEl = pageEl.querySelector('img') || pageEl.querySelector('[data-pdf-page]') || pageEl.querySelector('canvas');
        
        // Fallback to pageEl if no image found (shouldn't happen, but safe)
        const targetEl = imageEl || pageEl;

        // Get dimensions (CSS pixels)
        const targetRect = targetEl.getBoundingClientRect();
        const cssWidth = targetRect.width;
        const cssHeight = targetRect.height;

        // Get device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;

        // Set canvas internal size (accounting for DPR)
        const internalWidth = cssWidth * dpr;
        const internalHeight = cssHeight * dpr;

        // Only resize if dimensions changed
        if (canvas.width !== internalWidth || canvas.height !== internalHeight) {
            canvas.width = internalWidth;
            canvas.height = internalHeight;
        }

        // Set CSS size (display size)
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        // Clear canvas
        ctx.clearRect(0, 0, internalWidth, internalHeight);

        // Set transform to account for device pixel ratio
        // This ensures 1 CSS pixel = 1 logical unit, but we render at DPR resolution
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Render all strokes (from backend + local + pending)
        const allStrokesToRender = [
            ...(strokes && Array.isArray(strokes) ? strokes : []),
            ...pendingStrokesRef.current,
        ];

        if (allStrokesToRender.length > 0) {
            allStrokesToRender.forEach((stroke) => {
                if (!stroke.points || !Array.isArray(stroke.points) || stroke.points.length === 0) {
                    return;
                }

                // Set stroke style
                ctx.strokeStyle = stroke.color || "#000000";
                ctx.lineWidth = stroke.width || 2;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                // Begin path
                ctx.beginPath();

                // Convert normalized coordinates (0-1) to canvas coordinates
                const firstPoint = stroke.points[0];
                const canvasX = firstPoint.x * cssWidth;
                const canvasY = firstPoint.y * cssHeight;
                ctx.moveTo(canvasX, canvasY);

                // Draw line to each subsequent point
                for (let i = 1; i < stroke.points.length; i++) {
                    const point = stroke.points[i];
                    const x = point.x * cssWidth;
                    const y = point.y * cssHeight;
                    ctx.lineTo(x, y);
                }

                // Stroke the path
                ctx.stroke();

                // Draw endpoint caps (visual bridge for crossing strokes)
                const lineWidth = stroke.width || 2;
                const capRadius = lineWidth / 2;
                ctx.fillStyle = stroke.color || "#000000";
                
                // Start cap
                ctx.beginPath();
                ctx.arc(firstPoint.x * cssWidth, firstPoint.y * cssHeight, capRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // End cap
                if (stroke.points.length > 1) {
                    const lastPoint = stroke.points[stroke.points.length - 1];
                    ctx.beginPath();
                    ctx.arc(lastPoint.x * cssWidth, lastPoint.y * cssHeight, capRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        // Render in-progress stroke (if drawing)
        const currentStroke = currentStrokeRef.current;
        if (currentStroke && currentStroke.points && currentStroke.points.length > 0) {
            ctx.strokeStyle = currentStroke.color || "#000000";
            ctx.lineWidth = currentStroke.width || 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.beginPath();
            const firstPoint = currentStroke.points[0];
            const canvasX = firstPoint.x * cssWidth;
            const canvasY = firstPoint.y * cssHeight;
            ctx.moveTo(canvasX, canvasY);

            for (let i = 1; i < currentStroke.points.length; i++) {
                const point = currentStroke.points[i];
                const x = point.x * cssWidth;
                const y = point.y * cssHeight;
                ctx.lineTo(x, y);
            }

            ctx.stroke();

            // Draw endpoint caps for in-progress stroke
            const lineWidth = currentStroke.width || 2;
            const capRadius = lineWidth / 2;
            ctx.fillStyle = currentStroke.color || "#000000";
            
            // Start cap
            ctx.beginPath();
            ctx.arc(firstPoint.x * cssWidth, firstPoint.y * cssHeight, capRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // End cap (if more than one point)
            if (currentStroke.points.length > 1) {
                const lastPoint = currentStroke.points[currentStroke.points.length - 1];
                ctx.beginPath();
                ctx.arc(lastPoint.x * cssWidth, lastPoint.y * cssHeight, capRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    // Re-render when strokes change (immediate)
    useEffect(() => {
        // Remove strokes from pending that are now in props
        if (strokes && Array.isArray(strokes)) {
            pendingStrokesRef.current = pendingStrokesRef.current.filter(
                (pending) => !strokes.some((s) => s === pending)
            );
        }
        renderStrokes();
    }, [strokes, pageRef]);

    // Throttled render for zoom changes
    useEffect(() => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = requestAnimationFrame(() => {
            renderStrokes();
            rafIdRef.current = null;
        });
    }, [zoomLevel]);

    // Observe page size changes and re-render
    useLayoutEffect(() => {
        const pageEl = pageRef?.current;
        if (!pageEl) return;

        // Find the image element to observe
        const imageEl = pageEl.querySelector('img') || pageEl.querySelector('[data-pdf-page]') || pageEl.querySelector('canvas');
        const targetEl = imageEl || pageEl;

        // Initial render
        renderStrokes();

        // Observe resize (handles window resize, page size changes)
        const resizeObserver = new ResizeObserver(() => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
            rafIdRef.current = requestAnimationFrame(() => {
                renderStrokes();
                rafIdRef.current = null;
            });
        });

        resizeObserver.observe(targetEl);
        resizeObserverRef.current = resizeObserver;

        return () => {
            resizeObserver.disconnect();
        };
    }, [pageRef]);

    // Convert screen coordinates to normalized page coordinates (0-1)
    const screenToNormalized = (clientX, clientY) => {
        const pageEl = pageRef?.current;
        if (!pageEl) return { x: 0, y: 0 };

        const imageEl = pageEl.querySelector('img') || pageEl.querySelector('[data-pdf-page]') || pageEl.querySelector('canvas');
        const targetEl = imageEl || pageEl;
        const rect = targetEl.getBoundingClientRect();

        // Calculate position relative to image
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;

        // Clamp to 0-1 range
        return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y)),
        };
    };

    // Handle pointer down - start new stroke
    const handlePointerDown = (e) => {
        if (!isAnnotating) return;

        // For touch: only handle primary pointer (first finger)
        // Allow secondary pointers (second finger) to pass through for scroll
        if (e.pointerType === "touch") {
            if (primaryPointerIdRef.current === null) {
                // This is the primary pointer
                primaryPointerIdRef.current = e.pointerId;
            } else if (e.pointerId !== primaryPointerIdRef.current) {
                // This is a secondary pointer - allow scroll
                return;
            }
        }

        e.preventDefault();
        e.stopPropagation();

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.setPointerCapture(e.pointerId);
        isDrawingRef.current = true;

        const normalized = screenToNormalized(e.clientX, e.clientY);
        
        // Start new stroke
        currentStrokeRef.current = {
            color: "#000000", // Default pen color
            width: 2, // Default pen width
            points: [normalized],
        };

        renderStrokes();
    };

    // Handle pointer move - add points to current stroke
    const handlePointerMove = (e) => {
        if (!isAnnotating || !isDrawingRef.current) return;

        // For touch: only handle primary pointer
        if (e.pointerType === "touch" && e.pointerId !== primaryPointerIdRef.current) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const normalized = screenToNormalized(e.clientX, e.clientY);
        
        if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
            // Point filtering: ignore points too close to previous point
            const MIN_DISTANCE = 0.002; // Normalized coordinate threshold
            const lastPoint = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
            const dx = normalized.x - lastPoint.x;
            const dy = normalized.y - lastPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only add point if it's far enough from the last point
            if (distance >= MIN_DISTANCE) {
                currentStrokeRef.current.points.push(normalized);
                renderStrokes();
            }
        }
    };

    // Handle pointer up - finalize stroke
    const handlePointerUp = (e) => {
        if (!isAnnotating || !isDrawingRef.current) return;

        // For touch: only handle primary pointer
        if (e.pointerType === "touch" && e.pointerId !== primaryPointerIdRef.current) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.releasePointerCapture(e.pointerId);
        }

        const stroke = currentStrokeRef.current;
        if (stroke && stroke.points.length > 0) {
            // Add to pending strokes immediately (prevent flicker)
            pendingStrokesRef.current.push(stroke);
            
            // Call callback to update parent cache
            if (onStrokeComplete) {
                onStrokeComplete(stroke);
            }
        }

        // Reset drawing state
        isDrawingRef.current = false;
        currentStrokeRef.current = null;
        
        // Clear primary pointer if this was it
        if (e.pointerType === "touch" && e.pointerId === primaryPointerIdRef.current) {
            primaryPointerIdRef.current = null;
        }

        // Redraw with pending stroke included
        renderStrokes();
    };

    // Handle pointer cancel - cancel stroke
    const handlePointerCancel = (e) => {
        if (!isAnnotating || !isDrawingRef.current) return;

        // For touch: only handle primary pointer
        if (e.pointerType === "touch" && e.pointerId !== primaryPointerIdRef.current) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.releasePointerCapture(e.pointerId);
        }

        // Cancel stroke (don't call onStrokeComplete)
        isDrawingRef.current = false;
        currentStrokeRef.current = null;
        
        // Clear primary pointer if this was it
        if (e.pointerType === "touch" && e.pointerId === primaryPointerIdRef.current) {
            primaryPointerIdRef.current = null;
        }
        
        renderStrokes();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: isAnnotating ? "auto" : "none",
                touchAction: isAnnotating ? "none" : "auto",
            }}
            aria-hidden="true"
        />
    );
};

export default AnnotationCanvas;

