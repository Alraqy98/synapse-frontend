// ------------------------------------------------------
// API BASE URL
// ------------------------------------------------------
const API_BASE =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "")

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
        throw new Error(
            body.error || body.message || `Request failed (${res.status})`
        );
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
        mimetype: item.mime_type || item.mimetype || null
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
