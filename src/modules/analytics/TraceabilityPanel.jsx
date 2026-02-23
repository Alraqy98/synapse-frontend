import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function TraceabilityPanel({ primaryRiskEvidence, primaryConceptName }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileMap, setFileMap] = useState({}); // fileId -> { title }
  const [groupedEvidence, setGroupedEvidence] = useState({});

  useEffect(() => {
    if (!primaryRiskEvidence || primaryRiskEvidence.length === 0) {
      setLoading(false);
      return;
    }

    const fetchFileTitles = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract unique file IDs
        const uniqueFileIds = [...new Set(
          primaryRiskEvidence
            .map(item => item.source_file_id)
            .filter(Boolean)
        )];

        if (uniqueFileIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch file titles
        const response = await api.get("/api/learning/evidence-files", {
          params: { ids: uniqueFileIds.join(",") }
        });

        if (response.data?.success && response.data?.data) {
          // Build file map: fileId -> { title }
          const map = {};
          response.data.data.forEach(file => {
            map[file.id] = { title: file.title || "Untitled" };
          });
          setFileMap(map);

          // Group evidence by source_file_id
          const grouped = {};
          primaryRiskEvidence.forEach(item => {
            const fileId = item.source_file_id;
            if (!fileId) return;

            if (!grouped[fileId]) {
              grouped[fileId] = [];
            }
            grouped[fileId].push(item);
          });
          setGroupedEvidence(grouped);
        } else {
          setError("Failed to load file information");
        }
      } catch (err) {
        console.error("Failed to fetch evidence files:", err);
        setError(err.response?.data?.message || err.message || "Failed to load evidence sources");
      } finally {
        setLoading(false);
      }
    };

    fetchFileTitles();
  }, [primaryRiskEvidence]);

  const handlePageClick = (fileId, pageNumber) => {
    navigate(`/library/file/${fileId}?page=${pageNumber}`);
  };

  const totalAttempts = primaryRiskEvidence ? primaryRiskEvidence.length : 0;

  if (loading) {
    return (
      <div
        className="panel"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius)",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
          Loading evidence sources...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="panel"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius)",
          padding: "24px",
        }}
      >
        <div style={{ color: "#f87171", fontSize: "14px" }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!primaryRiskEvidence || primaryRiskEvidence.length === 0) {
    return null;
  }

  const fileIds = Object.keys(groupedEvidence);
  if (fileIds.length === 0) {
    return null;
  }

  return (
    <div
      className="panel"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}
        >
          Evidence Trail
        </div>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-main)",
            lineHeight: "1.4",
            marginBottom: "8px",
          }}
        >
          Why You're Struggling With{" "}
          <span style={{ color: "var(--teal)" }}>
            {primaryConceptName || "This Concept"}
          </span>
        </h3>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          {totalAttempts} incorrect {totalAttempts === 1 ? "attempt" : "attempts"} traced to source material
        </div>
      </div>

      {/* File Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {fileIds.map((fileId) => {
          const file = fileMap[fileId];
          const evidence = groupedEvidence[fileId];

          if (!file || !evidence) return null;

          return (
            <div
              key={fileId}
              style={{
                padding: "16px",
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              {/* File Title */}
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  marginBottom: "12px",
                }}
              >
                {file.title}
              </div>

              {/* Evidence Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {evidence.map((item, index) => {
                  const pages = Array.isArray(item.source_page_numbers)
                    ? item.source_page_numbers
                    : [];

                  return (
                    <div
                      key={index}
                      style={{
                        paddingLeft: "12px",
                        borderLeft: "2px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {/* Page Links */}
                      {pages.length > 0 && (
                        <div style={{ marginBottom: "6px" }}>
                          {pages.map((pageNum, pIndex) => (
                            <span key={pIndex}>
                              <button
                                onClick={() => handlePageClick(fileId, pageNum)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--teal)",
                                  fontFamily: "'DM Mono', 'Courier New', monospace",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  padding: "2px 4px",
                                  textDecoration: "none",
                                  transition: "text-decoration 0.2s",
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.textDecoration = "underline";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.textDecoration = "none";
                                }}
                              >
                                p. {pageNum}
                              </button>
                              {pIndex < pages.length - 1 && (
                                <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>
                                  •
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Question Preview */}
                      {item.question_text_preview && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            lineHeight: "1.5",
                            fontStyle: "italic",
                          }}
                        >
                          "{item.question_text_preview}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
