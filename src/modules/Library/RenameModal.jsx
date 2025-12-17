// src/modules/Library/RenameModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { renameItem } from "./apiLibrary"; // NEW helper

const RenameModal = ({ item, onClose, onSuccess }) => {
    const [value, setValue] = useState(item?.title || "");
    const [loading, setLoading] = useState(false);

    if (!item) return null;

    const submit = async () => {
        const name = value.trim();
        if (!name) return alert("Name cannot be empty.");
        if (name === item.title) return onClose(); // no change

        try {
            setLoading(true);
            await renameItem(item.id, name);
            onSuccess?.();
        } catch (err) {
            console.error(err);
            alert("Rename failed");
        } finally {
            setLoading(false);
        }
    };

    // Close via Escape
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") submit();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [value]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={onClose}>
            <div
                className="w-[380px] bg-[#0d0f13] rounded-2xl border border-white/10 p-6 shadow-xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    className="absolute right-4 top-4 text-muted hover:text-white"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>

                <h2 className="text-lg font-semibold text-white mb-4">
                    Rename “{item.title}”
                </h2>

                <input
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl bg-[#1a1d24] border border-white/10 text-white
                               focus:outline-none focus:border-teal transition"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-4 py-2 rounded-xl bg-teal text-black font-medium hover:bg-teal/80 transition"
                        disabled={loading}
                        onClick={submit}
                    >
                        {loading ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RenameModal;
