// src/modules/Library/LibraryPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import LibraryFilters from "./LibraryFilters";
import LibraryGrid from "./LibraryGrid";
import LibraryUploadModal from "./LibraryUploadModal";
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
    updateFileStatus,
    bulkDeleteItems,
    bulkMoveItems,
} from "./apiLibrary";
import {
    generateSlug,
    registerFolder,
    getFolderBySlug,
    getSlugById,
    buildFolderPath,
} from "./utils/folderSlugs";

const LibraryPage = () => {
    const { folderSlug, parentSlug, childSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [items, setItems] = useState([]);
    const [activeFilter, setActiveFilter] = useState("All");

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
        { label: "All", folderId: null, slug: null },
    ]);
    
    // Sorting state - persists across folder navigation
    const [sortMode, setSortMode] = useState("date_newest");

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);

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
            
            // Register all folders in slug cache
            data.forEach(item => {
                if (item.is_folder) {
                    registerFolder(item.id, item.title, item.parent_id);
                }
            });
        } catch (err) {
            console.error("Failed loading library items:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ----------------------------------------------
    // SYNC URL PARAMS WITH FOLDER STATE (Slug-based)
    // ----------------------------------------------
    // When URL changes (slugs), resolve to folder IDs and update state
    useEffect(() => {
        // Determine active folder from URL slugs (childSlug takes precedence for nested folders)
        const activeSlug = childSlug || folderSlug || null;
        
        if (activeSlug) {
            // Resolve slug to folder ID
            const loadFolder = async () => {
                try {
                    // First, try to get folder from slug cache
                    let folderData = getFolderBySlug(activeSlug);
                    let activeFolderId = folderData?.id;
                    
                    // If not in cache, we need to search for it
                    // This happens on first load or refresh
                    if (!activeFolderId) {
                        // Load all items to find the folder
                        const allItems = await getLibraryItems(activeFilter, null);
                        
                        // Register all folders in cache
                        allItems
                            .filter(item => item.is_folder)
                            .forEach(folder => {
                                registerFolder(folder.id, folder.title, folder.parent_id);
                            });
                        
                        // Try again after registration
                        folderData = getFolderBySlug(activeSlug);
                        activeFolderId = folderData?.id;
                    }
                    
                    // If still not found, try loading from parent context
                    if (!activeFolderId && parentSlug) {
                        const parentData = getFolderBySlug(parentSlug);
                        if (parentData) {
                            const parentItems = await getLibraryItems(activeFilter, parentData.id);
                            const foundFolder = parentItems.find(
                                item => item.is_folder && generateSlug(item.title) === activeSlug
                            );
                            if (foundFolder) {
                                registerFolder(foundFolder.id, foundFolder.title, foundFolder.parent_id);
                                activeFolderId = foundFolder.id;
                            }
                        }
                    }
                    
                    if (activeFolderId) {
                        // Load full folder data
                        const fullFolderData = await getItemById(activeFolderId);
                        if (fullFolderData.is_folder) {
                            // Register in cache if not already
                            registerFolder(fullFolderData.id, fullFolderData.title, fullFolderData.parent_id);
                            
                            setCurrentFolder(fullFolderData);
                            
                            // Build breadcrumbs from folder hierarchy
                            const newBreadcrumbs = [{ label: activeFilter, folderId: null, slug: null }];
                            
                            // If nested (parentSlug and childSlug both exist)
                            if (parentSlug && childSlug) {
                                const parentData = getFolderBySlug(parentSlug);
                                if (parentData) {
                                    newBreadcrumbs.push({
                                        label: parentData.name,
                                        folderId: parentData.id,
                                        slug: parentSlug,
                                    });
                                }
                                newBreadcrumbs.push({
                                    label: fullFolderData.title,
                                    folderId: fullFolderData.id,
                                    slug: childSlug,
                                });
                            } else if (folderSlug) {
                                // Single-level folder
                                newBreadcrumbs.push({
                                    label: fullFolderData.title,
                                    folderId: fullFolderData.id,
                                    slug: folderSlug,
                                });
                            }
                            
                            setBreadcrumbs(newBreadcrumbs);
                            loadItems(activeFilter, activeFolderId);
                        } else {
                            // Not a folder, redirect to root
                            navigate("/library");
                        }
                    } else {
                        // Slug not found, redirect to root
                        console.warn(`Folder slug "${activeSlug}" not found`);
                        navigate("/library");
                    }
                } catch (err) {
                    console.error("Failed to load folder:", err);
                    navigate("/library");
                }
            };
            loadFolder();
        } else {
            // URL is root (/library) - reset to root state
            if (currentFolder) {
                setCurrentFolder(null);
                setBreadcrumbs([{ label: activeFilter, folderId: null, slug: null }]);
                loadItems(activeFilter, null);
            } else if (items.length === 0) {
                // Initial load at root - register all folders in cache
                loadItems(activeFilter, null).then(() => {
                    // After loading, register folders in slug cache
                    items.forEach(item => {
                        if (item.is_folder) {
                            registerFolder(item.id, item.title, item.parent_id);
                        }
                    });
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderSlug, parentSlug, childSlug, activeFilter]);

    // Listen for demo exit to force library reload
    useEffect(() => {
        const handleDemoExit = () => {
            // Reset to root folder and reload items
            setCurrentFolder(null);
            setBreadcrumbs([{ label: "All", folderId: null, slug: null }]);
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
        setBreadcrumbs([{ label: newFilter, folderId: null, slug: null }]);
        // Navigate to root when filter changes
        navigate("/library");
    };

    // ----------------------------------------------
    // BREADCRUMB CLICK - Navigate to folder route (Slug-based)
    // ----------------------------------------------
    const handleBreadcrumbClick = (idx) => {
        if (idx === breadcrumbs.length - 1) return;

        const crumb = breadcrumbs[idx];

        if (!crumb.folderId) {
            // Navigate to root
            navigate("/library");
        } else {
            // Build path from breadcrumbs up to clicked crumb
            const pathSegments = [];
            for (let i = 1; i <= idx; i++) {
                const segment = breadcrumbs[i];
                if (segment.slug) {
                    pathSegments.push(segment.slug);
                } else if (segment.folderId) {
                    // Fallback: generate slug if not cached
                    const slug = getSlugById(segment.folderId) || generateSlug(segment.label);
                    pathSegments.push(slug);
                }
            }
            
            if (pathSegments.length > 0) {
                navigate(`/library/${pathSegments.join("/")}`);
            } else {
                navigate("/library");
            }
        }
    };


    // ----------------------------------------------
    // OPEN FILE OR FOLDER - Update URL route (Slug-based)
    // ----------------------------------------------
    const handleOpen = async (item) => {
        if (item.is_folder === true) {
            // Register folder in slug cache
            registerFolder(item.id, item.title, item.parent_id);
            
            // Build folder path using slugs
            const folderSlug = getSlugById(item.id) || generateSlug(item.title);
            if (!getSlugById(item.id)) {
                registerFolder(item.id, item.title, item.parent_id);
            }
            
            if (currentFolder?.id) {
                // Nested folder: current folder is parent
                const parentSlug = getSlugById(currentFolder.id) || generateSlug(currentFolder.title);
                navigate(`/library/${parentSlug}/${folderSlug}`);
            } else {
                // Top-level folder
                navigate(`/library/${folderSlug}`);
            }
            return;
        }

        // For files: store current folder path in navigation state
        // This allows FileViewer's back button to return to the exact folder
        // where the file was opened, preserving folder context across navigation
        const currentPath = location.pathname;
        navigate(`/library/file/${item.id}`, {
            state: {
                fromFolderPath: currentPath, // e.g., "/library/emergency" or "/library"
            },
        });
    };

    const handleBack = () => {
        // Restore folder path from navigation state (if file was opened from a folder)
        const fromFolderPath = location.state?.fromFolderPath;
        
        if (fromFolderPath) {
            // Return to the folder where file was opened
            navigate(fromFolderPath);
        } else {
            // Fallback: navigate back to current folder or root
            if (currentFolder?.id) {
                const folderSlug = getSlugById(currentFolder.id) || generateSlug(currentFolder.title);
                navigate(`/library/${folderSlug}`);
            } else {
                navigate("/library");
            }
        }
    };
    
    // ----------------------------------------------
    // TOGGLE FILE DONE STATUS
    // ----------------------------------------------
    const handleToggleDone = async (fileId, isDone) => {
        // Optimistic update
        setItems((prev) =>
            prev.map((item) =>
                item.id === fileId ? { ...item, is_done: isDone } : item
            )
        );

        try {
            await updateFileStatus(fileId, isDone);
        } catch (err) {
            // Rollback on failure
            setItems((prev) =>
                prev.map((item) =>
                    item.id === fileId ? { ...item, is_done: !isDone } : item
                )
            );
            console.error("Failed to update file status", err);
        }
    };
    
    // ----------------------------------------------
    // SORTING LOGIC
    // ----------------------------------------------
    // Natural numeric comparison for names (handles numbers correctly: 2 before 10)
    const compareNames = (a, b) => {
        const nameA = (a.title || "").toLowerCase();
        const nameB = (b.title || "").toLowerCase();
        return nameA.localeCompare(nameB, undefined, {
            numeric: true,
            sensitivity: 'base',
        });
    };
    
    const sortItems = (itemsToSort) => {
        if (!itemsToSort || itemsToSort.length === 0) return itemsToSort;
        
        const sorted = [...itemsToSort];
        
        switch (sortMode) {
            case "name_asc":
                return sorted.sort((a, b) => compareNames(a, b));
            case "name_desc":
                return sorted.sort((a, b) => compareNames(b, a));
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
                // Folders first, then files, both sorted by name (natural numeric)
                return sorted.sort((a, b) => {
                    if (a.is_folder !== b.is_folder) {
                        return a.is_folder ? -1 : 1;
                    }
                    return compareNames(a, b);
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
        
        const isBulk = typeof deleteTarget === 'object' && deleteTarget?.isBulk === true;
        const ids = isBulk ? (deleteTarget?.ids || []) : [deleteTarget].filter(Boolean);
        
        try {
            if (isBulk) {
                const result = await bulkDeleteItems(ids);
                const successCount = result.success_ids?.length || 0;
                const failCount = result.failed_ids?.length || 0;
                
                // Optimistically remove successful deletes
                setItems(prev => prev.filter(item => !result.success_ids?.includes(item.id)));
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    result.success_ids?.forEach(id => next.delete(id));
                    return next;
                });
                
                // Show feedback
                if (failCount > 0) {
                    const failedItems = items.filter(item => result.failed_ids?.includes(item.id));
                    const failedNames = failedItems.map(i => i.title).join(', ');
                    alert(`${successCount} deleted, ${failCount} failed: ${failedNames}`);
                    // Keep failed items selected
                } else {
                    // Clear selection if all succeeded
                    if (successCount === ids.length) {
                        setSelectedIds(new Set());
                        setSelectionMode(false);
                    }
                }
                
                // Reload to ensure consistency
                await loadItems(activeFilter, currentFolder?.id || null);
            } else {
                await deleteItem(deleteTarget);
                await loadItems(activeFilter, currentFolder?.id || null);
            }
            setDeleteTarget(null);
        } catch (err) {
            console.error("Delete failed:", err);
            alert(isBulk ? "Failed to delete some items" : "Failed to delete");
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
        setMoveTarget(typeof item === 'string' ? { id: item } : item);
    };

    const handleBulkMoveSuccess = async (folderId) => {
        if (!moveTarget || !moveTarget?.isBulk) return;
        
        const ids = moveTarget?.ids || [];
        try {
            const result = await bulkMoveItems(ids, folderId);
            const successCount = result.success_ids?.length || 0;
            const failCount = result.failed_ids?.length || 0;
            
            // Optimistically update parent_id for successful moves
            setItems(prev => prev.map(item => {
                if (result.success_ids?.includes(item.id)) {
                    return { ...item, parent_id: folderId };
                }
                return item;
            }));
            
            // Remove successful items from selection
            setSelectedIds(prev => {
                const next = new Set(prev);
                result.success_ids?.forEach(id => next.delete(id));
                return next;
            });
            
            // Show feedback
            if (failCount > 0) {
                const failedItems = items.filter(item => result.failed_ids?.includes(item.id));
                const failedNames = failedItems.map(i => i.title).join(', ');
                alert(`${successCount} moved, ${failCount} failed: ${failedNames}`);
            } else {
                // Clear selection if all succeeded
                if (successCount === ids.length) {
                    setSelectedIds(new Set());
                    setSelectionMode(false);
                }
            }
            
            // Reload to ensure consistency
            await loadItems(activeFilter, currentFolder?.id || null);
            setMoveTarget(null);
        } catch (err) {
            console.error("Bulk move failed:", err);
            alert("Failed to move some items");
            setMoveTarget(null);
        }
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
    // BULK SELECTION HANDLERS
    // ----------------------------------------------
    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleClearSelection = () => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    };

    const handleEnterSelectionMode = () => {
        setSelectionMode(true);
        setSelectedIds(new Set());
    };

    // Get selected items (files only)
    const getSelectedFiles = () => {
        return items.filter(item => selectedIds.has(item.id) && !item.is_folder);
    };

    // Check if selection contains folders
    const selectionContainsFolders = () => {
        return Array.from(selectedIds).some(id => {
            const item = items.find(i => i.id === id);
            return item?.is_folder === true;
        });
    };

    // ----------------------------------------------
    // CREATE FOLDER — FIXED
    // ----------------------------------------------
    const handleCreateFolder = async ({ title, color, parent_id }) => {
        try {
            await createLibraryFolder(
                title,
                parent_id ?? currentFolder?.id ?? null,
                color
            );

            await loadItems(activeFilter, currentFolder?.id || null);
        } catch (err) {
            console.error(err);
            alert("Failed to create folder");
        }

        setShowFolderModal(false);
    };

    // ----------------------------------------------
    // GRID MODE (Library browsing only)
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
                {/* Breadcrumbs + Selection Mode Toggle */}
                <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-[#0f1115] text-xs">
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
                    {!selectionMode ? (
                        <button
                            onClick={handleEnterSelectionMode}
                            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
                        >
                            Select
                        </button>
                    ) : (
                        <button
                            onClick={handleClearSelection}
                            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
                        >
                            Cancel
                        </button>
                    )}
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

                {/* Bulk Action Toolbar */}
                {selectedIds.size > 0 && (
                    <div className="h-14 flex items-center justify-between px-6 border-b border-teal/20 bg-teal/5">
                        <div className="text-sm text-white">
                            {selectedIds.size} {selectedIds.size === 1 ? 'file' : 'files'} selected
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (selectionContainsFolders()) {
                                        alert("Folders are not supported yet for bulk actions.");
                                        return;
                                    }
                                    setMoveTarget({ ids: Array.from(selectedIds), isBulk: true });
                                }}
                                className="px-4 py-2 text-xs bg-teal/20 text-teal hover:bg-teal hover:text-black rounded-lg transition font-medium"
                            >
                                Move ({selectedIds.size})
                            </button>
                            <button
                                onClick={() => {
                                    if (selectionContainsFolders()) {
                                        alert("Folders are not supported yet for bulk actions.");
                                        return;
                                    }
                                    setDeleteTarget({ ids: Array.from(selectedIds), isBulk: true });
                                }}
                                className="px-4 py-2 text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition font-medium"
                            >
                                Delete ({selectedIds.size})
                            </button>
                            <button
                                onClick={handleClearSelection}
                                className="px-4 py-2 text-xs bg-white/5 text-white hover:bg-white/10 rounded-lg transition"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                <LibraryGrid
                    items={sortedItems}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                    onMove={handleMove}
                    onRename={handleRename}
                    onMoveToFolder={handleMoveToFolder}
                    onChangeCategory={handleChangeCategory}
                    onToggleDone={handleToggleDone}
                    isLoading={isLoading || isOpening}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
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
                    items={items}
                    onClose={() => setMoveTarget(null)}
                    onSuccess={moveTarget?.isBulk ? handleBulkMoveSuccess : async () => {
                        setMoveTarget(null);
                        await loadItems(activeFilter, currentFolder?.id || null);
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
                itemCount={typeof deleteTarget === 'object' && deleteTarget?.isBulk === true ? (deleteTarget?.ids?.length || 1) : 1}
            />
        </div>
    );
};

export default LibraryPage;
