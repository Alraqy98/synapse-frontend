// src/modules/summaries/utils/summaryCode.js
// Frontend-only code generation for summary import/export

/**
 * Generate a unique import code for a summary
 * Format: SYN-XXXXXX (6 alphanumeric characters)
 */
export function generateImportCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
    let code = "SYN-";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Validate import code format
 */
export function isValidCodeFormat(code) {
    return /^SYN-[A-Z0-9]{6}$/i.test(code);
}

