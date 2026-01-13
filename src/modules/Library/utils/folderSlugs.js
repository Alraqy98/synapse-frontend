// src/modules/Library/utils/folderSlugs.js
// Frontend-only slug generation and lookup for folder URLs

/**
 * Generate a URL-safe slug from folder name
 * @param {string} name - Folder name
 * @returns {string} - URL-safe slug
 */
export const generateSlug = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Collapse multiple hyphens
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
};

/**
 * Slug lookup map (in-memory cache)
 * Maps: slug → { id, name, parentId }
 * Also maintains reverse: id → slug
 */
const slugCache = new Map(); // slug → folder data
const idToSlugCache = new Map(); // id → slug

/**
 * Register a folder in the slug cache
 * @param {string} id - Folder ID
 * @param {string} name - Folder name
 * @param {string|null} parentId - Parent folder ID (optional)
 */
export const registerFolder = (id, name, parentId = null) => {
    const slug = generateSlug(name);
    slugCache.set(slug, { id, name, parentId });
    idToSlugCache.set(id, slug);
    return slug;
};

/**
 * Get folder data by slug
 * @param {string} slug - Folder slug
 * @returns {{id: string, name: string, parentId: string|null}|null}
 */
export const getFolderBySlug = (slug) => {
    return slugCache.get(slug) || null;
};

/**
 * Get slug by folder ID
 * @param {string} id - Folder ID
 * @returns {string|null}
 */
export const getSlugById = (id) => {
    return idToSlugCache.get(id) || null;
};

/**
 * Build folder path from folder hierarchy
 * @param {Array} folders - Array of folder objects with id, title, parent_id
 * @returns {string} - Path like "/library/slug1/slug2" or "/library"
 */
export const buildFolderPath = (folders) => {
    if (!folders || folders.length === 0) return "/library";
    
    const slugs = folders.map(folder => {
        const slug = getSlugById(folder.id);
        if (!slug) {
            // Generate and register if not cached
            return registerFolder(folder.id, folder.title, folder.parent_id);
        }
        return slug;
    });
    
    return `/library/${slugs.join("/")}`;
};

/**
 * Clear slug cache (useful for testing or reset)
 */
export const clearSlugCache = () => {
    slugCache.clear();
    idToSlugCache.clear();
};
