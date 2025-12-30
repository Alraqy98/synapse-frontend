// src/modules/Library/LibraryPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

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
    const { fileId, pageNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [items, setItems] = useState([]);
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoadingFile, setIsLoadingFile] = useState(false);

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

    // Poll file list to refresh render_state after upload
    useEffect(() => {
        // Only poll if there are files that might be processing
        const hasProcessingFiles = items.some(item => {
            if (item.is_folder) return false;
            const renderState = item.render_state || item.file_render_state;
            if (!renderState) return true; // No render_state means might be processing
            const isReady = renderState.status === "completed" && renderState.ocr_status === "completed";
            return !isReady;
        });

        if (!hasProcessingFiles) return;

        // Poll every 4 seconds to refresh render_state
        const pollInterval = setInterval(() => {
            loadItems(activeFilter, currentFolder?.id || null);
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [items, activeFilter, currentFolder?.id]);

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
    // LOAD FILE FROM URL PARAMS
    // ----------------------------------------------
    useEffect(() => {
        if (fileId) {
            const loadFile = async () => {
                try {
                    setIsLoadingFile(true);
                    const full = await getItemById(fileId);
                    setSelectedFile(full);
                } catch (err) {
                    console.error("Failed to load file:", err);
                    navigate("/library");
                } finally {
                    setIsLoadingFile(false);
                }
            };
            loadFile();
        } else {
            setSelectedFile(null);
        }
    }, [fileId, navigate]);

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

        // Navigate to file URL
        navigate(`/library/${item.id}`);
    };

    const handleBack = () => {
        navigate("/library");
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
    // VIEWER MODE (when fileId is in URL)
    // ----------------------------------------------
    if (fileId && selectedFile) {
        return (
            <FileViewer 
                file={selectedFile} 
                onBack={handleBack}
                initialPage={pageNumber ? Number(pageNumber) : 1}
            />
        );
    }
    
    // Show loading state while file is being loaded
    if (fileId && isLoadingFile) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-muted">Loading file...</div>
            </div>
        );
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
