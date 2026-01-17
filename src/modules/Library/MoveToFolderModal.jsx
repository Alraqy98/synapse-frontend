// src/modules/Library/MoveToFolderModal.jsx
import React, { useEffect, useState } from "react";
import { X, Folder, ArrowUpLeft } from "lucide-react";
import { getAllFolders, moveToFolder } from "./apiLibrary";

/* ------------------------------------------------------
   Fallback pastel color (used only if color missing)
------------------------------------------------------ */
const fallbackColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 70%)`;
};

/* ------------------------------------------------------
   Parent map
------------------------------------------------------ */
const buildParentMap = (folders) => {
    const map = {};
    folders.forEach((f) => {
        map[f.id] = f.parent_id || null;
    });
    return map;
};

/* ------------------------------------------------------
   Compute folder hierarchy depth
------------------------------------------------------ */
const computeDepths = (folders, parentMap) => {
    const cache = {};

    const getDepth = (id) => {
        if (!parentMap[id]) return 0;
        if (cache[id] !== undefined) return cache[id];

        cache[id] = 1 + getDepth(parentMap[id]);
        return cache[id];
    };

    return folders.map((f) => ({
        ...f,
        _depth: getDepth(f.id),
    }));
};

/* ------------------------------------------------------
   Prevent moving folder into its own descendant
------------------------------------------------------ */
const isDescendantOf = (candidateId, ancestorId, parentMap) => {
    let current = candidateId;
    while (parentMap[current]) {
        const parent = parentMap[current];
        if (parent === ancestorId) return true;
        current = parent;
    }
    return false;
};

const MoveToFolderModal = ({ item, items, onClose, onSuccess }) => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFolder, setSelectedFolder] = useState(null); // null = root

    const isBulk = item?.isBulk === true;
    const itemIds = isBulk ? (item?.ids || []) : [item?.id || item || null].filter(Boolean);
    const itemCount = itemIds.length;

    useEffect(() => {
        const load = async () => {
            try {
                const all = await getAllFolders();

                const parentMap = buildParentMap(all);

                // For bulk, filter out any folders that are descendants of any selected item
                // For single item, filter out descendants of that item
                const filtered = all.filter((f) => {
                    if (isBulk) {
                        // In bulk mode, exclude folders that are descendants of any selected item
                        return !itemIds.some(id => {
                            const selectedItem = items?.find(i => i.id === id);
                            return selectedItem && (f.id === selectedItem.id || isDescendantOf(f.id, selectedItem.id, parentMap));
                        });
                    } else {
                        if (!item?.id) return true;
                        if (f.id === item.id) return false;
                        return !isDescendantOf(f.id, item.id, parentMap);
                    }
                });

                const withDepth = computeDepths(filtered, parentMap);
                setFolders(withDepth);
            } catch (err) {
                console.error("Failed loading folders:", err);
                alert("Failed loading folders");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [item, isBulk, itemIds, items]);

    const handleSubmit = async () => {
        try {
            if (isBulk) {
                // Bulk move handled by parent
                onSuccess?.(selectedFolder ?? null);
            } else {
                if (!item?.id) {
                    alert("Invalid item");
                    return;
                }
                await moveToFolder(item.id, selectedFolder ?? null);
                onSuccess?.();
            }
        } catch (err) {
            console.error("Move failed:", err);
            alert("Failed to move item");
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={onClose}
        >
            <div
                className="w-[420px] bg-[#0d0f13] rounded-2xl border border-white/10 p-6 relative shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button className="absolute right-4 top-4 text-muted hover:text-white" onClick={onClose}>
                    <X size={18} />
                </button>

                <h2 className="text-lg font-semibold text-white mb-4 break-words leading-tight">
                    {isBulk 
                        ? `Move ${itemCount} ${itemCount === 1 ? 'file' : 'files'}`
                        : `Move "${item?.title || item?.id || 'item'}"`
                    }
                </h2>

                {/* Folder list */}
                {loading ? (
                    <div className="text-muted text-sm py-6 text-center">Loading folders…</div>
                ) : folders.length === 0 ? (
                    <div className="text-muted text-sm py-6 text-center">No folders available</div>
                ) : (
                    <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1 custom-scroll">
                        {/* Move to root */}
                        <button
                            className={
                                "w-full flex items-center gap-3 p-2 rounded-lg text-sm text-white hover:bg-white/10 transition " +
                                (selectedFolder === null ? "bg-white/10" : "")
                            }
                            onClick={() => setSelectedFolder(null)}
                        >
                            <ArrowUpLeft size={16} className="text-teal" />
                            <span className="truncate">Move to root</span>
                        </button>

                        {folders.map((f) => {
                            const color = f.color || fallbackColor(f.title);

                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedFolder(f.id)}
                                    className={
                                        "w-full flex items-center gap-3 p-2 rounded-lg text-sm text-white hover:bg-white/10 transition " +
                                        (selectedFolder === f.id ? "bg-white/10" : "")
                                    }
                                >
                                    <Folder size={16} style={{ color }} />

                                    <span
                                        className="truncate"
                                        style={{ marginLeft: `${(f._depth || 0) * 16}px` }}
                                    >
                                        {f.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Submit */}
                <button
                    className="mt-5 w-full py-2 rounded-xl bg-teal/20 text-teal hover:bg-teal hover:text-black transition font-medium"
                    onClick={handleSubmit}
                >
                    {isBulk ? `Move ${itemCount} ${itemCount === 1 ? 'File' : 'Files'}` : 'Move File'}
                </button>
            </div>
        </div>
    );
};

export default MoveToFolderModal;
