import React, { useState, useEffect, useRef, useMemo } from "react";
import "./FileViewerV3.css";
import {
  getFilePages,
  getAnnotations,
  putAnnotations,
  deleteAnnotations,
  getConceptMastery,
  getRecordings,
  createRecording,
  patchRecording,
  createRecordingTag,
  getRecordingTags,
} from "./apiLibrary";
import { uploadToSignedUrl } from "../../lib/uploadStorage";
import { sendMessageToTutor, createNewSession } from "../Tutor/apiTutor";
import api from "../../lib/api";

const id = (fileId, file) => fileId || file?.id || "";
const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pin-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);

// Seeded random for stable waveform bar heights (seed = string)
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < (seed || "").length; i++) h = (Math.imul(31, h) + (seed || "").charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(16807, h) + 1) | 0;
    return (Math.abs(h) % 10000) / 10000;
  };
}

export default function FileViewerV3({
  file = {},
  fileId: fileIdProp,
  initialPage = 1,
  onBack,
}) {
  const fileId = id(fileIdProp, file);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [pins, setPins] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [thumbCollapsed, setThumbCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [recordingMode, setRecordingMode] = useState("lecture");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [lectureRecording, setLectureRecording] = useState(null);
  const [slideNotes, setSlideNotes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [tutorMode, setTutorMode] = useState("page_locked");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conceptMastery, setConceptMastery] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [sessionId, setSessionId] = useState(() => {
    if (!fileId) return null;
    return localStorage.getItem(`synapse_file_session_${fileId}`) || null;
  });
  const [pinPopover, setPinPopover] = useState({ visible: false, xPct: 0, yPct: 0 });
  const [pinDraftText, setPinDraftText] = useState("");
  const [recordingTags, setRecordingTags] = useState([]);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const recordingTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const currentRecordingIdRef = useRef(null);
  const uploadPathRef = useRef(null);
  const uploadTokenRef = useRef(null);
  const recordingElapsedRef = useRef(0);
  const chunksRef = useRef([]);
  const notificationsRef = useRef(null);
  const pdfPageRef = useRef(null);
  const audioRef = useRef(null);
  const pinInputRef = useRef(null);

  // Load pages on mount
  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    getFilePages(fileId)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setPages(list);
        setTotalPages(list.length);
        setCurrentPage((p) =>
          initialPage >= 1 && initialPage <= list.length ? initialPage : Math.min(p, list.length || 1)
        );
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, initialPage]);

  // Sync URL with current page
  useEffect(() => {
    if (!fileId || !currentPage) return;
    const path = `/library/file/${fileId}/page/${currentPage}`;
    if (window.location.pathname !== path) {
      window.history.replaceState({}, "", path);
    }
  }, [fileId, currentPage]);

  // Load annotations when current page changes
  useEffect(() => {
    if (!fileId || !currentPage) {
      setPins([]);
      return;
    }
    let cancelled = false;
    getAnnotations(fileId, currentPage)
      .then(({ strokes }) => {
        if (cancelled) return;
        const list = strokes?.pins ? [...strokes.pins] : [];
        setPins(list);
      })
      .catch(() => {
        if (!cancelled) setPins([]);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, currentPage]);

  // Load concept mastery and recordings for right panel
  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    Promise.all([
      getConceptMastery(fileId).catch(() => []),
      getRecordings(fileId).catch(() => []),
    ]).then(([concepts, recs]) => {
      if (cancelled) return;
      setConceptMastery(Array.isArray(concepts) ? concepts : []);
      const list = Array.isArray(recs) ? recs : [];
      setLectureRecording(list.find((r) => r.type === "lecture") || null);
      setSlideNotes(list.filter((r) => r.type === "slide_note") || []);
    });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // Load recording tags when lecture recording exists
  useEffect(() => {
    const rec = lectureRecording;
    if (!rec?.id) {
      setRecordingTags([]);
      return;
    }
    let cancelled = false;
    getRecordingTags(rec.id)
      .then((tags) => {
        if (!cancelled) setRecordingTags(Array.isArray(tags) ? tags : []);
      })
      .catch(() => {
        if (!cancelled) setRecordingTags([]);
      });
    return () => { cancelled = true; };
  }, [lectureRecording?.id]);

  // Focus pin input when popover opens
  useEffect(() => {
    if (pinPopover.visible && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [pinPopover.visible]);

  // Init or load session for chat
  useEffect(() => {
    if (!fileId) return;
    const key = `synapse_file_session_${fileId}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      setSessionId(existing);
      return;
    }
    let cancelled = false;
    createNewSession(`File: ${file?.title || fileId}`)
      .then((s) => {
        if (cancelled) return;
        setSessionId(s.id);
        localStorage.setItem(key, s.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [fileId, file?.title]);

  // Notifications poll every 30s
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        const list = Array.isArray(data) ? data : data?.data || [];
        setNotifications(list.filter((n) => !n.read));
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClick = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notificationsOpen]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goToPage = (n) => setCurrentPage(Math.max(1, Math.min(totalPages || 1, Number(n))));

  const sendChat = async () => {
    const text = (chatInput || "").trim();
    if (!text || !fileId || !sessionId || isChatLoading) return;
    setChatInput("");
    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    setChatMessages((m) => [...m, userMsg]);
    setIsChatLoading(true);
    try {
      const { text: answer } = await sendMessageToTutor({
        sessionId,
        message: text,
        fileId,
        page: currentPage,
        tutorMode: tutorMode || "page_locked",
      });
      setChatMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: answer || "" }]);
    } catch (err) {
      setChatMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: `Error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const startRecording = async () => {
    if (!fileId || isRecording) return;
    try {
      const body = {
        type: recordingMode,
        ...(recordingMode === "slide_note" && { page_number: currentPage }),
      };
      const rec = await createRecording(fileId, body);
      const recId = rec?.id || rec?.recording?.id;
      uploadPathRef.current = rec?.upload_path || null;
      uploadTokenRef.current = rec?.upload_token || null;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const recIdFinal = currentRecordingIdRef.current;
        const elapsed = recordingElapsedRef.current;
        try {
          const path = uploadPathRef.current;
          const token = uploadTokenRef.current;
          if (path && blob.size > 0) {
            await uploadToSignedUrl(path, token, blob);
          }
          if (recIdFinal) {
            await patchRecording(recIdFinal, { duration_seconds: elapsed });
          }
        } catch (e) {
          console.error("Upload/patch recording failed:", e);
        }
        uploadPathRef.current = null;
        uploadTokenRef.current = null;
        getRecordings(fileId).then((list) => {
          setLectureRecording(list.find((r) => r.type === "lecture") || null);
          setSlideNotes(list.filter((r) => r.type === "slide_note") || []);
        });
      };
      mediaRecorderRef.current = mr;
      mr.start(1000);
      currentRecordingIdRef.current = recId;
      setIsRecording(true);
      setRecordingElapsed(0);
      setActiveTab("recordings");
      setRightCollapsed(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingElapsed((e) => {
          const next = e + 1;
          recordingElapsedRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Start recording failed:", err);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    currentRecordingIdRef.current = null;
    mediaRecorderRef.current = null;
  };
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const addTapTag = async () => {
    const recId = currentRecordingIdRef.current;
    if (!recId || !isRecording) return;
    const label = window.prompt("Tag label:", "");
    if (!label) return;
    try {
      await createRecordingTag(recId, {
        label,
        timestamp_seconds: recordingElapsed,
        page_number: currentPage,
      });
      const tags = await getRecordingTags(recId);
      setRecordingTags(Array.isArray(tags) ? tags : []);
    } catch (e) {
      console.error("Add tag failed:", e);
    }
  };

  const handlePdfPageClick = (e) => {
    if (e.target.closest(".annotation-pin") || e.target.closest(".ann-input-popup")) return;
    const el = pdfPageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const xPct = Math.max(0, Math.min(100, x * 100));
    const yPct = Math.max(0, Math.min(100, y * 100));
    setPinPopover({ visible: true, xPct, yPct });
    setPinDraftText("");
  };

  const savePin = async () => {
    const text = (pinDraftText || "").trim();
    if (!text || !fileId || currentPage == null) return;
    const { xPct, yPct } = pinPopover;
    setPinPopover((p) => ({ ...p, visible: false }));
    setPinDraftText("");
    const newPin = {
      id: uuid(),
      x: xPct,
      y: yPct,
      text,
      created_at: new Date().toISOString(),
    };
    const nextPins = [...pins, newPin];
    setPins(nextPins);
    try {
      await putAnnotations(fileId, currentPage, { pins: nextPins });
    } catch (err) {
      console.error("Save pin failed:", err);
      setPins(pins);
    }
  };

  const cancelPin = () => {
    setPinPopover((p) => ({ ...p, visible: false }));
    setPinDraftText("");
  };

  const deletePin = async (pinId) => {
    if (!fileId || currentPage == null) return;
    const nextPins = pins.filter((p) => p.id !== pinId);
    setPins(nextPins);
    try {
      if (nextPins.length > 0) {
        await putAnnotations(fileId, currentPage, { pins: nextPins });
      } else {
        await deleteAnnotations(fileId, currentPage);
      }
    } catch (err) {
      console.error("Delete pin failed:", err);
      setPins(pins);
    }
  };

  const lectureDuration = lectureRecording?.duration_seconds ?? audioDuration || 1;
  const waveformBars = useMemo(() => {
    const rand = seededRandom(lectureRecording?.id ?? "wave");
    return Array.from({ length: 80 }, () => 10 + rand() * 80);
  }, [lectureRecording?.id]);

  const seekWaveform = (e) => {
    const wrap = e.currentTarget;
    const rect = wrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * lectureDuration;
    setAudioCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const seekToTag = (tag) => {
    const time = tag.timestamp_seconds ?? 0;
    setAudioCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    if (tag.page_number != null) goToPage(tag.page_number);
  };

  const togglePlayLecture = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingAudio) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setAudioCurrentTime(audio.currentTime);
    const onDurationChange = () => setAudioDuration(audio.duration || 0);
    const onEnded = () => setIsPlayingAudio(false);
    const onPlay = () => setIsPlayingAudio(true);
    const onPause = () => setIsPlayingAudio(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [lectureRecording?.id]);

  const pageIndicators = (() => {
    const weak = {};
    const strong = {};
    (conceptMastery || []).forEach((c, idx) => {
      const fromMcq = Array.isArray(c.mcq_questions)
        ? c.mcq_questions.map((q) => q.source_page ?? q.page_number).filter((p) => p != null)
        : [];
      const pages =
        fromMcq.length > 0
          ? fromMcq
          : c.source_pages ?? (c.page_number != null ? [c.page_number] : [idx + 1]);
      const decay = c.decay_risk ?? 0;
      const mastery = c.mastery_level ?? c.rolling_accuracy ?? 0;
      pages.forEach((p) => {
        const pageNum = Number(p);
        if (decay > 0.6) weak[pageNum] = true;
        if (mastery >= 4 || (mastery <= 1 && mastery >= 0.8)) strong[pageNum] = true;
      });
    });
    return { weak, strong };
  })();
  const currentPageData = pages[currentPage - 1];
  const pageImageUrl = currentPageData?.image_url || currentPageData?.image_path || null;
  const title = file?.title || "Document";

  return (
    <div
      className="file-viewer-v3"
      style={{
        height: "100%",
        display: "flex",
        overflow: "hidden",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* Nav sidebar */}
      <nav className="nav-sidebar">
        <div
          className="nav-logo"
          role="button"
          tabIndex={0}
          onClick={onBack}
          onKeyDown={(e) => e.key === "Enter" && onBack?.()}
          style={{
            background: "transparent",
            boxShadow: "none",
            width: 38,
            height: 38,
            marginBottom: 10,
          }}
        >
          <svg viewBox="0 0 40 40" fill="none" width="38" height="38">
            <path
              d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
              fill="none"
              stroke="var(--green)"
              strokeWidth="2"
            />
            <text
              x="50%"
              y="53%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="var(--green)"
              fontSize="15"
              fontWeight="700"
              fontFamily="DM Sans, sans-serif"
            >
              S
            </text>
          </svg>
        </div>
        <div
          className="nav-icon active"
          title="Library"
          role="button"
          tabIndex={0}
          onClick={onBack}
          onKeyDown={(e) => e.key === "Enter" && onBack?.()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </div>
        <div className="nav-spacer" />
        <div className="nav-icon" ref={notificationsRef} style={{ position: "relative" }}>
          <button
            type="button"
            title="Notifications"
            onClick={() => setNotificationsOpen((o) => !o)}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#fc8181",
                  border: "1.5px solid var(--bg-base)",
                }}
              />
            )}
          </button>
          {notificationsOpen && (
            <div
              style={{
                position: "fixed",
                left: 64,
                bottom: 52,
                width: 288,
                background: "#1a1a20",
                border: "1px solid var(--border-mid)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 14px 8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Notifications</span>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.patch("/api/notifications/read-all", { read: true });
                        setNotifications([]);
                      } catch {}
                    }}
                    style={{
                      fontSize: 9,
                      fontFamily: "DM Mono, monospace",
                      color: "var(--green)",
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                    }}
                  >
                    MARK ALL READ
                  </button>
                )}
              </div>
              <div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "10px 14px", fontSize: 11.5, color: "var(--text-muted)" }}>
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={async () => {
                        try {
                          await api.patch(`/api/notifications/${n.id}/read`, { read: true });
                          setNotifications((prev) => prev.filter((x) => x.id !== n.id));
                        } catch {}
                      }}
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        borderBottom: "1px solid var(--border)",
                        background: !n.read ? "rgba(0,229,160,0.03)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: !n.read ? "#fc8181" : "var(--text-muted)",
                          marginTop: 5,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 11.5, color: "var(--text-primary)", lineHeight: 1.4 }}>
                          {n.title || n.message || "Notification"}
                        </div>
                        <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "DM Mono, monospace", marginTop: 2 }}>
                          {n.description || n.body || ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Thumbnail strip */}
      <aside className={`thumb-strip ${thumbCollapsed ? "collapsed" : ""}`}>
        <div className="thumb-top">
          <span className="thumb-top-title">Pages</span>
          <button
            type="button"
            className="collapse-btn"
            onClick={() => setThumbCollapsed((c) => !c)}
            title={thumbCollapsed ? "Expand" : "Collapse"}
            aria-label={thumbCollapsed ? "Expand" : "Collapse"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        <div className="thumb-header-content">
          <div className="thumb-file-row">
            <button
              type="button"
              className="thumb-back"
              onClick={onBack}
              aria-label="Back to library"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="thumb-file-name" title={title}>
              {title}
            </div>
          </div>
          <div className="thumb-progress">
            <div
              className="thumb-progress-fill"
              style={{ width: totalPages ? (currentPage / totalPages) * 100 : 0 }}
            />
          </div>
        </div>
        <div className="thumb-list">
          {pages.map((page, idx) => {
            const num = page.page_number ?? idx + 1;
            const isActive = num === currentPage;
            const isWeak = pageIndicators.weak[num];
            const isStrong = pageIndicators.strong[num];
            return (
              <button
                type="button"
                key={page.id ?? `page-${idx}`}
                className={`thumb-item ${isActive ? "active" : ""}`}
                onClick={() => setCurrentPage(num)}
              >
                <div className="thumb-preview">
                  {isWeak && <div className="thumb-weak weak-red" title="Weak" />}
                  {isStrong && !isWeak && (
                    <div
                      className="thumb-weak"
                      style={{ background: "var(--green)", top: 3, right: 3, width: 8, height: 8, borderRadius: "50%", position: "absolute" }}
                      title="Strong"
                    />
                  )}
                  {page.image_url || page.image_path ? (
                    <img
                      src={page.image_url || page.image_path}
                      alt={`Page ${num}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        ...(isStrong && !isWeak ? { boxShadow: "inset 0 0 0 2px rgba(0,229,160,0.3)" } : {}),
                        ...(isWeak ? { boxShadow: "inset 0 0 0 2px rgba(252,129,129,0.3)" } : {}),
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 10, color: "#666" }}>Pg {num}</span>
                  )}
                </div>
                <div className="thumb-label">
                  <span className="thumb-num">{num}</span>
                  <span className="thumb-dot" />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main area */}
      <main className="main-area">
        <div className="toolbar">
          <div className="toolbar-group">
            <button
              type="button"
              className="tb-icon-btn"
              onClick={goPrev}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="tb-icon-btn"
              onClick={goNext}
              disabled={currentPage >= totalPages || totalPages === 0}
              aria-label="Next page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div className="toolbar-divider" />
          <div className="page-indicator">
            <span className="cur">{currentPage}</span>
            <span> / {totalPages || 0}</span>
          </div>
          <div className="toolbar-divider" />
          {isRecording ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "3px 10px",
                background: "rgba(252,129,129,0.1)",
                border: "1px solid rgba(252,129,129,0.25)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#fc8181",
                  animation: "rec-blink 1s infinite",
                }}
              />
              <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "#fc8181" }}>
                {recordingMode === "lecture" ? "LECTURE" : "SLIDE NOTE"}
              </span>
              <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "var(--text-muted)" }}>
                {formatTime(recordingElapsed)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                style={{
                  marginLeft: 4,
                  height: 20,
                  padding: "0 7px",
                  borderRadius: 4,
                  border: "1px solid rgba(252,129,129,0.4)",
                  background: "transparent",
                  color: "#fc8181",
                  fontSize: 10,
                  fontFamily: "DM Mono, monospace",
                  cursor: "pointer",
                }}
              >
                STOP
              </button>
              {recordingMode === "lecture" && (
                <button
                  type="button"
                  onClick={addTapTag}
                  style={{
                    height: 20,
                    padding: "0 7px",
                    borderRadius: 4,
                    border: "1px solid rgba(0,229,160,0.3)",
                    background: "var(--green-dim)",
                    color: "var(--green)",
                    fontSize: 10,
                    fontFamily: "DM Mono, monospace",
                    cursor: "pointer",
                  }}
                >
                  TAP TAG
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`tb-btn ${recordingMode === "lecture" ? "active" : ""}`}
                onClick={() => setRecordingMode("lecture")}
                title="Record lecture"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Lecture
              </button>
              <button
                type="button"
                className={`tb-btn ${recordingMode === "slide_note" ? "active" : ""}`}
                onClick={() => setRecordingMode("slide_note")}
                title="Slide note"
              >
                Slide Note
              </button>
              <button type="button" className="tb-btn" onClick={startRecording} title="Start recording">
                Record
              </button>
            </>
          )}
          <div className="toolbar-spacer" />
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="pdf-canvas-wrap">
          <div
            ref={pdfPageRef}
            className="pdf-page"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
            onClick={handlePdfPageClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handlePdfPageClick(e)}
          >
            {pageImageUrl ? (
              <img
                src={pageImageUrl}
                alt={`Page ${currentPage}`}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  padding: 48,
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                Page {currentPage}
              </div>
            )}
            {pins.map((pin, pinIdx) => (
              <div
                key={pin.id || `${pin.x}-${pin.y}-${pinIdx}`}
                className="annotation-pin"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pin-dot pin-green" style={{ position: "relative" }}>
                  {pinIdx + 1}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePin(pin.id);
                    }}
                    aria-label="Delete pin"
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "#fc8181",
                      border: "none",
                      color: "#0a0a0c",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
                {pin.text && <div className="pin-note">{pin.text}</div>}
              </div>
            ))}
            {pinPopover.visible && (
              <div
                className="ann-input-popup visible"
                style={{
                  left: `${Math.min(pinPopover.xPct, 85)}%`,
                  top: `${Math.max(0, pinPopover.yPct - 12)}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  ref={pinInputRef}
                  rows={3}
                  placeholder="Add a note…"
                  value={pinDraftText}
                  onChange={(e) => setPinDraftText(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && cancelPin()}
                  className="file-viewer-v3-ann-input"
                />
                <div className="ann-input-actions">
                  <button type="button" className="ann-save-btn" onClick={savePin}>
                    Save
                  </button>
                  <button type="button" className="ann-cancel-btn" onClick={cancelPin}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="status-bar">
          <div className="status-item">
            <span className="s-dot dot-green" />
            <span>Ready</span>
          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside className={`right-panel ${rightCollapsed ? "collapsed" : ""}`}>
        {rightCollapsed ? (
          <div className="rp-collapsed-strip">
            <button
              type="button"
              className="rp-expand-btn"
              onClick={() => setRightCollapsed(false)}
              aria-label="Expand panel"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              type="button"
              className={`rp-strip-icon ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => {
                setRightCollapsed(false);
                setActiveTab("chat");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </button>
            <button
              type="button"
              className={`rp-strip-icon ${activeTab === "performance" ? "active" : ""}`}
              onClick={() => {
                setRightCollapsed(false);
                setActiveTab("performance");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
            <button
              type="button"
              className={`rp-strip-icon ${activeTab === "recordings" ? "active" : ""}`}
              onClick={() => {
                setRightCollapsed(false);
                setActiveTab("recordings");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="rp-full">
            <div className="rp-header">
              <div className="rp-tabs">
                <button
                  type="button"
                  className={`rp-tab ${activeTab === "chat" ? "active" : ""}`}
                  onClick={() => setActiveTab("chat")}
                >
                  Chat
                </button>
                <button
                  type="button"
                  className={`rp-tab ${activeTab === "performance" ? "active" : ""}`}
                  onClick={() => setActiveTab("performance")}
                >
                  Performance
                </button>
                <button
                  type="button"
                  className={`rp-tab ${activeTab === "recordings" ? "active" : ""}`}
                  onClick={() => setActiveTab("recordings")}
                >
                  Recordings
                </button>
              </div>
              <button
                type="button"
                className="rp-collapse-btn"
                onClick={() => setRightCollapsed(true)}
                aria-label="Collapse panel"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Chat tab */}
            <div className={`tab-pane ${activeTab === "chat" ? "active" : ""}`}>
              <div className="rp-page-ctx">
                <div className="ctx-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="ctx-text">
                  <div className="ctx-label">Page</div>
                  <div className="ctx-value">{currentPage} of {totalPages || 0}</div>
                </div>
              </div>
              <div className="chat-msgs">
                {chatMessages.length === 0 ? (
                  <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 12 }}>
                    No messages yet. Ask a question about this page.
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="chat-msg">
                      <div className={`msg-avatar ${msg.role === "user" ? "av-user" : "av-ai"}`}>
                        {msg.role === "user" ? "U" : "S"}
                      </div>
                      <div className="msg-body">
                        <div className="msg-sender">{msg.role === "user" ? "You" : "Synapse"}</div>
                        <div className={`chat-bubble ${msg.role === "user" ? "user" : ""}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="chat-input-area">
                <div className="scope-row" style={{ marginBottom: 6 }}>
                  <button
                    type="button"
                    className={`scope-pill ${tutorMode === "page_locked" ? "active" : ""}`}
                    onClick={() => setTutorMode("page_locked")}
                  >
                    Page {currentPage}
                  </button>
                  <button
                    type="button"
                    className={`scope-pill ${tutorMode === "open" ? "active" : ""}`}
                    onClick={() => setTutorMode("open")}
                  >
                    Whole file
                  </button>
                </div>
                <div className="chat-input-box">
                  <textarea
                    placeholder="Ask about this page..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChat())}
                    aria-label="Chat input"
                    rows={1}
                  />
                  <button
                    type="button"
                    className="send-btn"
                    aria-label="Send"
                    disabled={!chatInput.trim() || isChatLoading || !sessionId}
                    onClick={sendChat}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Performance tab */}
            <div className={`tab-pane ${activeTab === "performance" ? "active" : ""}`}>
              <div className="perf-pane-inner">
                {conceptMastery.length === 0 ? (
                  <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 12 }}>
                    No concept data yet for this file.
                  </div>
                ) : (
                  <div className="concept-list">
                    {conceptMastery.map((c) => {
                      const score = typeof c.rolling_accuracy === "number"
                        ? c.rolling_accuracy
                        : typeof c.mastery_level === "number"
                          ? c.mastery_level
                          : 0;
                      const scorePct = Math.min(100, Math.max(0, score <= 1 ? score * 100 : score));
                      const scoreClass = scorePct >= 70 ? "green" : scorePct >= 40 ? "yellow" : "red";
                      return (
                        <div key={c.concept_id || c.id || c.concept_name} className="concept-row">
                          <div className="concept-header">
                            <span className="concept-name">{c.concept_name || c.name}</span>
                            <span className={`concept-score score-${scoreClass}`}>
                              {Math.round(scorePct)}%
                            </span>
                          </div>
                          <div className="concept-bar">
                            <div
                              className={`concept-bar-fill bar-${scoreClass}`}
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                          {c.decay_risk != null && (
                            <div className="concept-meta" style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                              Decay risk: {typeof c.decay_risk === "number" ? (c.decay_risk * 100).toFixed(0) : c.decay_risk}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recordings tab */}
            <div className={`tab-pane ${activeTab === "recordings" ? "active" : ""}`}>
              <div className="rec-pane-inner">
                <div className="rec-mode-toggle">
                  <button
                    type="button"
                    className={`rec-mode-btn ${recordingMode === "lecture" ? "active" : ""}`}
                    onClick={() => setRecordingMode("lecture")}
                  >
                    Lecture
                  </button>
                  <button
                    type="button"
                    className={`rec-mode-btn ${recordingMode === "slide_note" ? "active" : ""}`}
                    onClick={() => setRecordingMode("slide_note")}
                  >
                    Slide note
                  </button>
                </div>
                {!lectureRecording && slideNotes.length === 0 ? (
                  <div className="rec-empty">
                    No recordings yet. Start a lecture or add a slide note.
                  </div>
                ) : (
                  <>
                    {lectureRecording && (
                      <div className="lecture-rec-card">
                        <audio
                          ref={audioRef}
                          src={lectureRecording.playback_url || lectureRecording.storage_path || undefined}
                          preload="metadata"
                          onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                        />
                        <div className="lecture-rec-header">
                          <button
                            type="button"
                            className="rec-play-btn"
                            aria-label={isPlayingAudio ? "Pause" : "Play"}
                            onClick={togglePlayLecture}
                            disabled={!lectureRecording.playback_url && !lectureRecording.storage_path}
                          >
                            {isPlayingAudio ? (
                              <svg viewBox="0 0 24 24" fill="#0a0a0c">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="#0a0a0c">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            )}
                          </button>
                          <div>
                            <div className="rec-title">Lecture recording</div>
                            <div className="rec-meta">
                              {lectureRecording.created_at
                                ? new Date(lectureRecording.created_at).toLocaleDateString()
                                : ""}
                            </div>
                          </div>
                          <span className="rec-duration">
                            {lectureRecording.duration_seconds
                              ? formatTime(Math.floor(lectureRecording.duration_seconds))
                              : `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, "0")}`}
                          </span>
                        </div>
                        <div className="rec-waveform-wrap" style={{ position: "relative" }}>
                          <div
                            className="rec-waveform"
                            onClick={seekWaveform}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && seekWaveform(e)}
                            aria-label="Seek waveform"
                          >
                            {waveformBars.map((barPct, i) => {
                              const pct = (i / 80) * 100;
                              const played = lectureDuration > 0 && (audioCurrentTime / lectureDuration) * 100 >= pct;
                              const head = lectureDuration > 0 && (audioCurrentTime / lectureDuration) * 100 >= pct && (audioCurrentTime / lectureDuration) * 100 < pct + (100 / 80);
                              return (
                                <div
                                  key={i}
                                  className={`wav-bar ${played ? "played" : ""} ${head ? "head" : ""}`}
                                  style={{ height: `${barPct}%` }}
                                />
                              );
                            })}
                          </div>
                          <div
                            className="rec-progress-line"
                            style={{
                              left: `${lectureDuration > 0 ? (audioCurrentTime / lectureDuration) * 100 : 0}%`,
                            }}
                          />
                          {recordingTags.map((tag) => {
                            const pct = lectureDuration > 0 ? ((tag.timestamp_seconds ?? 0) / lectureDuration) * 100 : 0;
                            const color = tag.color || "#f6e05e";
                            return (
                              <div
                                key={tag.id}
                                className="tap-marker"
                                style={{
                                  left: `${pct}%`,
                                  height: 26,
                                  background: color,
                                  transform: "translateX(-1px)",
                                }}
                                data-label={tag.label}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  seekToTag(tag);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && seekToTag(tag)}
                                title={tag.label}
                              />
                            );
                          })}
                        </div>
                        <div className="rec-tags">
                          <div style={{ fontSize: "9px", fontFamily: "DM Mono, monospace", color: "var(--text-muted)", marginBottom: 3, letterSpacing: "0.05em" }}>
                            TAP MARKERS
                          </div>
                          {recordingTags.map((tag) => (
                            <div
                              key={tag.id}
                              className="rec-tag-item"
                              onClick={() => seekToTag(tag)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === "Enter" && seekToTag(tag)}
                              style={tag.color ? { borderLeft: `2px solid ${tag.color}` } : {}}
                            >
                              <span className="rec-tag-time" style={tag.color ? { color: tag.color } : {}}>
                                {formatTime(Math.floor(tag.timestamp_seconds ?? 0))}
                              </span>
                              <span className="rec-tag-label">{tag.label}</span>
                              <span className="rec-tag-page">p.{tag.page_number ?? "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {slideNotes.map((sn) => (
                      <div
                        key={sn.id}
                        className="slide-note-card"
                        onClick={() => goToPage(sn.page_number)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && goToPage(sn.page_number)}
                      >
                        <span className="slide-note-page">p.{sn.page_number ?? "—"}</span>
                        <div className="slide-note-info">
                          <div className="slide-note-title">{sn.title || "Slide note"}</div>
                          <div className="slide-note-sub">Page {sn.page_number ?? "—"}</div>
                        </div>
                        <span className="slide-note-duration">
                          {sn.duration_seconds
                            ? formatTime(Math.floor(sn.duration_seconds))
                            : "0:00"}
                        </span>
                        <button
                          type="button"
                          className="slide-note-play"
                          aria-label="Play"
                          onClick={(e) => e.stopPropagation()}
                          disabled
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
