// Import api client for new endpoint
import api from "../../lib/api";
import { demoApiIntercept } from "../demo/demoApiRuntime";

// ------------------------------------------------------
// API BASE URL
// ------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

if (!API_BASE) {
    throw new Error("VITE_API_URL is missing at build time");
}
// ------------------------------------------------------
// AUTH HEADERS
// ------------------------------------------------------
const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ------------------------------------------------------
// CATEGORY MAPPERS (FILES ONLY — folders ignore this)
// ------------------------------------------------------
export const uiToApiCategory = (ui) => {
    switch (ui) {
        case "Lecture":
            return "lectures";
        case "Notes":
            return "notes";
        case "Exams":
            return "previous_exams";
        case "Book":
            return "books";
        default:
            return ui?.toLowerCase();
    }
};

export const apiToUiCategory = (api) => {
    switch (api) {
        case "lectures":
            return "Lecture";
        case "notes":
            return "Notes";
        case "previous_exams":
            return "Exams";
        case "books":
            return "Book";
        default:
            return api;
    }
};

// ------------------------------------------------------
// SAFE JSON HANDLER
// ------------------------------------------------------
const handleJson = async (res) => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.success === false) {
        // Preserve error structure for error mapping
        const error = new Error(body.error || body.message || `Request failed (${res.status})`);
        // Attach error code if present
        if (body.error_code) {
            error.error_code = body.error_code;
        } else if (body.code) {
            error.code = body.code;
        }
        // Also check if error string contains error code
        if (body.error && typeof body.error === 'string') {
            if (body.error.includes('FILE_TOO_LARGE')) {
                error.error_code = 'FILE_TOO_LARGE';
            } else if (body.error.includes('CONVERSION_FAILED')) {
                error.error_code = 'CONVERSION_FAILED';
            } else if (body.error.includes('UNSUPPORTED_FILE_TYPE')) {
                error.error_code = 'UNSUPPORTED_FILE_TYPE';
            }
        }
        throw error;
    }
    return body;
};

// ------------------------------------------------------
// NORMALIZE ITEM (File or Folder)
// ------------------------------------------------------
const mapItemFromApi = (item) => {
    const isFolder = item.is_folder === true;

    const mappedItem = {
        id: item.id,                       // 🔥 FORCE TRUE UUID, never title
        title: item.title,
        parent_id: item.parent_id,
        category: item.category,
        size_bytes: item.size_bytes,
        file_url: item.file_url,
        signed_url: item.signed_url,      // Signed URL for PDF access
        mime_type: item.mime_type,
        depth: item.depth,
        is_folder: isFolder,
        kind: isFolder ? "folder" : "file",
        uiCategory: isFolder ? "Folder" : apiToUiCategory(item.category),
        page_count: item.page_count,
        ocr_pages_count: item.ocr_pages_count,
        preview_text: item.preview_text,
        created_at: item.created_at,
        updated_at: item.updated_at,
        mimetype: item.mime_type || item.mimetype || null,
        ingestion_status: item.ingestion_status || (isFolder ? null : "ready"), // Default to "ready" for backwards compatibility
        total_pages: item.total_pages || item.page_count || 0,
        rendered_pages: item.rendered_pages || 0,
        // Render state (source of truth for processing indicator - terminal states only)
        // Backend may return as render_state or file_render_state
        render_state: item.render_state || item.file_render_state || null,
        file_render_state: item.file_render_state || item.render_state || null, // Keep for backwards compatibility
        is_done: item.is_done ?? false, // User-controlled done status
        // Preserve page_contents for FileViewer vision pipeline
        page_contents: item.page_contents || null,
        // Preserve folder color from API
        color: item.color || null,
    };

    // DIAGNOSTIC: Log mapped item for first file (to trace data flow)
    if (!isFolder && mappedItem.id) {
        console.log("[API_DIAG] Mapped library item", {
            id: mappedItem.id,
            title: mappedItem.title,
            originalRenderState: item.render_state,
            originalFileRenderState: item.file_render_state,
            mappedRenderState: mappedItem.render_state,
            mappedFileRenderState: mappedItem.file_render_state,
        });
    }

    return mappedItem;
};


// ------------------------------------------------------
// GET LIBRARY ITEMS (root or inside folder)
// ------------------------------------------------------
export const getLibraryItems = async (
    uiCategory = "All",
    parentId = null
) => {
    const headers = { "Content-Type": "application/json", ...getAuthHeaders() };

    // Demo Mode interception: library list → demo file metadata
    const demoRes = demoApiIntercept({
        method: "GET",
        url: parentId
            ? `/library/children?parent_id=${parentId}&category=${uiCategory === "All" ? "all" : uiToApiCategory(uiCategory)}`
            : uiCategory === "All"
            ? "/library/root?category=all"
            : `/library/root?category=${uiToApiCategory(uiCategory)}`,
    });
    if (demoRes.handled) {
        return (demoRes.data || []).map(mapItemFromApi);
    }

    // CHILDREN
    if (parentId) {
        const cat =
            uiCategory === "All"
                ? "all"
                : uiToApiCategory(uiCategory);

        const res = await fetch(
            `${API_BASE}/library/children?parent_id=${parentId}&category=${cat}`,
            { headers }
        );

        const data = await handleJson(res);
        
        // DIAGNOSTIC: Log raw API response for first file item
        if (data.items && data.items.length > 0) {
            const firstFile = data.items.find(item => !item.is_folder);
            if (firstFile) {
                console.log("[API_DIAG] Raw /library/children response", {
                    endpoint: `/library/children?parent_id=${parentId}&category=${cat}`,
                    firstFile: {
                        id: firstFile.id,
                        title: firstFile.title,
                        render_state: firstFile.render_state,
                        file_render_state: firstFile.file_render_state,
                        hasRenderState: !!firstFile.render_state,
                        hasFileRenderState: !!firstFile.file_render_state,
                    }
                });
            }
            
        }
        
        return (data.items || []).map(mapItemFromApi);
    }

    // ROOT — ALL
    if (uiCategory === "All") {
        const res = await fetch(`${API_BASE}/library/root?category=all`, {
            headers,
        });
        const data = await handleJson(res);
        
        // DIAGNOSTIC: Log raw API response for first file item
        if (data.items && data.items.length > 0) {
            const firstFile = data.items.find(item => !item.is_folder);
            if (firstFile) {
                console.log("[API_DIAG] Raw /library/root response (all)", {
                    endpoint: `/library/root?category=all`,
                    firstFile: {
                        id: firstFile.id,
                        title: firstFile.title,
                        render_state: firstFile.render_state,
                        file_render_state: firstFile.file_render_state,
                        hasRenderState: !!firstFile.render_state,
                        hasFileRenderState: !!firstFile.file_render_state,
                    }
                });
            }
        }
        
        return (data.items || []).map(mapItemFromApi);
    }

    // ROOT — SPECIFIC CATEGORY
    const cat = uiToApiCategory(uiCategory);
    const res = await fetch(
        `${API_BASE}/library/root?category=${encodeURIComponent(cat)}`,
        { headers }
    );

    const data = await handleJson(res);
    
    // DIAGNOSTIC: Log raw API response for first file item
    if (data.items && data.items.length > 0) {
        const firstFile = data.items.find(item => !item.is_folder);
        if (firstFile) {
            console.log("[API_DIAG] Raw /library/root response (category)", {
                endpoint: `/library/root?category=${encodeURIComponent(cat)}`,
                firstFile: {
                    id: firstFile.id,
                    title: firstFile.title,
                    render_state: firstFile.render_state,
                    file_render_state: firstFile.file_render_state,
                    hasRenderState: !!firstFile.render_state,
                    hasFileRenderState: !!firstFile.file_render_state,
                }
            });
        }
    }
    
    return (data.items || []).map(mapItemFromApi);
};

// ------------------------------------------------------
// GET FILE OR FOLDER BY ID
// ------------------------------------------------------
export const getItemById = async (id) => {
    // Demo Mode interception: file open → demo file
    const demoRes = demoApiIntercept({
        method: "GET",
        url: `/library/item/${id}`,
    });
    if (demoRes.handled) {
        return mapItemFromApi(demoRes.data);
    }

    const res = await fetch(`${API_BASE}/library/item/${id}`, {
        headers: { ...getAuthHeaders() },
    });

    const data = await handleJson(res);
    return mapItemFromApi(data.item || data);
};

// ------------------------------------------------------
// PREPARE FILE (trigger rendering)
// POST /library/prepare-file
// Calls backend render trigger and returns immediately
// Backend handles rendering asynchronously
// ------------------------------------------------------
export const prepareFile = async (fileId) => {
    if (!fileId) throw new Error("File ID is missing");
    
    const res = await fetch(`${API_BASE}/library/prepare-file`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ fileId }),
    });

    await handleJson(res);
    // Return immediately - backend handles rendering asynchronously
    // Generator endpoints will handle render status internally
};

// ------------------------------------------------------
// UPLOAD FILE (single file - kept for backward compatibility)
// ------------------------------------------------------
export const uploadLibraryFile = async (
    file,
    uiCategory,
    parentId = null
) => {
    const category = uiToApiCategory(uiCategory);
    const formData = new FormData();

    formData.append("file", file);
    formData.append("title", file.name);
    formData.append("category", category);
    if (parentId) formData.append("parent_id", parentId);

    const res = await fetch(`${API_BASE}/library/upload`, {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: formData,
    });

    const data = await handleJson(res);
    return mapItemFromApi(data.item);
};

// ------------------------------------------------------
// UPLOAD MULTIPLE FILES (up to 5 files)
// ------------------------------------------------------
export const uploadLibraryFiles = async (
    files,
    uiCategory,
    parentId = null
) => {
    if (!files || files.length === 0) {
        throw new Error("No files provided");
    }

    if (files.length > 5) {
        throw new Error("Maximum 5 files allowed per upload");
    }

    const category = uiToApiCategory(uiCategory);
    const formData = new FormData();

    // Append all files with field name "file" to match multer upload.array("file", 5)
    files.forEach((file) => {
        formData.append("file", file);
    });

    formData.append("category", category);
    if (parentId) formData.append("parent_id", parentId);

    const res = await fetch(`${API_BASE}/library/upload`, {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: formData,
    });

    const data = await handleJson(res);
    
    // Handle response - could be single item or array of items with success/failure per file
    if (data.items && Array.isArray(data.items)) {
        // Multiple files response with per-file results
        return {
            success: data.items.map((item) => ({
                success: item.success !== false,
                item: item.item ? mapItemFromApi(item.item) : null,
                error: item.error || null,
                fileName: item.file_name || null,
            })),
        };
    } else if (data.item) {
        // Single file response (backward compatibility)
        return {
            success: [
                {
                    success: true,
                    item: mapItemFromApi(data.item),
                    error: null,
                    fileName: data.item.title || null,
                },
            ],
        };
    } else {
        // Fallback - assume all succeeded
        return {
            success: files.map((file) => ({
                success: true,
                item: null,
                error: null,
                fileName: file.name,
            })),
        };
    }
};

// ------------------------------------------------------
// CREATE FOLDER (supports color)
// ------------------------------------------------------
export const createLibraryFolder = async (title, parentId = null, color = null) => {
    const res = await fetch(`${API_BASE}/library/folder`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({
            title,
            parent_id: parentId,
            color,
        }),
    });

    const json = await handleJson(res);
    return mapItemFromApi(json.folder || json);
};

// ------------------------------------------------------
// GET ALL FOLDERS
// ------------------------------------------------------
export const getAllFolders = async () => {
    const res = await fetch(`${API_BASE}/library/all-folders`, {
        headers: getAuthHeaders(),
    });

    const data = await handleJson(res);
    return (data.folders || []).map(mapItemFromApi);
};

// ------------------------------------------------------
// MOVE ITEM (category change)
// ------------------------------------------------------
export const moveItem = async (id, newUiCategory) => {
    const newCategory = uiToApiCategory(newUiCategory);

    const res = await fetch(`${API_BASE}/library/item/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ category: newCategory }),
    });

    await handleJson(res);
    return true;
};

// ------------------------------------------------------
// MOVE ITEM INTO FOLDER
// ------------------------------------------------------
export const moveToFolder = async (itemId, folderId) => {
    const res = await fetch(`${API_BASE}/library/item/${itemId}/move`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({
            new_parent_id: folderId ?? null,
        }),
    });

    await handleJson(res);
    return true;
};

// ------------------------------------------------------
// RENAME FILE/FOLDER
// ------------------------------------------------------
export const renameItem = async (id, newName) => {
    const res = await fetch(`${API_BASE}/library/item/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ title: newName }),
    });

    await handleJson(res);
    return true;
};

// ------------------------------------------------------
// UPDATE FILE STATUS (is_done)
// ------------------------------------------------------
export const updateFileStatus = async (fileId, isDone) => {
    const res = await api.patch(`/library/item/${fileId}/status`, {
        is_done: isDone,
    });
    return res.data;
};

// ------------------------------------------------------
// DELETE ITEM
// ------------------------------------------------------
export const deleteItem = async (id) => {
    const res = await fetch(`${API_BASE}/library/item/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    await handleJson(res);
    return true;
};

// ------------------------------------------------------
// BULK DELETE ITEMS
// ------------------------------------------------------
export const bulkDeleteItems = async (ids) => {
    const res = await fetch(`${API_BASE}/library/bulk-delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ ids }),
    });

    const data = await handleJson(res);
    return data; // { success_ids: [], failed_ids: [], errors: {} }
};

// ------------------------------------------------------
// BULK MOVE ITEMS
// ------------------------------------------------------
export const bulkMoveItems = async (ids, folderId) => {
    const res = await fetch(`${API_BASE}/library/bulk-move`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
            ids,
            target_parent_id: folderId, // null for root, string for folder
        }),
    });

    const data = await handleJson(res);
    return data; // { success_ids: [], failed_ids: [], errors: {} }
};

// ------------------------------------------------------
// TUTOR RESOURCES
// ------------------------------------------------------
export const getTutorResources = async ({
    file_ids = [],
    folder_ids = [],
    category = null,
}) => {
    const res = await fetch(`${API_BASE}/library/tutor/resources`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({
            category,
            ids: file_ids,
            folder_id: folder_ids?.[0] || null,
        }),
    });

    return handleJson(res);
};

// ------------------------------------------------------
// GET RECENT FILES (across all folders)
// GET /library/files/recent?limit=5
// Returns files only, sorted by created_at DESC
// ------------------------------------------------------
export const getRecentFiles = async (limit = 5) => {
    const res = await api.get(`/library/files/recent?limit=${limit}`);
    // Backend returns { items: [...] } - map each item using existing mapper
    const items = res.data?.items || [];
    return items.map(mapItemFromApi);
};

// ------------------------------------------------------
// MOCK VIEWER ACTIONS
// ------------------------------------------------------
export const performLibraryAction = async (fileId, action) => {
    console.warn(`[Mock Action]`, { fileId, action });

    await new Promise((r) => setTimeout(r, 600));

    return {
        success: true,
        result: `Mocked output for "${action}" on file ID ${fileId}.`,
    };
};

// ------------------------------------------------------
// NEW WRAPPERS (Fix missing imports)
// ------------------------------------------------------
export const getRootItems = async (category = "All") => {
    return await getLibraryItems(category, null);
};

export const getChildren = async (folderId, category = "All") => {
    return await getLibraryItems(category, folderId);
};

// ------------------------------------------------------
// GET ANNOTATIONS FOR A PAGE
// GET /library/annotations?file_id=UUID&page=INT
// Returns: { strokes: Array | null }
// ------------------------------------------------------
export const getAnnotations = async (fileId, page) => {
    if (!fileId || !page) {
        return { strokes: null };
    }

    const res = await fetch(
        `${API_BASE}/library/annotations?file_id=${fileId}&page=${page}`,
        {
            headers: { ...getAuthHeaders() },
        }
    );

    // Handle 404 gracefully (no annotations exist yet)
    if (res.status === 404) {
        return { strokes: null };
    }

    const data = await handleJson(res);
    return {
        strokes: data.strokes || null,
    };
};