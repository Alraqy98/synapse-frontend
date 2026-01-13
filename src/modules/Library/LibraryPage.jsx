// src/modules/Library/LibraryPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import LibraryFilters from "./LibraryFilters";
import LibraryGrid from "./LibraryGrid";
import LibraryUploadModal from "./LibraryUploadModal";
import FileViewer from "./FileViewer";
import CreateFolderModal from "./CreateFolderModal";

import RenameModal from "./RenameModal";
import MoveToFolderModal from "./MoveToFolderModal";
import ChangeCategoryModal from "./ChangeCategoryModal";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

import {
    getLibraryItems,
    deleteItem,
    moveItem,
    getItemById,
    createLibraryFolder,
} from "./apiLibrary";

const LibraryPage = () => {
    const { fileId, pageNumber, folderId, subFolderId } = useParams();
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
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isOpening, setIsOpening] = useState(false);

    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([
        { label: "All", folderId: null },
    ]);
    
    // Sorting state - persists across folder navigation
    const [sortMode, setSortMode] = useState("date_newest");

    // Ref to track polling state without causing re-renders
    const pollingIntervalRef = useRef(null);
    const itemsRef = useRef([]);

    // Helper to check if files are processing (uses terminal states only)
    const hasProcessingFiles = (files) => {
        return files.some(file => {
            if (file.is_folder) return false;
            const renderState = file.render_state || file.file_render_state;
            if (!renderState) return true; // No render_state means might be processing
            // Terminal state check: both must be "completed"
            const isReady = renderState.status === "completed" && 
                          renderState.ocr_status === "completed";
            return !isReady;
        });
    };

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
            itemsRef.current = data; // Update ref without causing re-render
        } catch (err) {
            console.error("Failed loading library items:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ----------------------------------------------
    // SYNC URL PARAMS WITH FOLDER STATE
    // ----------------------------------------------
    // When URL changes (folderId/subFolderId), update folder state and load items
    useEffect(() => {
        // Skip if we're viewing a file (fileId takes precedence)
        if (fileId) return;
        
        // Determine active folder from URL params (subFolderId takes precedence)
        const activeFolderId = subFolderId || folderId || null;
        
        if (activeFolderId) {
            // Load folder info and update state
            const loadFolder = async () => {
                try {
                    const folderData = await getItemById(activeFolderId);
                    if (folderData.is_folder) {
                        setCurrentFolder(folderData);
                        // Build breadcrumbs from URL path
                        const newBreadcrumbs = [{ label: activeFilter, folderId: null }];
                        
                        // If we have a parent folder (folderId exists and subFolderId is the active one)
                        if (subFolderId && folderId) {
                            const parentFolder = await getItemById(folderId);
                            newBreadcrumbs.push({ label: parentFolder.title, folderId: folderId });
                            newBreadcrumbs.push({ label: folderData.title, folderId: subFolderId });
                        } else if (folderId) {
                            // Single-level folder
                            newBreadcrumbs.push({ label: folderData.title, folderId: folderId });
                        }
                        
                        setBreadcrumbs(newBreadcrumbs);
                        loadItems(activeFilter, activeFolderId);
                    } else {
                        // Not a folder, redirect to root
                        navigate("/library");
                    }
                } catch (err) {
                    console.error("Failed to load folder:", err);
                    navigate("/library");
                }
            };
            loadFolder();
        } else {
            // URL is root - reset to root state
            if (currentFolder) {
                setCurrentFolder(null);
                setBreadcrumbs([{ label: activeFilter, folderId: null }]);
                loadItems(activeFilter, null);
            } else if (items.length === 0) {
                // Initial load at root
                loadItems(activeFilter, null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderId, subFolderId, activeFilter, fileId]);

    // Listen for demo exit to force library reload
    useEffect(() => {
        const handleDemoExit = () => {
            // Reset to root folder and reload items
            setCurrentFolder(null);
            setBreadcrumbs([{ label: "All", folderId: null }]);
            setActiveFilter("All");
            loadItems("All", null);
        };

        window.addEventListener("demo-exit-library-reload", handleDemoExit);
        return () => {
            window.removeEventListener("demo-exit-library-reload", handleDemoExit);
        };
    }, []);

    // Conditional polling ONLY when files are processing
    // Do NOT depend on items array - use ref instead to avoid infinite loops
    useEffect(() => {
        // Clear any existing polling when filter/folder changes
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Check if polling is needed before starting
        const currentItems = itemsRef.current;
        if (!hasProcessingFiles(currentItems)) {
            return; // All files are ready, no polling needed
        }

        // Start polling - checks itemsRef inside interval to avoid dependency on items
        pollingIntervalRef.current = setInterval(() => {
            // Check current items using ref (doesn't trigger re-renders)
            const itemsToCheck = itemsRef.current;
            
            if (!hasProcessingFiles(itemsToCheck)) {
                // All files are ready, stop polling
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                return;
            }

            // Files are still processing, fetch latest state
            loadItems(activeFilter, currentFolder?.id || null);
        }, 4000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [activeFilter, currentFolder?.id]); // Only depend on filter/folder, NOT items

    // ----------------------------------------------
    // FILTER CHANGE
    // ----------------------------------------------
    const handleFilterChange = (newFilter) => {
        setActiveFilter(newFilter);
        setCurrentFolder(null);
        setBreadcrumbs([{ label: newFilter, folderId: null }]);
        // Navigate to root when filter changes
        navigate("/library");
    };

    // ----------------------------------------------
    // BREADCRUMB CLICK - Navigate to folder route
    // ----------------------------------------------
    const handleBreadcrumbClick = (idx) => {
        if (idx === breadcrumbs.length - 1) return;

        const crumb = breadcrumbs[idx];

        if (!crumb.folderId) {
            // Navigate to root
            navigate("/library");
        } else {
            // Navigate to folder route
            // Check if this is a nested folder (has parent in breadcrumbs)
            const parentIdx = idx - 1;
            if (parentIdx >= 0 && breadcrumbs[parentIdx].folderId) {
                // Nested folder: /library/folder/:folderId/sub/:subFolderId
                navigate(`/library/folder/${breadcrumbs[parentIdx].folderId}/sub/${crumb.folderId}`);
            } else {
                // Top-level folder: /library/folder/:folderId
                navigate(`/library/folder/${crumb.folderId}`);
            }
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
    // OPEN FILE OR FOLDER - Update URL route
    // ----------------------------------------------
    const handleOpen = async (item) => {
        if (item.is_folder === true) {
            // Navigate to folder route
            if (currentFolder?.id) {
                // Nested folder: current folder is parent
                navigate(`/library/folder/${currentFolder.id}/sub/${item.id}`);
            } else {
                // Top-level folder
                navigate(`/library/folder/${item.id}`);
            }
            return;
        }

        // Navigate to file URL (unchanged)
        navigate(`/library/${item.id}`);
    };

    const handleBack = () => {
        // Navigate back to current folder or root
        if (currentFolder?.id) {
            if (subFolderId) {
                // Go back to parent folder
                navigate(`/library/folder/${folderId}`);
            } else {
                // Go back to root
                navigate("/library");
            }
        } else {
            navigate("/library");
        }
    };
    
    // ----------------------------------------------
    // SORTING LOGIC
    // ----------------------------------------------
    const sortItems = (itemsToSort) => {
        if (!itemsToSort || itemsToSort.length === 0) return itemsToSort;
        
        const sorted = [...itemsToSort];
        
        switch (sortMode) {
            case "name_asc":
                return sorted.sort((a, b) => {
                    const nameA = (a.title || "").toLowerCase();
                    const nameB = (b.title || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            case "name_desc":
                return sorted.sort((a, b) => {
                    const nameA = (a.title || "").toLowerCase();
                    const nameB = (b.title || "").toLowerCase();
                    return nameB.localeCompare(nameA);
                });
            case "date_newest":
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA;
                });
            case "date_oldest":
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateA - dateB;
                });
            case "type":
                // Folders first, then files, both sorted by name
                return sorted.sort((a, b) => {
                    if (a.is_folder && !b.is_folder) return -1;
                    if (!a.is_folder && b.is_folder) return 1;
                    const nameA = (a.title || "").toLowerCase();
                    const nameB = (b.title || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            default:
                return sorted;
        }
    };
    
    // Apply sorting to items
    const sortedItems = sortItems(items);

    // ----------------------------------------------
    // DELETE
    // ----------------------------------------------
    const handleDelete = (id) => {
        setDeleteTarget(id);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteItem(deleteTarget);
            await loadItems(activeFilter, currentFolder?.id || null);
            setDeleteTarget(null);
        } catch {
            alert("Failed to delete");
            setDeleteTarget(null);
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

                {/* Sorting Control */}
                <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-[#0f1115]">
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted">Sort:</label>
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-[#1a1d24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal transition"
                        >
                            <option value="date_newest">Date added (Newest first)</option>
                            <option value="date_oldest">Date added (Oldest first)</option>
                            <option value="name_asc">Name (A → Z)</option>
                            <option value="name_desc">Name (Z → A)</option>
                            <option value="type">Type (Folders first)</option>
                        </select>
                    </div>
                </div>

                <LibraryGrid
                    items={sortedItems}
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

            {/* Delete confirmation */}
            <DeleteConfirmationModal
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default LibraryPage;
