import React, { useState } from "react";

export default function CreateFolderModal({ onSubmit, onClose }) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#8ab4f8"); // default folder color

    const presetColors = [
        "#8ab4f8",
        "#f28b82",
        "#f7c948",
        "#81c995",
        "#ffb7e6",
        "#c58af9",
        "#fdbd7d",
        "#9be9ff",
    ];

    const handleSubmit = () => {
        if (!name.trim()) return;

        onSubmit({
            title: name.trim(),
            color,           // MUST be "color"
            parent_id: null  // backend requires this explicitly
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1a1d24] w-[340px] p-6 rounded-2xl border border-white/10 shadow-xl">

                <h2 className="text-white text-lg font-semibold mb-4">
                    Create Folder
                </h2>

                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full bg-[#0f1115] text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                />

                <div className="mt-4">
                    <p className="text-xs text-muted mb-2">Folder Color</p>

                    <div className="flex flex-wrap gap-2">
                        {presetColors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-7 h-7 rounded-lg border ${color === c ? "border-white" : "border-transparent"
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}

                        <label className="w-7 h-7 rounded-lg border border-white/20 flex items-center justify-center cursor-pointer">
                            <input
                                type="color"
                                className="absolute opacity-0 cursor-pointer"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                            🎨
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded-xl bg-teal text-black font-medium hover:bg-teal/80 transition"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
