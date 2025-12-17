// src/modules/Library/ChangeCategoryModal.jsx
import React, { useState } from "react";
import { uiToApiCategory } from "./apiLibrary";

const options = ["Lecture", "Notes", "Exams", "Book"];

const ChangeCategoryModal = ({ item, onClose, onSuccess }) => {
    const [selected, setSelected] = useState(item.uiCategory || "");
    const [loading, setLoading] = useState(false);

    const handleChange = async () => {
        if (!selected) return;
        try {
            setLoading(true);

            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/library/item/${item.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                    body: JSON.stringify({
                        category: uiToApiCategory(selected),
                    }),
                }
            );

            if (!res.ok) throw new Error("Failed");

            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-[#0f1115] border border-white/10 rounded-2xl p-6 w-[360px]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-white text-lg font-semibold mb-4">
                    Change category
                </h2>

                <div className="mb-4">
                    <label className="text-muted text-xs">Choose category</label>
                    <select
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#1a1d24] border border-white/10 text-white focus:outline-none focus:border-teal"
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                    >
                        <option value="">Select…</option>
                        {options.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-4 py-2 rounded-lg bg-teal text-black font-medium hover:bg-teal/80"
                        disabled={loading || !selected}
                        onClick={handleChange}
                    >
                        {loading ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangeCategoryModal;
