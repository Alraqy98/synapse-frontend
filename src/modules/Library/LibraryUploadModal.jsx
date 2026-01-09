// src/modules/Library/LibraryUploadModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, File, Loader2, Folder, ArrowUpLeft } from "lucide-react";
import { uploadLibraryFile, getAllFolders, getLibraryItems } from "./apiLibrary";
import { compressImageIfNeeded, validateFileForUpload, isImageFile, isPdfFile } from "../../lib/fileCompression";
import { compressPdfFile } from "./utils/compressPdf";
import { getUploadErrorMessage } from "./utils/uploadErrorMessages";

// TEMP SAFETY RAIL — mirrors backend 25MB upload limit
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25MB in bytes

const LibraryUploadModal = ({ onClose, onUploadSuccess, parentFolderId = null, enableFolderSelection = false }) => {
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState("Lecture");
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [error, setError] = useState(null);
    const [compressionInfo, setCompressionInfo] = useState(null);
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
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setError(null);
            setCompressionInfo(null);
            
            // TEMP SAFETY RAIL — mirrors backend 25MB upload limit
            if (selectedFile.size > MAX_UPLOAD_SIZE) {
                setError('Maximum file size is 25MB.');
                setFile(null);
                // Clear file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            
            // TEMP EXPERIMENT — size limits disabled to observe render cost
            // Files ≤ 25MB are accepted unconditionally
            
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        // TEMP SAFETY RAIL — mirrors backend 25MB upload limit
        if (file.size > MAX_UPLOAD_SIZE) {
            setError('Maximum file size is 25MB.');
            return;
        }

        // TEMP EXPERIMENT — size limits disabled to observe render cost
        // Compression is attempted but not required - upload proceeds even if compression fails

        setIsUploading(true);
        setError(null);
        
        try {
            let fileToUpload = file;
            const validation = validateFileForUpload(file);
            
            // OPTIONAL: Attempt to compress images that are > 3MB (non-blocking)
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
                    // Compression failed - use original file, don't block upload
                    console.warn("Image compression failed, using original file:", compressionError);
                    fileToUpload = file;
                    setCompressionInfo(null);
                } finally {
                    setIsCompressing(false);
                }
            }
            
            // OPTIONAL: Attempt to compress PDFs that are > 3MB (non-blocking)
            if (validation.canCompress && isPdfFile(file) && file.type === "application/pdf") {
                setIsCompressing(true);
                setCompressionProgress(0);
                
                try {
                    const originalSize = file.size;
                    setCompressionProgress(50);
                    
                    const compressedFile = await compressPdfFile(file, 3 * 1024 * 1024);
                    
                    setCompressionProgress(100);
                    fileToUpload = compressedFile;
                    setCompressionInfo({
                        wasCompressed: compressedFile.size < originalSize,
                        originalSize: originalSize,
                        compressedSize: compressedFile.size
                    });
                } catch (compressionError) {
                    // Compression failed - use original file, don't block upload
                    console.warn("PDF compression failed, using original file:", compressionError);
                    fileToUpload = file;
                    setCompressionInfo(null);
                } finally {
                    setIsCompressing(false);
                }
            }
            
            // TEMP EXPERIMENT — no size validation, upload proceeds regardless of file size
            // Upload the file (compressed or original)
            // Use selectedFolderId if folder selection is enabled, otherwise use parentFolderId prop
            const targetFolderId = enableFolderSelection ? selectedFolderId : parentFolderId;
            await uploadLibraryFile(fileToUpload, category, targetFolderId);
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
                                    {file.size > 3 * 1024 * 1024 && (
                                        <p className="text-yellow-400 text-xs">
                                            Large files may take longer to process
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={40} className="text-muted mb-4" />
                                <p className="font-medium text-white">Click to upload</p>
                                <p className="text-sm text-muted mt-1">
                                    PDF, Images, DOC, DOCX, PPT, PPTX, TXT
                                </p>
                            </>
                        )}
                    </div>

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
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading || isCompressing || (file && file.size > MAX_UPLOAD_SIZE)}
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
