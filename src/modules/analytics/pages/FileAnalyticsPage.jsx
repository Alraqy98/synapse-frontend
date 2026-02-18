import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../lib/api";

const FileAnalyticsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode") || "file";

    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState("");
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await api.get("/api/library");
                const items = response.data.data || [];
                
                const fileItems = items.filter(item => item.file_type === "application/pdf");
                setFiles(fileItems);

                const uniqueFolders = [...new Set(items.map(item => item.parent_id).filter(Boolean))];
                setFolders(uniqueFolders);
            } catch (err) {
                console.error("Failed to fetch library:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, []);

    const handleAnalyze = async () => {
        if (!selectedId) return;

        setAnalyzing(true);
        try {
            console.log(`Analyzing ${mode}:`, selectedId);
            // TODO: Call backend to analyze file/folder
            
            setTimeout(() => {
                navigate("/analytics");
            }, 1000);
        } catch (err) {
            console.error("Failed to analyze:", err);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-2 text-muted hover:text-white transition"
            >
                <ArrowLeft size={18} />
                <span>Back to Analytics</span>
            </button>

            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    {mode === "folder" ? "Folder Analytics" : "File Analytics"}
                </h1>
                <p className="text-muted">
                    Track performance by {mode === "folder" ? "folder grouping" : "individual file"}.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Select {mode === "folder" ? "Folder" : "File"}
                </h2>

                {loading ? (
                    <p className="text-muted">Loading library...</p>
                ) : mode === "file" && files.length === 0 ? (
                    <p className="text-muted">No files available. Upload documents first.</p>
                ) : mode === "folder" && folders.length === 0 ? (
                    <p className="text-muted">No folders found in library.</p>
                ) : (
                    <>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white outline-none focus:border-teal transition mb-4"
                        >
                            <option value="">-- Select a {mode} --</option>
                            {mode === "file" 
                                ? files.map((file) => (
                                    <option key={file.id} value={file.id}>
                                        {file.title}
                                    </option>
                                ))
                                : folders.map((folder, idx) => (
                                    <option key={idx} value={folder}>
                                        Folder: {folder}
                                    </option>
                                ))
                            }
                        </select>

                        <button
                            onClick={handleAnalyze}
                            disabled={!selectedId || analyzing}
                            className="w-full bg-teal hover:bg-teal-600 disabled:bg-white/10 disabled:text-muted text-black font-semibold py-3 rounded-lg transition"
                        >
                            {analyzing ? "Analyzing..." : "Analyze"}
                        </button>

                        {selectedId && (
                            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-sm text-blue-400">
                                    Analysis will check if MCQ decks exist referencing this {mode}.
                                    If not, you'll need to generate questions first.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FileAnalyticsPage;
