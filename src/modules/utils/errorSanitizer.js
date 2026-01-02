// src/modules/utils/errorSanitizer.js
// Shared error sanitization for import/export operations

/**
 * Clean error messages - remove SQL error strings and show user-friendly messages
 * @param {string} errorMsg - Raw error message from backend
 * @param {string} itemType - Type of item being imported (e.g., "summary", "MCQ deck", "flashcard deck")
 * @returns {string} - Sanitized error message
 */
export const sanitizeErrorMessage = (errorMsg, itemType = "item") => {
    if (!errorMsg || typeof errorMsg !== 'string') {
        return `Import failed`;
    }
    
    // Remove SQL error patterns
    const sqlPatterns = [
        /SQLSTATE\[\d+\]:/gi,
        /SQLSTATE/gi,
        /ERROR:\s*\d+/gi,
        /at line \d+/gi,
        /column "[^"]+"/gi,
        /relation "[^"]+"/gi,
        /duplicate key value violates unique constraint/gi,
        /violates foreign key constraint/gi,
    ];
    
    let cleaned = errorMsg;
    sqlPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up common SQL error messages and convert to user-friendly
    if (cleaned.includes('duplicate') || cleaned.includes('already exists')) {
        return `This ${itemType} has already been imported`;
    }
    if (cleaned.includes('not found') || cleaned.includes('does not exist')) {
        return "Invalid import code";
    }
    if (cleaned.includes('permission') || cleaned.includes('unauthorized')) {
        return `You don't have permission to import this ${itemType}`;
    }
    if (cleaned.includes('expired')) {
        return "This import code has expired";
    }
    
    // If message is too technical or contains SQL remnants, show generic message
    if (cleaned.length < 10 || /[{}[\]]/.test(cleaned) || cleaned.includes('SQL')) {
        return "Invalid import code";
    }
    
    // Return cleaned message, trimmed
    return cleaned.trim() || "Invalid import code";
};

