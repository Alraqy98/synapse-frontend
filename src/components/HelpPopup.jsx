// src/components/HelpPopup.jsx
// Reusable help popup/tooltip component

import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpPopup = ({ 
    title, 
    content, 
    footer, 
    storageKey,
    placement = 'bottom',
    triggerIcon = true,
    autoShow = true,
    children 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSeen, setHasSeen] = useState(false);
    const popupRef = useRef(null);
    const triggerRef = useRef(null);

    // Check if user has seen this help before
    useEffect(() => {
        if (storageKey) {
            const seen = localStorage.getItem(storageKey);
            if (seen === 'true') {
                setHasSeen(true);
            } else if (autoShow && !seen) {
                // Auto-show once on first visit
                setTimeout(() => {
                    setIsOpen(true);
                }, 1000); // Small delay to not be intrusive
            }
        }
    }, [storageKey, autoShow]);

    // Mark as seen when opened
    useEffect(() => {
        if (isOpen && storageKey && !hasSeen) {
            localStorage.setItem(storageKey, 'true');
            setHasSeen(true);
        }
    }, [isOpen, storageKey, hasSeen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const placementClasses = {
        bottom: 'top-full left-0 mt-2',
        top: 'bottom-full left-0 mb-2',
        right: 'left-full top-0 ml-2',
        left: 'right-full top-0 mr-2',
    };

    return (
        <div className="relative inline-block">
            {triggerIcon ? (
                <button
                    ref={triggerRef}
                    onClick={handleToggle}
                    className="text-muted hover:text-teal transition-colors focus:outline-none focus:ring-2 focus:ring-teal/50 rounded"
                    aria-label="Help"
                >
                    <HelpCircle size={18} />
                </button>
            ) : (
                <div ref={triggerRef}>
                    {children}
                </div>
            )}

            {isOpen && (
                <div
                    ref={popupRef}
                    className={`absolute z-50 w-80 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl p-4 ${placementClasses[placement]}`}
                >
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-white">{title}</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-muted hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="text-sm text-muted space-y-2">
                        {typeof content === 'string' ? (
                            <p>{content}</p>
                        ) : (
                            <ul className="space-y-1.5 list-disc list-inside">
                                {content.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {footer && (
                        <p className="text-xs text-muted/70 mt-3 pt-3 border-t border-white/5">
                            {footer}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default HelpPopup;

