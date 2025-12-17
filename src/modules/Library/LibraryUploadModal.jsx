// src/modules/Library/LibraryUploadModal.jsx
import React, { useState, useRef } from "react";
import { X, UploadCloud, File } from "lucide-react";
import { uploadLibraryFile } from "./apiLibrary";

const LibraryUploadModal = ({ onClose, onUploadSuccess, parentFolderId = null }) => {
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState("Lecture");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            await uploadLibraryFile(file, category, parentFolderId);
            onUploadSuccess();
            onClose();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
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
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                        />

                        {file ? (
                            <>
                                <File size={40} className="text-teal mb-4" />
                                <p className="font-medium text-white">{file.name}</p>
                                <p className="text-sm text-muted mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={40} className="text-muted mb-4" />
                                <p className="font-medium text-white">Click to upload</p>
                                <p className="text-sm text-muted mt-1">
                                    PDF, DOC, DOCX, PPT, PPTX, TXT (Max 50MB)
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
                        disabled={!file || isUploading}
                        className="px-6 py-2 bg-teal hover:bg-teal-neon text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isUploading ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LibraryUploadModal;
