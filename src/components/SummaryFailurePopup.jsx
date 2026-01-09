// src/components/SummaryFailurePopup.jsx
// In-app popup for summary generation failures

import React, { useState } from 'react';
import { X, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
import HelpPopup from './HelpPopup';

const SummaryFailurePopup = ({ 
    isOpen, 
    onClose, 
    onRetry,
    isProcessing = false 
}) => {
    const [showHelp, setShowHelp] = useState(false);

    if (!isOpen) return null;

    // If still processing, show different message
    if (isProcessing) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-teal/20 rounded-lg">
                            <AlertCircle className="text-teal" size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Still preparing your file
                            </h3>
                            <p className="text-sm text-muted">
                                Summaries unlock once text processing finishes.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Failure popup
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                        <AlertCircle className="text-red-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Summary generation couldn't complete
                        </h3>
                        <p className="text-sm text-muted">
                            This usually happens because the file is still processing or the text couldn't be extracted.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Help section */}
                <div className="relative mb-4">
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-2 text-xs text-muted hover:text-teal transition-colors"
                    >
                        <HelpCircle size={16} />
                        <span>Why this happens</span>
                    </button>
                    
                    {showHelp && (
                        <div className="mt-2 p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-xs font-medium text-white mb-2">Why this happens</p>
                            <ul className="text-xs text-muted space-y-1 list-disc list-inside mb-3">
                                <li>OCR is still running</li>
                                <li>File is image-heavy or low quality</li>
                                <li>Processing was interrupted</li>
                            </ul>
                            <p className="text-xs font-medium text-white mb-2">What to do</p>
                            <ul className="text-xs text-muted space-y-1 list-disc list-inside">
                                <li>Wait for the "processing complete" notification</li>
                                <li>Make sure the file opens correctly in File Viewer</li>
                                <li>Retry after a few seconds</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onRetry}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-teal hover:bg-teal-neon text-black font-medium rounded-lg transition-colors"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryFailurePopup;

