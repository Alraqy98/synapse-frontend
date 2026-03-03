import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";
import { Sidebar } from "../components/Sidebar";
import "../../../src/modules/Library/FileViewerV3.css";
import { MOCK_FILE_VIEWER } from "../staticData";

const ASTRARESPONSE = MOCK_FILE_VIEWER.chatMessages[1]?.text ??
  "Pallor in newborns indicates reduced skin perfusion — a sign of anemia, shock, or circulatory compromise. Plethora (ruddy appearance) suggests polycythemia with hematocrit >60%. Both findings require immediate clinical evaluation.";

const CHARS_PER_FRAME = 2;

export const Scene4FileViewer: React.FC<{ frame: number }> = ({ frame }) => {
  const sceneFade = interpolate(frame, [0, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const inputText = frame >= 650 ? (frame < 670 ? "explain".slice(0, Math.min(frame - 650, 7)) : "explain") : "";
  const showUserBubble = frame >= 670;
  const astraChars = Math.min(
    Math.floor((frame - 720) * CHARS_PER_FRAME),
    ASTRARESPONSE.length
  );
  const showAstraBubble = frame >= 720;
  const astraText = ASTRARESPONSE.slice(0, astraChars);
  const overlayOpacity = interpolate(
    frame,
    [750, 800],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const overlayFadeOut = frame >= 820 ? interpolate(frame, [820, 860], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const badgeOpacity = frame >= 820 ? interpolate(frame, [820, 860], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill
      style={{
        background: BRAND.background,
        fontFamily: "Inter, sans-serif",
        opacity: sceneFade,
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: 28,
          background: "#2d2d2d",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          gap: 8,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        <div
          style={{
            marginLeft: 24,
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          synapse-app.io/library/file/.../page/17
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar active="folder" />
        {/* Real FileViewerV3 layout + CSS; static data + frame-driven chat animation */}
        <div className="file-viewer-v3" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header className="file-viewer-toolbar">
            <div className="fv-toolbar-left">
              <button type="button" className="fv-tb-btn" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
              <div className="fv-tb-group fv-tb-page-nav">
                <span className="fv-tb-page-num"><span className="cur">{MOCK_FILE_VIEWER.file.currentPage}</span> / {MOCK_FILE_VIEWER.file.totalPages}</span>
              </div>
              <span className="fv-tb-filename" title={MOCK_FILE_VIEWER.file.name}>{MOCK_FILE_VIEWER.file.name.length > 35 ? MOCK_FILE_VIEWER.file.name.slice(0, 32) + "…" : MOCK_FILE_VIEWER.file.name}</span>
            </div>
            <div className="fv-toolbar-center">
              <span className="fv-tb-zoom">100%</span>
            </div>
          </header>

          <div className="file-viewer-body" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <aside className="thumb-strip">
              <div className="thumb-top">
                <div className="thumb-file-row">
                  <div className="thumb-file-name" title={MOCK_FILE_VIEWER.file.name}>{MOCK_FILE_VIEWER.file.name}</div>
                </div>
              </div>
              <div className="thumb-header-content">
                <div className="thumb-progress">
                  <div className="thumb-progress-fill" style={{ width: (MOCK_FILE_VIEWER.file.currentPage / MOCK_FILE_VIEWER.file.totalPages) * 100 }} />
                </div>
              </div>
              <div className="thumb-list">
                {[15, 16, 17, 18].map((n) => (
                  <div key={n} className={`thumb-item ${n === MOCK_FILE_VIEWER.file.currentPage ? "active" : ""}`}>
                    <div className="thumb-preview"><span style={{ fontSize: 10, color: "#666" }}>Pg {n}</span></div>
                    <div className="thumb-label"><span className="thumb-num">{n}</span></div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="main-area">
              <div className="pdf-canvas-wrap">
                <div className="pdf-page">
                  <div className="pdf-page-inner">
                    <div className="pdf-page-skeleton" style={{ padding: 32, color: "#333", fontSize: 14 }}>
                      <div style={{ fontWeight: 700, color: "#E55A4E", marginBottom: 8 }}>Pallor</div>
                      <div style={{ marginBottom: 16 }}>Suggests asphyxia, anemia, shock, or edema. Evaluate perfusion and hemoglobin.</div>
                      <div style={{ fontWeight: 700, color: "#E55A4E", marginBottom: 8 }}>Plethora</div>
                      <div>Ruddy appearance; hematocrit &gt;60% suggests polycythemia. Monitor for hyperviscosity.</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="status-bar">
                <div className="status-item"><span className="s-dot dot-green" /><span>Ready</span></div>
              </div>
            </main>

            <aside className="right-panel">
              <div className="rp-full">
                <div className="rp-header">
                  <div className="rp-tabs">
                    <button type="button" className="rp-tab active">Chat</button>
                    <button type="button" className="rp-tab">MCQ</button>
                    <button type="button" className="rp-tab">Cards</button>
                    <button type="button" className="rp-tab">Summary</button>
                    <button type="button" className="rp-tab">Stats</button>
                  </div>
                </div>
                <div className="tab-pane active">
                  <div className="rp-page-ctx">
                    <div className="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></div>
                    <div className="ctx-text">
                      <div className="ctx-label">Page</div>
                      <div className="ctx-value">{MOCK_FILE_VIEWER.file.currentPage} of {MOCK_FILE_VIEWER.file.totalPages}</div>
                    </div>
                  </div>
                  <div className="chat-msgs">
                    {!showUserBubble && !showAstraBubble && (
                      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 12 }}>No messages yet. Ask a question about this page.</div>
                    )}
                    {showUserBubble && (
                      <div className="chat-msg">
                        <div className="msg-avatar av-user">U</div>
                        <div className="msg-body">
                          <div className="msg-sender">You</div>
                          <div className="chat-bubble user">explain</div>
                        </div>
                      </div>
                    )}
                    {showAstraBubble && (
                      <div className="chat-msg">
                        <div className="msg-avatar av-ai">S</div>
                        <div className="msg-body">
                          <div className="msg-sender">Synapse</div>
                          <div className="chat-bubble">{astraText}{(frame - 720) * CHARS_PER_FRAME < ASTRARESPONSE.length && <span style={{ opacity: 0.7 }}>|</span>}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="chat-input-area">
                    <div className="scope-row" style={{ marginBottom: 6 }}>
                      <button type="button" className="scope-pill active">Page {MOCK_FILE_VIEWER.file.currentPage}</button>
                      <button type="button" className="scope-pill">Whole file</button>
                    </div>
                    <div className="chat-input-box">
                      <span style={{ flex: 1, color: inputText ? "var(--text-primary)" : "var(--text-muted)", fontSize: 13 }}>{inputText || "Ask about this page..."}</span>
                      <span style={{ color: "var(--green)" }}>→</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      {badgeOpacity > 0 && (
        <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", padding: "8px 12px", borderRadius: 999, border: `1px solid ${BRAND.primary}`, fontSize: 11, color: BRAND.textSecondary, opacity: badgeOpacity }}>Powered by prompt enhancement agent</div>
      )}

      {/* Overlay text */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "Syne, sans-serif",
          fontSize: 28,
          color: BRAND.textPrimary,
          opacity: overlayOpacity * overlayFadeOut,
        }}
      >
        Astra <span style={{ borderBottom: `2px solid ${BRAND.primary}` }}>sees your slide.</span> Answers like it&apos;s sitting next to you.
      </div>
    </AbsoluteFill>
  );
};
