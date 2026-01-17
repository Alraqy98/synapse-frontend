// src/modules/Library/LibraryGrid.jsx
import React from "react";
import LibraryCard from "./LibraryCard";

const LibraryGrid = ({
    items,
    onOpen,
    onDelete,
    onMove,              // (legacy category move)
    onMoveToFolder,      // NEW
    onChangeCategory,    // NEW
    onRename,            // NEW
    onToggleDone,        // NEW
    isLoading,
    selectionMode,
    selectedIds,
    onToggleSelect,
}) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted">
                <div className="text-center text-sm">Loading library…</div>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted">
                <div className="text-center">
                    <p className="text-lg mb-2">No files found</p>
                    <p className="text-sm">Upload a file to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {items.map((item) => (
                    <LibraryCard
                        key={item.id}
                        item={item}
                        onOpen={onOpen}
                        onDelete={onDelete}
                        onMove={onMove}
                        onMoveToFolder={onMoveToFolder}
                        onChangeCategory={onChangeCategory}
                        onRename={onRename}
                        onToggleDone={onToggleDone}
                        selectionMode={selectionMode}
                        isSelected={selectedIds?.has(item.id) ?? false}
                        selectedIds={selectedIds}
                        onToggleSelect={onToggleSelect}
                    />
                ))}
            </div>
        </div>
    );
};

export default LibraryGrid;
