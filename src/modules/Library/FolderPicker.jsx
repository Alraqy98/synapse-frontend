import React, { useEffect, useState } from "react";
import { getLibraryItems } from "./apiLibrary";

export default function FolderPicker({ onSelect }) {
    const [stack, setStack] = useState([{ id: null, title: "Root" }]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load(stack.at(-1).id);
    }, [stack]);

    async function load(parentId) {
        setLoading(true);
        try {
            const result = await getLibraryItems("All", parentId);
            setItems(result);
        } finally {
            setLoading(false);
        }
    }

    function openFolder(folder) {
        setStack((prev) => [...prev, { id: folder.id, title: folder.title }]);
    }

    function goBack() {
        if (stack.length > 1) {
            setStack((prev) => prev.slice(0, -1));
        }
    }

    function toggleSelect(file) {
        onSelect((prev) => {
            const exists = prev.includes(file.id);
            if (exists) return prev.filter((f) => f !== file.id);
            return [...prev, file.id];
        });
    }

    return (
        <div className="border border-white/10 rounded-xl p-3 bg-white/5 max-h-[300px] overflow-y-auto">

            {/* Breadcrumb */}
            <div className="flex gap-2 text-sm text-teal mb-3 cursor-pointer"
                onClick={goBack}>
                ← {stack.map((s) => s.title).join(" / ")}
            </div>

            {loading && <div className="text-muted">Loading...</div>}

            {!loading && items.length === 0 && (
                <div className="text-muted text-sm">Empty folder</div>
            )}

            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-2 hover:bg-white/10 rounded cursor-pointer"
                >
                    {/* Folder */}
                    {item.is_folder ? (
                        <div
                            className="text-white"
                            onClick={() => openFolder(item)}
                        >
                            📁 {item.title}
                        </div>
                    ) : (
                        <div
                            className="text-white flex-1"
                            onClick={() => toggleSelect(item)}
                        >
                            📄 {item.title}
                        </div>
                    )}

                    {/* File checkmark */}
                    {!item.is_folder && (
                        <input
                            type="checkbox"
                            onChange={() => toggleSelect(item)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
