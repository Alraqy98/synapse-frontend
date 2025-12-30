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

    return {
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
        file_render_state: item.file_render_state || item.render_state || null // Keep for backwards compatibility
    };
};


// ------------------------------------------------------
// GET LIBRARY ITEMS (root or inside folder)
// ------------------------------------------------------
export const getLibraryItems = async (
    uiCategory = "All",
    parentId = null
) => {
    const headers = { "Content-Type": "application/json", ...getAuthHeaders() };

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
        return (data.items || []).map(mapItemFromApi);
    }

    // ROOT — ALL
    if (uiCategory === "All") {
        const res = await fetch(`${API_BASE}/library/root?category=all`, {
            headers,
        });
        const data = await handleJson(res);
        return (data.items || []).map(mapItemFromApi);
    }

    // ROOT — SPECIFIC CATEGORY
    const cat = uiToApiCategory(uiCategory);
    const res = await fetch(
        `${API_BASE}/library/root?category=${encodeURIComponent(cat)}`,
        { headers }
    );

    const data = await handleJson(res);
    return (data.items || []).map(mapItemFromApi);
};

// ------------------------------------------------------
// GET FILE OR FOLDER BY ID
// ------------------------------------------------------
export const getItemById = async (id) => {
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
// UPLOAD FILE
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
