// Browser-side file compression utility
// Supports: Images (JPEG, PNG, WebP) and PDFs

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

/**
 * Check if a file type is supported for compression
 */
export const isCompressibleFileType = (file) => {
    if (!file) return false;
    
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Check PDF
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return true;
    }
    
    // Check images
    if (mimeType.startsWith('image/')) {
        const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        return supportedImageTypes.includes(mimeType);
    }
    
    return false;
};

/**
 * Compress an image file using Canvas API
 * @param {File} file - The image file to compress
 * @param {number} maxSizeBytes - Target maximum size in bytes (default: 2MB)
 * @param {number} quality - Initial quality (0-1), will be reduced if needed
 * @returns {Promise<File>} - Compressed file or original if compression fails
 */
export const compressImage = async (file, maxSizeBytes = MAX_FILE_SIZE, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate dimensions (max 1920px on longest side to maintain quality)
                let width = img.width;
                let height = img.height;
                const maxDimension = 1920;
                
                if (width > height) {
                    if (width > maxDimension) {
                        height = (height * maxDimension) / width;
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = (width * maxDimension) / height;
                        height = maxDimension;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw image to canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                // Try to compress with decreasing quality until we hit target size
                const tryCompress = (currentQuality) => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to compress image'));
                                return;
                            }
                            
                            // If we're under the limit, return successfully
                            if (blob.size <= maxSizeBytes) {
                                const compressedFile = new File(
                                    [blob],
                                    file.name,
                                    { type: 'image/jpeg' } // Always output as JPEG for better compression
                                );
                                resolve(compressedFile);
                            } else if (currentQuality <= 0.1) {
                                // Quality is too low and still over limit - return anyway
                                // The caller will check size and throw appropriate error
                                const compressedFile = new File(
                                    [blob],
                                    file.name,
                                    { type: 'image/jpeg' }
                                );
                                resolve(compressedFile);
                            } else {
                                // Try with lower quality (reduce by 0.1, but don't go below 0.1)
                                const nextQuality = Math.max(0.1, currentQuality - 0.1);
                                tryCompress(nextQuality);
                            }
                        },
                        'image/jpeg',
                        currentQuality
                    );
                };
                
                tryCompress(quality);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image for compression'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read image file'));
        };
        
        reader.readAsDataURL(file);
    });
};

/**
 * Attempt to optimize PDF (browser-side PDF compression is limited)
 * For now, we'll return the original file and let the size check handle it
 * @param {File} file - The PDF file
 * @returns {Promise<File>} - Original file (PDF compression in browser is complex)
 */
export const compressPDF = async (file) => {
    // Browser-side PDF compression is very limited and complex
    // Most PDF compression requires server-side processing or specialized libraries
    // For stability, we'll return the original file and let size validation handle it
    // In a production environment, you might want to use a service worker or
    // a library like pdf-lib, but true compression is difficult client-side
    
    return Promise.resolve(file);
};

/**
 * Compress a file if it's over the size limit
 * @param {File} file - The file to potentially compress
 * @param {Function} onProgress - Optional progress callback (0-1)
 * @returns {Promise<{file: File, wasCompressed: boolean, originalSize: number}>}
 */
export const compressFileIfNeeded = async (file, onProgress) => {
    if (!file) {
        throw new Error('No file provided');
    }
    
    const originalSize = file.size;
    
    // If file is already under limit, return as-is
    if (originalSize <= MAX_FILE_SIZE) {
        if (onProgress) onProgress(1);
        return {
            file,
            wasCompressed: false,
            originalSize,
            compressedSize: originalSize
        };
    }
    
    // Check if file type is supported
    if (!isCompressibleFileType(file)) {
        throw new Error(
            `File type not supported for compression. Please upload a PDF or image file under ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.`
        );
    }
    
    if (onProgress) onProgress(0.1);
    
    let compressedFile;
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();
    
    try {
        // Compress based on file type
        if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
            if (onProgress) onProgress(0.3);
            compressedFile = await compressPDF(file);
            if (onProgress) onProgress(0.7);
        } else if (mimeType.startsWith('image/')) {
            if (onProgress) onProgress(0.3);
            compressedFile = await compressImage(file);
            if (onProgress) onProgress(0.9);
        } else {
            throw new Error('Unsupported file type for compression');
        }
        
        if (onProgress) onProgress(1);
        
        // Check if compressed file is still too large
        if (compressedFile.size > MAX_FILE_SIZE) {
            // For PDFs, we can't really compress them in the browser
            if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
                throw new Error(
                    `PDF file is too large (${(originalSize / 1024 / 1024).toFixed(2)}MB). ` +
                    `Please compress the PDF using an external tool before uploading. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.`
                );
            } else {
                throw new Error(
                    `File is too large (${(originalSize / 1024 / 1024).toFixed(2)}MB) and could not be compressed below ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB. ` +
                    `Please use a smaller or lower quality image.`
                );
            }
        }
        
        return {
            file: compressedFile,
            wasCompressed: true,
            originalSize,
            compressedSize: compressedFile.size
        };
        
    } catch (error) {
        // If compression fails, throw with a clear message
        if (error.message.includes('too large') || error.message.includes('compress')) {
            throw error;
        }
        
        throw new Error(
            `Compression failed: ${error.message}. ` +
            `Please ensure the file is under ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB or try a different file.`
        );
    }
};

