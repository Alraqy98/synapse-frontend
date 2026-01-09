// Browser-side file compression utility
// Strict 3MB upload rule with image-only compression

import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes

/**
 * Check if a file is an image (only images can be compressed)
 */
export const isImageFile = (file) => {
    if (!file) return false;
    return file.type.startsWith('image/');
};

/**
 * Check if a file is a PDF
 */
export const isPdfFile = (file) => {
    if (!file) return false;
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();
    return mimeType === 'application/pdf' || fileName.endsWith('.pdf');
};

/**
 * Check if a file is an Office document (DOCX, PPT, PPTX)
 */
export const isOfficeFile = (file) => {
    if (!file) return false;
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.docx') || 
           fileName.endsWith('.ppt') || 
           fileName.endsWith('.pptx') ||
           fileName.endsWith('.doc');
};

/**
 * Compress an image file using browser-image-compression
 * @param {File} file - The image file to compress
 * @param {Function} onProgress - Optional progress callback (0-1)
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = async (file, onProgress) => {
    if (!isImageFile(file)) {
        throw new Error('File is not an image');
    }

    const options = {
        maxSizeMB: 3, // Target 3MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        
        // Verify compressed file is <= 3MB
        if (compressedFile.size > MAX_FILE_SIZE) {
            throw new Error(
                `Image could not be compressed below 3MB. Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB. ` +
                `Please use a smaller or lower quality image.`
            );
        }

        if (onProgress) onProgress(1);
        return compressedFile;
    } catch (error) {
        if (error.message.includes('could not be compressed')) {
            throw error;
        }
        throw new Error(`Image compression failed: ${error.message}. Please try a different image.`);
    }
};

/**
 * Validate file size and type before upload
 * @param {File} file - The file to validate
 * @returns {Object} - { isValid: boolean, error: string|null, canCompress: boolean }
 * 
 * TEMP EXPERIMENT — size limits disabled to observe render cost
 * All files are now considered valid, compression is optional
 */
export const validateFileForUpload = (file) => {
    if (!file) {
        return { isValid: false, error: 'No file selected', canCompress: false };
    }

    // TEMP EXPERIMENT — all files are valid regardless of size
    // Compression is still attempted for images/PDFs > 3MB, but not required

    // If file is <= 3MB, no compression needed
    if (file.size <= MAX_FILE_SIZE) {
        return { isValid: true, error: null, canCompress: false };
    }

    // File is > 3MB - check if compression is possible (optional)
    if (isImageFile(file)) {
        // Images can be compressed (optional)
        return { isValid: true, error: null, canCompress: true };
    }

    if (isPdfFile(file)) {
        // PDFs can be compressed (optional)
        return { isValid: true, error: null, canCompress: true };
    }

    // Office files and other types - valid but cannot be compressed
    return {
        isValid: true,
        error: null,
        canCompress: false
    };
};

/**
 * Compress image if needed (only for images > 3MB)
 * @param {File} file - The file to potentially compress
 * @param {Function} onProgress - Optional progress callback (0-1)
 * @returns {Promise<{file: File, wasCompressed: boolean, originalSize: number, compressedSize: number}>}
 */
export const compressImageIfNeeded = async (file, onProgress) => {
    const validation = validateFileForUpload(file);
    
    if (validation.isValid) {
        // File is already <= 3MB, no compression needed
        if (onProgress) onProgress(1);
        return {
            file,
            wasCompressed: false,
            originalSize: file.size,
            compressedSize: file.size
        };
    }

    if (!validation.canCompress) {
        // File cannot be compressed (PDF, Office, etc.)
        throw new Error(validation.error || 'File cannot be compressed');
    }

    // Image > 3MB - attempt compression
    if (onProgress) onProgress(0.1);
    
    try {
        const compressedFile = await compressImage(file, (progress) => {
            // Map browser-image-compression progress to our callback
            if (onProgress) {
                onProgress(0.1 + (progress * 0.9)); // 10% to 100%
            }
        });

        if (onProgress) onProgress(1);

        return {
            file: compressedFile,
            wasCompressed: true,
            originalSize: file.size,
            compressedSize: compressedFile.size
        };
    } catch (error) {
        throw new Error(
            error.message || 
            'Image compression failed. Please try a smaller image or compress it manually.'
        );
    }
};
