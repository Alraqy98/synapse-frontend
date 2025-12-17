// src/modules/Library/LibraryPage.jsx

import React, { useState, useEffect } from "react";

import LibraryFilters from "./LibraryFilters";
import LibraryGrid from "./LibraryGrid";
import LibraryUploadModal from "./LibraryUploadModal";
import FileViewer from "./FileViewer";
import CreateFolderModal from "./CreateFolderModal";

import RenameModal from "./RenameModal";
import MoveToFolderModal from "./MoveToFolderModal";
import ChangeCategoryModal from "./ChangeCategoryModal";

import {
    getLibraryItems,
    deleteItem,
    moveItem,
    getItemById,
    createLibraryFolder,
} from "./apiLibrary";

const LibraryPage = () => {
    const [items, setItems] = useState([]);
    const [activeFilter, setActiveFilter] = useState("All");
    const [view, setView] = useState("grid");
    const [selectedFile, setSelectedFile] = useState(null);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);

    const [renameTarget, setRenameTarget] = useState(null);
    const [moveTarget, setMoveTarget] = useState(null);
    const [categoryTarget, setCategoryTarget] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isOpening, setIsOpening] = useState(false);

    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([
        { label: "All", folderId: null },
    ]);

    // ----------------------------------------------
    // LOAD ITEMS
    // ----------------------------------------------
    const loadItems = async (
        filter = activeFilter,
        folderId = currentFolder?.id || null
    ) => {
        try {
            setIsLoading(true);
            const data = await getLibraryItems(filter, folderId);
            setItems(data);
        } catch (err) {
            console.error("Failed loading library items:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadItems("All", null);
    }, []);

    useEffect(() => {
        loadItems(activeFilter, currentFolder?.id || null);
    }, [activeFilter, currentFolder?.id]);

    // ----------------------------------------------
    // FILTER CHANGE
    // ----------------------------------------------
    const handleFilterChange = (newFilter) => {
        setActiveFilter(newFilter);
        setCurrentFolder(null);
        setBreadcrumbs([{ label: newFilter, folderId: null }]);
    };

    // ----------------------------------------------
    // BREADCRUMB CLICK
    // ----------------------------------------------
    const handleBreadcrumbClick = (idx) => {
        if (idx === breadcrumbs.length - 1) return;

        const crumb = breadcrumbs[idx];

        if (!crumb.folderId) {
            setCurrentFolder(null);
            setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
            loadItems(activeFilter, null);
        } else {
            setCurrentFolder({ id: crumb.folderId, title: crumb.label });
            setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
            loadItems(activeFilter, crumb.folderId);
        }
    };

    // ----------------------------------------------
    // OPEN FILE OR FOLDER
    // ----------------------------------------------
    const handleOpen = async (item) => {
        if (item.is_folder === true) {
            setCurrentFolder(item);
            setBreadcrumbs((prev) => [
                ...prev,
                { label: item.title, folderId: item.id },
            ]);
            return;
        }

        try {
            setIsOpening(true);
            const full = await getItemById(item.id);
            setSelectedFile(full);
            setView("viewer");
        } catch {
            alert("Failed to open file");
        } finally {
            setIsOpening(false);
        }
    };

    const handleBack = () => {
        setSelectedFile(null);
        setView("grid");
    };

    // ----------------------------------------------
    // DELETE
    // ----------------------------------------------
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            await deleteItem(id);
            await loadItems(activeFilter, currentFolder?.id || null);
        } catch {
            alert("Failed to delete");
        }
    };

    // ----------------------------------------------
    // MOVE BETWEEN CATEGORIES
    // ----------------------------------------------
    const handleMove = async (id, newCategory) => {
        try {
            await moveItem(id, newCategory);
            await loadItems(activeFilter, currentFolder?.id || null);
        } catch {
            alert("Failed to move file");
        }
    };

    // ----------------------------------------------
    // MOVE TO FOLDER
    // ----------------------------------------------
    const handleMoveToFolder = (item) => {
        setMoveTarget(item);
    };

    // ----------------------------------------------
    // RENAME
    // ----------------------------------------------
    const handleRename = (item) => {
        setRenameTarget(item);
    };

    // ----------------------------------------------
    // CHANGE CATEGORY
    // ----------------------------------------------
    const handleChangeCategory = (item) => {
        setCategoryTarget(item);
    };

    // ----------------------------------------------
    // CREATE FOLDER — FIXED
    // ----------------------------------------------
    const handleCreateFolder = async ({ title, folder_color, parent_id }) => {
        try {
            await createLibraryFolder(
                title,
                parent_id ?? currentFolder?.id ?? null,
                folder_color
            );

            await loadItems(activeFilter, currentFolder?.id || null);
        } catch (err) {
            console.error(err);
            alert("Failed to create folder");
        }

        setShowFolderModal(false);
    };

    // ----------------------------------------------
    // VIEWER MODE
    // ----------------------------------------------
    if (view === "viewer" && selectedFile) {
        return <FileViewer file={selectedFile} onBack={handleBack} />;
    }

    // ----------------------------------------------
    // GRID MODE
    // ----------------------------------------------
    return (
        <div className="flex flex-1 h-full overflow-hidden relative">
            <LibraryFilters
                activeFilter={activeFilter}
                onSelectFilter={handleFilterChange}
                onUpload={() => setShowUploadModal(true)}
                onCreateFolder={() => setShowFolderModal(true)}
            />

            <div className="flex-1 flex flex-col">
                {/* Breadcrumbs */}
                <div className="h-12 flex items-center px-6 border-b border-white/5 bg-[#0f1115] text-xs">
                    <nav className="flex items-center gap-1 text-muted">
                        {breadcrumbs.map((crumb, idx) => {
                            const isLast = idx === breadcrumbs.length - 1;
                            return (
                                <span key={idx} className="flex items-center">
                                    <button
                                        disabled={isLast}
                                        onClick={() => handleBreadcrumbClick(idx)}
                                        className={
                                            "max-w-[180px] truncate " +
                                            (isLast
                                                ? "text-white font-medium cursor-default"
                                                : "text-muted hover:text-teal")
                                        }
                                    >
                                        {crumb.label}
                                    </button>
                                    {!isLast && (
                                        <span className="mx-1 text-muted/60">/</span>
                                    )}
                                </span>
                            );
                        })}
                    </nav>
                </div>

                <LibraryGrid
                    items={items}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                    onMove={handleMove}
                    onRename={handleRename}
                    onMoveToFolder={handleMoveToFolder}
                    onChangeCategory={handleChangeCategory}
                    isLoading={isLoading || isOpening}
                />
            </div>

            {/* Upload modal */}
            {showUploadModal && (
                <LibraryUploadModal
                    onClose={() => setShowUploadModal(false)}
                    onUploadSuccess={() =>
                        loadItems(activeFilter, currentFolder?.id || null)
                    }
                    parentFolderId={currentFolder?.id || null}
                />
            )}

            {/* Create folder */}
            {showFolderModal && (
                <CreateFolderModal
                    onClose={() => setShowFolderModal(false)}
                    onSubmit={handleCreateFolder}
                />
            )}

            {/* Rename */}
            {renameTarget && (
                <RenameModal
                    item={renameTarget}
                    onClose={() => setRenameTarget(null)}
                    onSuccess={() => {
                        loadItems(activeFilter, currentFolder?.id || null);
                        setRenameTarget(null);
                    }}
                />
            )}

            {/* Move to folder */}
            {moveTarget && (
                <MoveToFolderModal
                    item={moveTarget}
                    onClose={() => setMoveTarget(null)}
                    onSuccess={() => {
                        loadItems(activeFilter, currentFolder?.id || null);
                        setMoveTarget(null);
                    }}
                />
            )}

            {/* Change category */}
            {categoryTarget && (
                <ChangeCategoryModal
                    item={categoryTarget}
                    onClose={() => setCategoryTarget(null)}
                    onSuccess={() => {
                        loadItems(activeFilter, currentFolder?.id || null);
                        setCategoryTarget(null);
                    }}
                />
            )}
        </div>
    );
};

export default LibraryPage;
