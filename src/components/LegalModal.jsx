// src/components/LegalModal.jsx
import React, { useEffect } from "react";
import { X } from "lucide-react";
import TermsContent from "./legal/TermsContent";
import PrivacyContent from "./legal/PrivacyContent";

const LegalModal = ({ open, type, onClose }) => {
    // Don't render if not open
    if (!open || !type) return null;

    // ESC key handler
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    const title = type === "terms" ? "Terms & Conditions" : "Privacy Policy";
    const content = type === "terms" ? <TermsContent /> : <PrivacyContent />;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
        >
            <div
                className="w-full max-w-3xl max-h-[90vh] bg-[#0d0f13] rounded-2xl border border-white/10 shadow-xl relative mx-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with X close button */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
                    <h2
                        id="legal-modal-title"
                        className="text-xl font-semibold text-white"
                    >
                        {title}
                    </h2>
                    <button
                        className="text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable content area */}
                <div className="overflow-y-auto flex-1 px-6 py-6">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default LegalModal;

