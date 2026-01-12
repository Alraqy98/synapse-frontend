import React, { useEffect, useRef } from "react";

export default function NotificationDetailModal({ 
  open, 
  notification, 
  onAcknowledge 
}) {
  const okButtonRef = useRef(null);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onAcknowledge();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onAcknowledge]);

  // Focus OK button on mount
  useEffect(() => {
    if (open && okButtonRef.current) {
      okButtonRef.current.focus();
    }
  }, [open]);

  if (!open || !notification) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center"
      onClick={onAcknowledge}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-black border border-white/10 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-2">
          {notification.title || "Notification"}
        </h3>
        <p className="text-sm text-muted mb-6 whitespace-pre-line">
          {notification.description || notification.body || notification.content || ""}
        </p>

        <div className="flex justify-end">
          <button
            ref={okButtonRef}
            className="btn btn-primary"
            onClick={onAcknowledge}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
