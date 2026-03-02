import React from "react";
import "../../styles/GenerationModal.css";

/**
 * Confirmation modal matching Synapse design system.
 * Use for delete confirmations etc. Backdrop click = cancel.
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  variant = "danger", // "danger" (red) | "primary" (green)
}) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="synapse-inline-modal synapse-inline-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="synapse-prompt-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="synapse-gen-modal-title" style={{ marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 13, color: "var(--gen-text-secondary)", margin: 0 }}>
          {message}
        </p>
        <div className="synapse-gen-modal-footer">
          <button
            type="button"
            className="synapse-gen-modal-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={variant === "danger" ? "synapse-gen-modal-btn-danger" : "synapse-gen-modal-btn-primary"}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
