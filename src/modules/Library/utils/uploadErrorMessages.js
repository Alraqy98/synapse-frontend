// Upload error code to user-friendly message mapping

/**
 * Maps backend error codes to user-friendly messages
 * @param {string|Error} error - Error object or error code string
 * @returns {string} - User-friendly error message
 */
export function getUploadErrorMessage(error) {
    // Extract error code from various error formats
    let errorCode = null;
    
    if (typeof error === 'string') {
        // Check if string contains error code
        const upperStr = error.toUpperCase();
        if (upperStr.includes('FILE_TOO_LARGE')) {
            errorCode = 'FILE_TOO_LARGE';
        } else if (upperStr.includes('CONVERSION_FAILED')) {
            errorCode = 'CONVERSION_FAILED';
        } else if (upperStr.includes('UNSUPPORTED_FILE_TYPE')) {
            errorCode = 'UNSUPPORTED_FILE_TYPE';
        } else {
            errorCode = error;
        }
    } else if (error?.error_code) {
        errorCode = error.error_code;
    } else if (error?.code) {
        errorCode = error.code;
    } else if (error?.message) {
        // Check if message contains error code
        const message = error.message.toUpperCase();
        if (message.includes('FILE_TOO_LARGE')) {
            errorCode = 'FILE_TOO_LARGE';
        } else if (message.includes('CONVERSION_FAILED')) {
            errorCode = 'CONVERSION_FAILED';
        } else if (message.includes('UNSUPPORTED_FILE_TYPE')) {
            errorCode = 'UNSUPPORTED_FILE_TYPE';
        }
    }

    // Normalize error code to uppercase for comparison
    const normalizedCode = errorCode ? errorCode.toUpperCase() : null;

    // Map error codes to user-friendly messages
    switch (normalizedCode) {
        case 'FILE_TOO_LARGE':
            return 'This file is too large to upload. Please compress or export it as a PDF, then try again.';
        
        case 'CONVERSION_FAILED':
            return 'We couldn\'t convert this file to PDF. Please export it as a PDF and upload it again.';
        
        case 'UNSUPPORTED_FILE_TYPE':
            return 'This file format isn\'t supported. Please upload a PDF.';
        
        default:
            // Unknown error - show generic message
            return 'Sorry, this file couldn\'t be uploaded. Please convert it to PDF and try again.';
    }
}

