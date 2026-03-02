import React, { useState, useEffect, useRef } from "react";
import "../../styles/GenerationModal.css";

/**
 * Single-input modal matching Synapse design system.
 * Use for "New Folder", "Tag label", etc. Auto-focuses input, submits on Enter.
 */
export default function InlinePromptModal({
  open,
  onClose,
  onSubmit,
  title = "New Folder",
  inputLabel = "Folder name",
  submitLabel = "Create",
  placeholder = "",
  defaultValue = "",
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, defaultValue]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = value?.trim();
    if (trimmed != null && trimmed !== "") {
      onSubmit(trimmed);
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
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
        <h2 className="synapse-gen-modal-title" style={{ marginBottom: 20 }}>{title}</h2>
        <form onSubmit={handleSubmit}>
          <label className="synapse-gen-modal-label">{inputLabel}</label>
          <input
            ref={inputRef}
            type="text"
            className="synapse-gen-modal-input"
            style={{ marginTop: 6 }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
          <div className="synapse-gen-modal-footer">
            <button
              type="button"
              className="synapse-gen-modal-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="synapse-gen-modal-btn-primary"
              disabled={!value?.trim()}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
