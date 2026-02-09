// src/modules/Library/LibraryUploadModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, File, Loader2, Folder, ArrowUpLeft } from "lucide-react";
import { uploadLibraryFiles, getAllFolders, getLibraryItems } from "./apiLibrary";
import { compressImageIfNeeded, validateFileForUpload, isImageFile, isPdfFile } from "../../lib/fileCompression";
import { compressPdfFile } from "./utils/compressPdf";
import { getUploadErrorMessage } from "./utils/uploadErrorMessages";

// TEMP SAFETY RAIL — mirrors backend 25MB upload limit
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25MB in bytes

const MAX_FILES = 5;

const LibraryUploadModal = ({ onClose, onUploadSuccess, parentFolderId = null, enableFolderSelection = false }) => {
    const [files, setFiles] = useState([]);
    const [category, setCategory] = useState("Lecture");
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState({});
    const [error, setError] = useState(null);
    const [compressionInfo, setCompressionInfo] = useState({});
    const [uploadResults, setUploadResults] = useState(null);
    const fileInputRef = useRef(null);
    
    // Folder selection state
    const [folders, setFolders] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState(parentFolderId);
    const [hasExistingItems, setHasExistingItems] = useState(false);

    // Load folders and check for existing items when folder selection is enabled
    useEffect(() => {
        if (!enableFolderSelection) return;

        const loadFoldersAndCheckItems = async () => {
            setLoadingFolders(true);
            try {
                // Check if user has any items
                const allItems = await getLibraryItems("All", null);
                setHasExistingItems(allItems.length > 0);

                // Load folders for selection
                const allFolders = await getAllFolders();
                setFolders(allFolders);
            } catch (err) {
                console.error("Failed to load folders:", err);
            } finally {
                setLoadingFolders(false);
            }
        };

        loadFoldersAndCheckItems();
    }, [enableFolderSelection]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        setError(null);
        setUploadResults(null);

        // Check total file count
        const totalFiles = files.length + selectedFiles.length;
        if (totalFiles > MAX_FILES) {
            setError(`Maximum ${MAX_FILES} files allowed. Please select fewer files.`);
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Validate each file
        const validFiles = [];
        const errors = [];

        selectedFiles.forEach((file) => {
            // TEMP SAFETY RAIL — mirrors backend 25MB upload limit
            if (file.size > MAX_UPLOAD_SIZE) {
                errors.push(`${file.name}: Maximum file size is 25MB.`);
            } else {
                validFiles.push(file);
            }
        });

        if (errors.length > 0) {
            setError(errors.join(' '));
        }

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);
        }

        // Clear file input to allow selecting same files again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index) => {
        setFiles((prev) => {
            const newFiles = prev.filter((_, i) => i !== index);
            // Reindex compression info for remaining files
            setCompressionInfo((prevInfo) => {
                const newInfo = {};
                newFiles.forEach((file, newIndex) => {
                    // Find the original index of this file
                    const originalIndex = prev.findIndex((f, i) => i !== index && f === file);
                    if (originalIndex !== -1 && prevInfo[originalIndex]) {
                        newInfo[newIndex] = prevInfo[originalIndex];
                    }
                });
                return newInfo;
            });
            return newFiles;
        });
        setError(null);
        setUploadResults(null);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        // TEMP SAFETY RAIL — mirrors backend 25MB upload limit
        const oversizedFiles = files.filter((f) => f.size > MAX_UPLOAD_SIZE);
        if (oversizedFiles.length > 0) {
            setError('Some files exceed 25MB limit. Please remove them before uploading.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadResults(null);
        
        try {
            const filesToUpload = [];
            const newCompressionInfo = {};

            // Process each file for compression
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let fileToUpload = file;
                const validation = validateFileForUpload(file);
                
                setIsCompressing(true);
                setCompressionProgress((prev) => ({ ...prev, [i]: 0 }));

                // OPTIONAL: Attempt to compress images that are > 3MB (non-blocking)
                if (validation.canCompress && isImageFile(file)) {
                    try {
                        const result = await compressImageIfNeeded(file, (progress) => {
                            setCompressionProgress((prev) => ({ ...prev, [i]: progress }));
                        });
                        
                        fileToUpload = result.file;
                        newCompressionInfo[i] = {
                            wasCompressed: result.wasCompressed,
                            originalSize: result.originalSize,
                            compressedSize: result.compressedSize
                        };
                    } catch (compressionError) {
                        // Compression failed - use original file, don't block upload
                        console.warn(`Image compression failed for ${file.name}, using original file:`, compressionError);
                        fileToUpload = file;
                        newCompressionInfo[i] = null;
                    }
                }
                
                // OPTIONAL: Attempt to compress PDFs that are > 3MB (non-blocking)
                if (validation.canCompress && isPdfFile(file) && file.type === "application/pdf") {
                    try {
                        const originalSize = file.size;
                        setCompressionProgress((prev) => ({ ...prev, [i]: 50 }));
                        
                        const compressedFile = await compressPdfFile(file, 3 * 1024 * 1024);
                        
                        setCompressionProgress((prev) => ({ ...prev, [i]: 100 }));
                        fileToUpload = compressedFile;
                        newCompressionInfo[i] = {
                            wasCompressed: compressedFile.size < originalSize,
                            originalSize: originalSize,
                            compressedSize: compressedFile.size
                        };
                    } catch (compressionError) {
                        // Compression failed - use original file, don't block upload
                        console.warn(`PDF compression failed for ${file.name}, using original file:`, compressionError);
                        fileToUpload = file;
                        newCompressionInfo[i] = null;
                    }
                }

                filesToUpload.push(fileToUpload);
            }

            setCompressionInfo(newCompressionInfo);
            setIsCompressing(false);

            // Upload all files in one request
            const targetFolderId = enableFolderSelection ? selectedFolderId : parentFolderId;
            const result = await uploadLibraryFiles(filesToUpload, category, targetFolderId);

            // Check for partial failures
            const successful = result.success.filter((r) => r.success);
            const failed = result.success.filter((r) => !r.success);

            if (failed.length > 0) {
                // Some files failed - show errors but don't close modal
                setUploadResults({ successful, failed });
                const errorMessages = failed.map((f) => {
                    const fileName = f.fileName || 'Unknown file';
                    const errorMsg = f.error || 'Upload failed';
                    return `${fileName}: ${errorMsg}`;
                });
                setError(errorMessages.join(' '));
                
                // If some files succeeded, refresh library
                if (successful.length > 0) {
                    onUploadSuccess();
                }
            } else {
                // All files succeeded
                onUploadSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Upload failed:", error);
            // Map backend error codes to user-friendly messages
            const userMessage = getUploadErrorMessage(error);
            setError(userMessage || error.message || 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            setIsCompressing(false);
            setCompressionProgress({});
        }
    };

    // Unified close handler
    const handleClose = () => {
        onClose();
    };

    // ESC key handler
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleClose}
        >
            <div 
                className="w-full max-w-md bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Upload to Library</h2>
                    <button
                        onClick={handleClose}
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
                            ${files.length > 0
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
                            multiple
                        />

                        {files.length === 0 ? (
                            <>
                                <UploadCloud size={40} className="text-muted mb-4" />
                                <p className="font-medium text-white">Click to upload</p>
                                <p className="text-sm text-muted mt-1">
                                    {/* TEMP SAFETY RAIL — reflects backend 25MB upload limit */}
                                    PDF, Images, DOC, DOCX, PPT, PPTX, TXT — Max 25MB
                                </p>
                                <p className="text-xs text-muted mt-2">
                                    Select up to {MAX_FILES} files
                                </p>
                            </>
                        ) : (
                            <div className="w-full space-y-3">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                                    >
                                        <File size={20} className="text-teal mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-white text-sm truncate">{file.name}</p>
                                                {!isUploading && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(index);
                                                        }}
                                                        className="text-muted hover:text-red-400 transition-colors shrink-0"
                                                        type="button"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted mt-1 space-y-1">
                                                <p>
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    {compressionInfo[index]?.wasCompressed && (
                                                        <span className="text-teal ml-2">
                                                            (compressed from {(compressionInfo[index].originalSize / 1024 / 1024).toFixed(2)} MB)
                                                        </span>
                                                    )}
                                                </p>
                                                {compressionProgress[index] !== undefined && compressionProgress[index] > 0 && compressionProgress[index] < 100 && (
                                                    <div className="w-full bg-[#0f1115] rounded-full h-1.5 mt-1 overflow-hidden">
                                                        <div
                                                            className="bg-teal h-full transition-all duration-300"
                                                            style={{ width: `${compressionProgress[index]}%` }}
                                                        />
                                                    </div>
                                                )}
                                                {file.size > 3 * 1024 * 1024 && (
                                                    <p className="text-yellow-400 text-xs">
                                                        Large file may take longer to process
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {files.length < MAX_FILES && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="text-sm text-teal hover:text-teal-neon transition-colors"
                                        type="button"
                                    >
                                        + Add more files ({MAX_FILES - files.length} remaining)
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* TEMP SAFETY RAIL — reflects backend 25MB upload limit */}
                    <p className="text-xs text-muted text-center">
                        Maximum file size: 25MB per file • Up to {MAX_FILES} files
                    </p>

                    {/* Folder Selection (only when enabled and user has existing items) */}
                    {enableFolderSelection && hasExistingItems && (
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">
                                Upload to Folder
                            </label>
                            {loadingFolders ? (
                                <div className="text-muted text-sm py-4 text-center">Loading folders…</div>
                            ) : (
                                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 border border-white/10 rounded-xl p-3 bg-white/5">
                                    {/* Root option */}
                                    <button
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm text-white hover:bg-white/10 transition ${
                                            selectedFolderId === null ? "bg-white/10" : ""
                                        }`}
                                        onClick={() => setSelectedFolderId(null)}
                                    >
                                        <ArrowUpLeft size={16} className="text-teal" />
                                        <span>Root (All Files)</span>
                                    </button>
                                    {/* Folder options */}
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm text-white hover:bg-white/10 transition ${
                                                selectedFolderId === folder.id ? "bg-white/10" : ""
                                            }`}
                                        >
                                            <Folder size={16} className="text-teal" />
                                            <span className="truncate">{folder.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

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

                    {/* Upload Results */}
                    {uploadResults && (
                        <div className="space-y-2">
                            {uploadResults.successful.length > 0 && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                    <p className="text-green-400 text-sm font-medium mb-1">
                                        ✓ {uploadResults.successful.length} file{uploadResults.successful.length !== 1 ? 's' : ''} uploaded successfully
                                    </p>
                                </div>
                            )}
                            {uploadResults.failed.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <p className="text-red-400 text-sm font-medium mb-2">
                                        ✗ {uploadResults.failed.length} file{uploadResults.failed.length !== 1 ? 's' : ''} failed:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-red-300 text-xs">
                                        {uploadResults.failed.map((f, idx) => (
                                            <li key={idx}>
                                                {f.fileName || 'Unknown file'}: {f.error || 'Upload failed'}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
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
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading || isCompressing || files.some((f) => f.size > MAX_UPLOAD_SIZE)}
                        className="px-6 py-2 bg-teal hover:bg-teal-neon text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {(isUploading || isCompressing) ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                {isCompressing ? "Compressing..." : `Uploading ${files.length} file${files.length !== 1 ? 's' : ''}...`}
                            </>
                        ) : (
                            `Upload ${files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LibraryUploadModal;
