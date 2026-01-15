// src/modules/admin/pages/AdminFiles.jsx
import React, { useState, useEffect } from "react";
import { getAdminFiles } from "../apiAdmin";

const AdminFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const filesData = await getAdminFiles();
        setFiles(filesData);
      } catch (err) {
        console.error("Failed to fetch files:", err);
        setError(err.message || "Failed to load files");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    if (statusLower === "completed") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-teal/20 text-teal border border-teal/30">
          Completed
        </span>
      );
    }
    
    if (statusLower === "pending") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          Pending
        </span>
      );
    }
    
    if (statusLower === "failed") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
          Failed
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-white/10 text-muted border border-white/10">
        {status || "—"}
      </span>
    );
  };

  // TODO: Implement retry action
  const handleRetry = (fileId) => {
    console.log("Retry file processing:", fileId);
    // TODO: Call retry API endpoint
  };

  // TODO: Implement delete action
  const handleDelete = (fileId) => {
    console.log("Delete file:", fileId);
    // TODO: Call delete API endpoint
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">File Processing</h1>
          <p className="text-sm text-muted">Monitor and manage uploaded files</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">Loading files…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && files.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">No files found</p>
          </div>
        )}

        {/* Files Table */}
        {!loading && !error && files.length > 0 && (
          <div className="bg-[#1a1d24] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      File name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Uploaded by
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Upload date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Render status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      OCR status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {file.file_name || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {file.user_email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {formatDate(file.uploaded_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(file.render_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(file.ocr_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* TODO: Add pagination controls here when implementing pagination */}
                          {(file.render_status?.toLowerCase() === "failed" || 
                            file.ocr_status?.toLowerCase() === "failed") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(file.id);
                              }}
                              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded transition-colors"
                              disabled
                            >
                              Retry
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id);
                            }}
                            className="px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded transition-colors"
                            disabled
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* TODO: Add pagination component here when implementing pagination */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFiles;
