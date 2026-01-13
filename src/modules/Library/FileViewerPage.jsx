// src/modules/Library/FileViewerPage.jsx
// Wrapper component for FileViewer that handles routing and file loading

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import FileViewer from "./FileViewer";
import { getItemById } from "./apiLibrary";

const FileViewerPage = () => {
    const { fileId, pageNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load file on mount and when fileId changes
    useEffect(() => {
        if (!fileId) {
            navigate("/library");
            return;
        }

        const loadFile = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fileData = await getItemById(fileId);
                setFile(fileData);
            } catch (err) {
                console.error("Failed to load file:", err);
                setError(err);
                // Navigate back to library on error
                navigate("/library");
            } finally {
                setIsLoading(false);
            }
        };

        loadFile();
    }, [fileId, navigate]);

    // Handle back button - restore folder context from navigation state
    const handleBack = () => {
        const fromFolderPath = location.state?.fromFolderPath;
        navigate(fromFolderPath || "/library");
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-muted">Loading file...</div>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-red-500">Failed to load file</div>
            </div>
        );
    }

    return (
        <FileViewer
            file={file}
            onBack={handleBack}
            initialPage={pageNumber ? Number(pageNumber) : 1}
        />
    );
};

export default FileViewerPage;
