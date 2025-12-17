import React from "react";

export default function PopupDialog({
    open,
    title = "",
    message = "",
    confirmText = "OK",
    cancelText = "Cancel",
    onConfirm = () => { },
    onCancel = () => { },
    close = () => { }          // ← parent will pass this
}) {
    if (!open) return null;

    // Automatically close, THEN run callback
    const handleConfirm = () => {
        close();
        setTimeout(() => onConfirm(), 10);
    };

    const handleCancel = () => {
        close();
        setTimeout(() => onCancel(), 10);
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleCancel} // click outside closes
        >
            <div
                className="bg-void border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl animate-fadeIn"
                onClick={(e) => e.stopPropagation()} // prevent outer click
            >
                {title && (
                    <h2 className="text-xl font-semibold mb-3">
                        {title}
                    </h2>
                )}

                <p className="text-muted text-sm whitespace-pre-line mb-6">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    {cancelText && (
                        <button
                            onClick={handleCancel}
                            className="
                                px-4 py-2 rounded-xl 
                                bg-white/5 border border-white/10 
                                hover:border-red-400 transition
                            "
                        >
                            {cancelText}
                        </button>
                    )}

                    <button
                        onClick={handleConfirm}
                        className="
                            px-6 py-2 rounded-xl 
                            bg-teal text-black font-semibold
                            hover:bg-teal/90
                        "
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
