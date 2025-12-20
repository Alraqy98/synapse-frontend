// PDF compression utility using pdf-lib
import { PDFDocument } from 'pdf-lib';

/**
 * Compress a PDF file using pdf-lib
 * @param {File} file - The PDF file to compress
 * @param {number} maxSizeBytes - Maximum allowed size in bytes (default: 3MB)
 * @returns {Promise<File>} - Compressed PDF file or original if already small enough
 */
export async function compressPdfFile(file, maxSizeBytes = 3 * 1024 * 1024) {
    // If file is already <= maxSizeBytes, return original
    if (file.size <= maxSizeBytes) {
        return file;
    }

    try {
        // Read the PDF file
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
        });

        // Save the PDF - pdf-lib automatically applies compression when saving
        const compressedPdfBytes = await pdfDoc.save();

        // Create a new File object from compressed bytes
        const compressedFile = new File(
            [compressedPdfBytes],
            file.name,
            {
                type: 'application/pdf',
                lastModified: file.lastModified,
            }
        );

        // Check if compressed file is still too large
        if (compressedFile.size > maxSizeBytes) {
            throw new Error(
                `Unable to compress PDF below ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB. ` +
                `Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB. ` +
                `Please compress manually.`
            );
        }

        return compressedFile;
    } catch (error) {
        // If compression fails, throw a readable error
        if (error.message.includes('Unable to compress')) {
            throw error;
        }
        throw new Error(
            `PDF compression failed: ${error.message}. Please try compressing the PDF manually.`
        );
    }
}

