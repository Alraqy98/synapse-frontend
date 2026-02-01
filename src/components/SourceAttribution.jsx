import React, { useState, useRef, useEffect } from "react";
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

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

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
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip((v) => !v);
                }}
                aria-label="Source attribution"
            >
                <Info size={14} />
            </button>

            {showTooltip && (
                <div
                    ref={tooltipRef}
                    className={`
                        absolute z-50
                        ${positionClasses[position] || positionClasses.bottom}
                        min-w-[200px] max-w-[300px]
                        bg-black/90 border border-white/20
                        rounded-lg px-3 py-2
                        text-xs text-white
                        shadow-xl backdrop-blur-sm
                        pointer-events-auto
                    `}
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
                </div>
            )}
        </div>
    );
}
