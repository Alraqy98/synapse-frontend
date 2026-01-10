import React from "react";
import AnnouncementsPanel from "./AnnouncementsPanel";
import FeedbackBox from "./FeedbackBox";

const SettingsPage = ({ profile }) => {

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10">

            {/* SYSTEM LIMITS (BETA) — TOP PRIORITY */}
            {/* TEMP SAFETY RAIL — communicates system limits for early beta users */}
            <div className="panel p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">System Limits (Beta)</h2>
                
                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Max upload size:</span>
                        <span className="text-white font-medium">25MB</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Supported formats:</span>
                        <span className="text-white">PDF, Images, DOC, DOCX, PPT, PPTX, TXT</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Automatic processing:</span>
                        <span className="text-white">Files are automatically rendered and OCR'd after upload</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <span className="text-muted min-w-[140px]">Processing time:</span>
                        <span className="text-white">Large or complex files may take longer to process</span>
                    </div>
                </div>
                
                <p className="text-xs text-muted pt-2 border-t border-white/5">
                    Limits may change as Synapse evolves during beta.
                </p>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: ANNOUNCEMENTS */}
                <div className="lg:col-span-2">
                    <AnnouncementsPanel />
                </div>

                {/* RIGHT: FEEDBACK */}
                <div className="space-y-6">
                    <FeedbackBox user={profile} />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
