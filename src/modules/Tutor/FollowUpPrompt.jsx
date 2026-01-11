// src/modules/Tutor/FollowUpPrompt.jsx
import React from "react";

const FollowUpPrompt = ({ followUpQuestion, onSendFollowUp }) => {
    if (!followUpQuestion) return null;

    return (
        <div className="mt-4 rounded-lg border border-teal/20 bg-teal/5 p-4">
            <div className="text-xs uppercase tracking-wide text-teal/70 mb-1">
                Continue
            </div>
            <button
                onClick={() => onSendFollowUp(followUpQuestion)}
                className="text-left text-sm text-white hover:underline w-full transition-colors"
            >
                {followUpQuestion}
            </button>
        </div>
    );
};

export default FollowUpPrompt;

