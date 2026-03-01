import React, { useState, useEffect, useRef, useMemo } from "react";
import "./FileViewerV3.css";
import {
  getFilePages,
  apiFetch,
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
const id = (fileId, file) => fileId || file?.id || "";
const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pin-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);

// Resolve image URL: signed Supabase (https) use as-is; render URLs fetch with auth → blob URL
async function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("https://")) return url;
  try {
    const res = await apiFetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

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
  const [pinPopover, setPinPopover] = useState({ visible: false, xPct: 0, yPct: 0, pageNumber: null });
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
  const pdfCanvasWrapRef = useRef(null);
  const pageRefs = useRef({});
  const audioRef = useRef(null);
  const pinInputRef = useRef(null);

  // Load pages on mount and resolve image URLs (signed vs render)
  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    getFilePages(fileId)
      .then(async (list) => {
        if (cancelled) return;
        const pagesList = Array.isArray(list) ? list : [];
        const resolved = await Promise.all(
          pagesList.map(async (p) => ({
            ...p,
            resolved_url: await resolveImageUrl(p.image_url),
          }))
        );
        if (cancelled) return;
        setPages(resolved);
        setTotalPages(resolved.length);
        setCurrentPage((p) =>
          initialPage >= 1 && initialPage <= resolved.length ? initialPage : Math.min(p, resolved.length || 1)
        );
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, initialPage]);

  // Revoke blob URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      pages.forEach((p) => {
        if (p.resolved_url?.startsWith("blob:")) URL.revokeObjectURL(p.resolved_url);
      });
    };
  }, [pages]);

  // IntersectionObserver: when a page is >50% visible, set currentPage (URL sync is in another effect)
  useEffect(() => {
    const wrap = pdfCanvasWrapRef.current;
    if (!wrap || pages.length === 0) return;
    const pageEls = wrap.querySelectorAll("[data-page]");
    if (pageEls.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestPage = null;
        let bestRatio = 0.5;
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          if (ratio >= 0.5 && ratio > bestRatio) {
            bestRatio = ratio;
            const n = Number(entry.target.getAttribute("data-page"));
            if (Number.isInteger(n) && n >= 1) bestPage = n;
          }
        });
        if (bestPage != null) setCurrentPage(bestPage);
      },
      { root: wrap, rootMargin: "0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    pageEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages.length]);

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

  const goPrev = () => {
    const prev = Math.max(1, currentPage - 1);
    pageRefs.current[prev]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const goNext = () => {
    const next = Math.min(totalPages, currentPage + 1);
    pageRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToPage = (n) => {
    const num = Math.max(1, Math.min(totalPages || 1, Number(n)));
    pageRefs.current[num]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const goToPage = (n) => scrollToPage(n);

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

  const handlePdfPageClick = (e, pageNum) => {
    if (e.target.closest(".annotation-pin") || e.target.closest(".ann-input-popup")) return;
    const el = e.currentTarget;
    if (!el) return;
    setCurrentPage(pageNum);
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const xPct = Math.max(0, Math.min(100, x * 100));
    const yPct = Math.max(0, Math.min(100, y * 100));
    setPinPopover({ visible: true, xPct, yPct, pageNumber: pageNum });
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

  const lectureDuration = lectureRecording?.duration_seconds ?? (audioDuration || 1);
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
      {/* Thumbnail strip */}
      <aside className={`thumb-strip ${thumbCollapsed ? "collapsed" : ""}`}>
        <div className="thumb-top">
          <div className="thumb-page-nav">
            <button
              type="button"
              className="thumb-nav-btn"
              onClick={goPrev}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="thumb-page-indicator">
              <span className="cur">{currentPage}</span>
              <span> / {totalPages || 0}</span>
            </span>
            <button
              type="button"
              className="thumb-nav-btn"
              onClick={goNext}
              disabled={currentPage >= totalPages || totalPages === 0}
              aria-label="Next page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
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
                onClick={() => scrollToPage(num)}
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
                  {page.resolved_url || page.image_path ? (
                    <img
                      src={page.resolved_url || page.image_path}
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

      {/* Main area — continuous scroll, all pages */}
      <main className="main-area">
        <div ref={pdfCanvasWrapRef} className="pdf-canvas-wrap">
          {pages.length === 0 ? (
            <div className="pdf-page">
              <div className="pdf-page-inner">
                <div className="pdf-page-skeleton">Loading…</div>
              </div>
            </div>
          ) : (
            pages.map((page, idx) => {
              const num = page.page_number ?? idx + 1;
              const isCurrentPage = num === currentPage;
              const pagePins = isCurrentPage ? pins : [];
              const showPopover = pinPopover.visible && pinPopover.pageNumber === num;
              return (
                <div
                  key={page.id ?? `page-${idx}`}
                  ref={(el) => {
                    if (el) pageRefs.current[num] = el;
                  }}
                  data-page={num}
                  className="pdf-page"
                  onClick={(e) => handlePdfPageClick(e, num)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handlePdfPageClick(e, num)}
                >
                  <div className="pdf-page-inner">
                    {page.resolved_url || page.image_path ? (
                      <img
                        src={page.resolved_url || page.image_path}
                        alt={`Page ${num}`}
                      />
                    ) : (
                      <div className="pdf-page-skeleton">
                        Loading page {num}…
                      </div>
                    )}
                    {pagePins.map((pin, pinIdx) => (
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
                    {showPopover && (
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
              );
            })
          )}
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
            <div className="rp-recording-bar">
              {isRecording ? (
                <div className="rp-recording-active">
                  <span className="rp-rec-dot" />
                  <span className="rp-rec-label">{recordingMode === "lecture" ? "LECTURE" : "SLIDE NOTE"}</span>
                  <span className="rp-rec-time">{formatTime(recordingElapsed)}</span>
                  <button type="button" className="rp-rec-stop" onClick={stopRecording}>
                    STOP
                  </button>
                  {recordingMode === "lecture" && (
                    <button type="button" className="rp-rec-tap" onClick={addTapTag}>
                      TAP TAG
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className={`rp-rec-btn ${recordingMode === "lecture" ? "active" : ""}`}
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
                    className={`rp-rec-btn ${recordingMode === "slide_note" ? "active" : ""}`}
                    onClick={() => setRecordingMode("slide_note")}
                    title="Slide note"
                  >
                    Slide Note
                  </button>
                  <button type="button" className="rp-rec-btn" onClick={startRecording} title="Start recording">
                    Record
                  </button>
                </>
              )}
            </div>
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
