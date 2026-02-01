import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

/**
 * Formats page numbers array into display string
 * - Empty array: returns null (don't show)
 * - Single page: "Page X"
 * - Contiguous range: "Pages X–Y"
 * - Non-contiguous: "Pages X, Y, Z"
 */
function formatPageNumbers(pages) {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return null;
    }

    // Sort and deduplicate
    const sorted = [...new Set(pages)].sort((a, b) => a - b);

    if (sorted.length === 1) {
        return `Page ${sorted[0]}`;
    }

    // Check if contiguous range
    let isContiguous = true;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i - 1] + 1) {
            isContiguous = false;
            break;
        }
    }

    if (isContiguous) {
        return `Pages ${sorted[0]}–${sorted[sorted.length - 1]}`;
    }

    // Non-contiguous: join with commas
    return `Pages ${sorted.join(", ")}`;
}

/**
 * SourceAttribution - Displays source file and page attribution for AI-generated content
 * 
 * @param {Object} props
 * @param {string} props.sourceFileId - File ID for navigation
 * @param {string} props.sourceFileTitle - File title to display
 * @param {number[]} props.sourcePageNumbers - Array of page numbers
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.position] - Tooltip position: "top" | "bottom" | "left" | "right" (default: "bottom")
 */
export default function SourceAttribution({
    sourceFileId,
    sourceFileTitle,
    sourcePageNumbers,
    className = "",
    position = "bottom",
}) {
    const navigate = useNavigate();
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef(null);
    const iconRef = useRef(null);

    const pageText = formatPageNumbers(sourcePageNumbers);

    // Don't render if no page numbers
    if (!pageText) {
        return null;
    }

    // Don't render if no file info
    if (!sourceFileId && !sourceFileTitle) {
        return null;
    }

    const handleFileClick = (e) => {
        e.stopPropagation();
        if (sourceFileId && sourcePageNumbers && sourcePageNumbers.length > 0) {
            const firstPage = sourcePageNumbers[0];
            navigate(`/library/file/${sourceFileId}/page/${firstPage}`);
        }
    };

    // Calculate tooltip position based on icon position
    const updateTooltipPosition = useCallback(() => {
        if (!iconRef.current) return;

        const rect = iconRef.current.getBoundingClientRect();
        const tooltipWidth = 250; // Approximate tooltip width (min-w-[200px] max-w-[300px])
        const spacing = 8; // 8px spacing (mt-2 = 8px)

        let top, left;

        if (position === "top") {
            top = rect.top - spacing;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
        } else if (position === "bottom") {
            top = rect.bottom + spacing;
            left = rect.right - tooltipWidth;
        } else if (position === "left") {
            top = rect.top + rect.height / 2;
            left = rect.left - tooltipWidth - spacing;
        } else { // right
            top = rect.top + rect.height / 2;
            left = rect.right + spacing;
        }

        // Ensure tooltip doesn't go off-screen
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 8) left = 8;
        if (left + tooltipWidth > viewportWidth - 8) {
            left = viewportWidth - tooltipWidth - 8;
        }
        if (top < 8) top = 8;
        if (top > viewportHeight - 8) {
            top = viewportHeight - 8;
        }

        setTooltipPosition({ top, left });
    }, [position]);

    // Update tooltip position when shown or on scroll/resize
    useEffect(() => {
        if (!showTooltip) return;

        // Calculate position immediately
        updateTooltipPosition();

        const handleScroll = () => {
            setShowTooltip(false);
        };

        const handleResize = () => {
            updateTooltipPosition();
        };

        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
        };
    }, [showTooltip, updateTooltipPosition]);

    // Close tooltip on click outside
    useEffect(() => {
        if (!showTooltip) return;

        const handleClickOutside = (event) => {
            if (
                tooltipRef.current &&
                iconRef.current &&
                !tooltipRef.current.contains(event.target) &&
                !iconRef.current.contains(event.target)
            ) {
                setShowTooltip(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showTooltip]);

    return (
        <div className={`relative inline-flex ${className}`}>
            <button
                ref={iconRef}
                type="button"
                className="
                    inline-flex items-center justify-center
                    w-4 h-4 rounded-full
                    text-muted hover:text-teal
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-teal/50
                "
                onMouseEnter={() => {
                    updateTooltipPosition();
                    setShowTooltip(true);
                }}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    updateTooltipPosition();
                    setShowTooltip((v) => !v);
                }}
                aria-label="Source attribution"
            >
                <Info size={14} />
            </button>

            {showTooltip &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        style={{
                            position: "fixed",
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            zIndex: 9999,
                        }}
                        className="
                            min-w-[200px] max-w-[300px]
                            bg-black/90 border border-white/20
                            rounded-lg px-3 py-2
                            text-xs text-white
                            shadow-xl backdrop-blur-sm
                            pointer-events-auto
                        "
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-1">
                            <div className="text-muted text-[10px] uppercase tracking-wide">
                                Generated from:
                            </div>
                            {sourceFileTitle ? (
                                <button
                                    onClick={handleFileClick}
                                    className="
                                        text-teal hover:text-teal/80
                                        underline underline-offset-2
                                        transition-colors
                                        text-left
                                    "
                                >
                                    {sourceFileTitle}
                                </button>
                            ) : sourceFileId ? (
                                <button
                                    onClick={handleFileClick}
                                    className="
                                        text-teal hover:text-teal/80
                                        underline underline-offset-2
                                        transition-colors
                                        text-left
                                    "
                                >
                                    File {sourceFileId}
                                </button>
                            ) : null}
                            <div className="text-white/80">{pageText}</div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
