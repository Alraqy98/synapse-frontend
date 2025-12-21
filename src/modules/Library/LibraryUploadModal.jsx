// src/modules/Library/LibraryUploadModal.jsx
import React, { useState, useRef } from "react";
import { X, UploadCloud, File, Loader2 } from "lucide-react";
import { uploadLibraryFile } from "./apiLibrary";
import { compressImageIfNeeded, validateFileForUpload, isImageFile, isPdfFile } from "../../lib/fileCompression";
import { compressPdfFile } from "./utils/compressPdf";
import { getUploadErrorMessage } from "./utils/uploadErrorMessages";

const LibraryUploadModal = ({ onClose, onUploadSuccess, parentFolderId = null }) => {
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState("Lecture");
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [error, setError] = useState(null);
    const [compressionInfo, setCompressionInfo] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setError(null);
            setCompressionInfo(null);
            
            // Validate file immediately
            const validation = validateFileForUpload(selectedFile);
            
            if (!validation.isValid && !validation.canCompress) {
                // File is invalid and cannot be compressed - show error immediately
                setError(validation.error || 'File exceeds 3MB and cannot be compressed.');
                setFile(null);
                // Clear file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        // Validate file before proceeding
        const validation = validateFileForUpload(file);
        
        if (!validation.isValid && !validation.canCompress) {
            // File is invalid and cannot be compressed - block upload
            setError(validation.error || 'File exceeds 3MB and cannot be compressed.');
            return;
        }

        setIsUploading(true);
        setError(null);
        
        try {
            let fileToUpload = file;
            
            // Compress images that are > 3MB
            if (validation.canCompress && isImageFile(file)) {
                setIsCompressing(true);
                setCompressionProgress(0);
                
                try {
                    const result = await compressImageIfNeeded(file, (progress) => {
                        setCompressionProgress(progress);
                    });
                    
                    fileToUpload = result.file;
                    setCompressionInfo({
                        wasCompressed: result.wasCompressed,
                        originalSize: result.originalSize,
                        compressedSize: result.compressedSize
                    });
                } catch (compressionError) {
                    setIsCompressing(false);
                    setError(compressionError.message || "Image compression failed. Please try a smaller image.");
                    setIsUploading(false);
                    return;
                } finally {
                    setIsCompressing(false);
                }
            }
            
            // Compress PDFs that are > 3MB
            if (validation.canCompress && isPdfFile(file) && file.type === "application/pdf") {
                setIsCompressing(true);
                setCompressionProgress(0);
                
                try {
                    const originalSize = file.size;
                    setCompressionProgress(50); // Show progress indicator
                    
                    const compressedFile = await compressPdfFile(file, 3 * 1024 * 1024);
                    
                    setCompressionProgress(100);
                    fileToUpload = compressedFile;
                    setCompressionInfo({
                        wasCompressed: compressedFile.size < originalSize,
                        originalSize: originalSize,
                        compressedSize: compressedFile.size
                    });
                } catch (compressionError) {
                    setIsCompressing(false);
                    setError(compressionError.message || "Unable to compress PDF below 3 MB. Please compress manually.");
                    setIsUploading(false);
                    return;
                } finally {
                    setIsCompressing(false);
                }
            }
            
            // Final validation - ensure file is <= 3MB before upload
            if (fileToUpload.size > 3 * 1024 * 1024) {
                setError('File still exceeds 3MB after compression. Please use a smaller file.');
                setIsUploading(false);
                return;
            }
            
            // Upload the file (compressed or original)
            await uploadLibraryFile(fileToUpload, category, parentFolderId);
            onUploadSuccess();
            onClose();
        } catch (error) {
            console.error("Upload failed:", error);
            // Map backend error codes to user-friendly messages
            const userMessage = getUploadErrorMessage(error);
            setError(userMessage);
        } finally {
            setIsUploading(false);
            setCompressionProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Upload to Library</h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* File Drop Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all
                            ${file
                                ? "border-teal/50 bg-teal/5"
                                : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            }
                        `}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp"
                        />

                        {file ? (
                            <>
                                <File size={40} className="text-teal mb-4" />
                                <p className="font-medium text-white">{file.name}</p>
                                <div className="text-sm text-muted mt-1 space-y-1">
                                    <p>
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                        {compressionInfo?.wasCompressed && (
                                            <span className="text-teal ml-2">
                                                (compressed from {(compressionInfo.originalSize / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        )}
                                    </p>
                                    {file.size > 3 * 1024 * 1024 && (isImageFile(file) || isPdfFile(file)) && (
                                        <p className="text-yellow-400 text-xs">
                                            File will be compressed before upload
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={40} className="text-muted mb-4" />
                                <p className="font-medium text-white">Click to upload</p>
                                <p className="text-sm text-muted mt-1">
                                    PDF, Images, DOC, DOCX, PPT, PPTX, TXT (Max 3MB)
                                </p>
                            </>
                        )}
                    </div>

                    {/* Category Select */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal/50"
                        >
                            <option value="Lecture">Lecture</option>
                            <option value="Notes">Notes</option>
                            <option value="Exams">Exams</option>
                            <option value="Book">Book (Private)</option>
                        </select>
                    </div>

                    {/* Compression Progress */}
                    {isCompressing && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted">
                                    {isPdfFile(file) ? "Compressing PDF…" : "Compressing image…"}
                                </span>
                                <span className="text-teal">{Math.round(compressionProgress)}%</span>
                            </div>
                            <div className="w-full bg-[#0f1115] rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-teal h-full transition-all duration-300"
                                    style={{ width: `${compressionProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading || isCompressing}
                        className="px-6 py-2 bg-teal hover:bg-teal-neon text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {(isUploading || isCompressing) ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                {isCompressing ? "Compressing..." : "Uploading..."}
                            </>
                        ) : (
                            "Upload"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LibraryUploadModal;
