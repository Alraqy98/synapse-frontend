import React, { useEffect, useRef } from "react";

export default function DeleteConfirmationModal({ open, onConfirm, onCancel, itemCount = 1 }) {
    const cancelButtonRef = useRef(null);

    // Handle ESC key
    useEffect(() => {
        if (!open) return;

        const handleEsc = (e) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [open, onCancel]);

    // Focus cancel button on mount
    useEffect(() => {
        if (open && cancelButtonRef.current) {
            cancelButtonRef.current.focus();
        }
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-black border border-red-500/20 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-white mb-2">
                    {itemCount === 1 ? 'Delete item?' : `Delete ${itemCount} files?`}
                </h3>
                <p className="text-sm text-muted mb-6">
                    This action cannot be undone.
                </p>

                <div className="flex justify-end gap-2">
                    <button
                        ref={cancelButtonRef}
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

