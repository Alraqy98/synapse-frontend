// src/components/Select.jsx
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Synapse Select Component
 * Replaces native <select> with custom dropdown matching Synapse design system
 */
const Select = ({ 
    label, 
    value, 
    onChange, 
    options, 
    className = "",
    disabled = false 
}) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const selected = options.find(o => o.value === value);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [open]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
                return;
            }

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const currentIndex = options.findIndex(o => o.value === value);
                let nextIndex;

                if (e.key === "ArrowDown") {
                    nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                }

                onChange(options[nextIndex].value);
            }

            if (e.key === "Enter" && selected) {
                e.preventDefault();
                setOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, value, options, onChange, selected]);

    return (
        <div className={`w-full space-y-2 ${className}`} ref={containerRef}>
            {label && (
                <label className="text-sm font-medium text-white block">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setOpen(!open)}
                    disabled={disabled}
                    className={`
                        w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 
                        text-white outline-none transition-colors
                        flex justify-between items-center
                        ${disabled 
                            ? "opacity-50 cursor-not-allowed" 
                            : "cursor-pointer hover:border-teal focus:border-teal"
                        }
                    `}
                >
                    <span className={selected ? "text-white" : "text-muted"}>
                        {selected ? selected.label : "Select..."}
                    </span>
                    <ChevronDown 
                        size={16} 
                        className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </button>

                {open && !disabled && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setOpen(false)}
                        />
                        
                        {/* Dropdown Menu */}
                        <div className="absolute left-0 right-0 mt-2 bg-[#1a1d24] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                            <div className="max-h-60 overflow-y-auto">
                                {options.map((opt) => {
                                    const isSelected = opt.value === value;

                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(opt.value);
                                                setOpen(false);
                                            }}
                                            className={`
                                                w-full px-4 py-3 text-left cursor-pointer
                                                transition-colors
                                                hover:bg-white/10
                                                ${isSelected ? "bg-teal/10" : ""}
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isSelected && (
                                                    <Check size={14} className="text-teal flex-shrink-0" />
                                                )}
                                                <span className={`font-medium ${isSelected ? "text-white" : "text-white"}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Select;

