// src/modules/dashboard/DashboardRecentActivity.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, BookOpen, CheckSquare, Zap, ArrowRight, Calendar, GraduationCap, Clock } from "lucide-react";
import { getRecentFiles } from "../Library/apiLibrary";
import { getAllSummaries } from "../summaries/apiSummaries";
import { getMCQDecks } from "../mcq/apiMCQ";
import { getDecks } from "../flashcards/apiFlashcards";
import api from "../../lib/api";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

const cleanTitle = (title) => {
  if (!title) return "Untitled";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(title)) {
    const ext = title.split(".").pop();
    return `Unnamed file${ext && ext !== title ? `.${ext}` : ""}`;
  }
  return title.replace(/\.(pdf|pptx?|docx?|txt)$/i, "");
};

const typeConfig = {
  summary: { icon: BookOpen, label: "Summary", accent: "#00C8B4", glow: "rgba(0,200,180,0.12)" },
  mcq: { icon: CheckSquare, label: "MCQ Deck", accent: "#F5A623", glow: "rgba(245,166,35,0.12)" },
  flashcards: { icon: Zap, label: "Flashcards", accent: "#5BFFA8", glow: "rgba(91,255,168,0.12)" },
};

const eventTypeConfig = {
  exam:      { color: "#FF4B4B", bg: "rgba(255,75,75,0.08)",   border: "rgba(255,75,75,0.2)",   icon: GraduationCap, label: "Exam" },
  lecture:   { color: "#3F7CFF", bg: "rgba(63,124,255,0.08)",  border: "rgba(63,124,255,0.2)",  icon: BookOpen,      label: "Lecture" },
  lab:       { color: "#7A6CFF", bg: "rgba(122,108,255,0.08)", border: "rgba(122,108,255,0.2)", icon: Clock,         label: "Lab" },
  study:     { color: "#00C8B4", bg: "rgba(0,200,180,0.08)",   border: "rgba(0,200,180,0.2)",   icon: Clock,         label: "Study" },
  other:     { color: "#F5A623", bg: "rgba(245,166,35,0.08)",  border: "rgba(245,166,35,0.2)", icon: Calendar,      label: "Event" },
};

const getDaysUntil = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const CountdownBadge = ({ days, eventType }) => {
  const cfg = eventTypeConfig[eventType] || eventTypeConfig.other;
  let label, color, bg, border;

  if (days === 0) {
    label = "Today"; color = cfg.color; bg = cfg.bg; border = cfg.border;
  } else if (days === 1) {
    label = "Tomorrow"; color = cfg.color; bg = cfg.bg; border = cfg.border;
  } else if (days <= 7) {
    label = `in ${days}d`; color = cfg.color; bg = cfg.bg; border = cfg.border;
  } else if (days <= 30) {
    label = `in ${days}d`; color = "rgba(245,245,247,0.5)"; bg = "rgba(255,255,255,0.04)"; border = "rgba(255,255,255,0.08)";
  } else {
    label = `in ${days}d`; color = "rgba(245,245,247,0.3)"; bg = "rgba(255,255,255,0.03)"; border = "rgba(255,255,255,0.05)";
  }

  return (
    <div style={{ padding: "3px 9px", borderRadius: 100, background: bg, border: `1px solid ${border}`, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color, fontFamily: "'Geist Mono', monospace", fontWeight: 600, letterSpacing: "0.05em" }}>
        {label}
      </span>
    </div>
  );
};

const Row = ({ onClick, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.08)" : "transparent"}`,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </div>
  );
};

const SkeletonRow = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
    <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} className="animate-pulse" />
    <div style={{ flex: 1 }}>
      <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "70%", marginBottom: 6 }} className="animate-pulse" />
      <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.04)", width: "40%" }} className="animate-pulse" />
    </div>
  </div>
);

const SectionCard = ({ title, label, children, isEmpty, onNavigate }) => (
  <div
    style={{
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(13,15,18,0.6)",
      padding: "22px 20px",
      backdropFilter: "blur(8px)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,245,247,0.3)", marginBottom: 4 }}>
          {label}
        </div>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#F5F5F7" }}>
          {title}
        </h3>
      </div>
      {!isEmpty && onNavigate && (
        <button
          onClick={onNavigate}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(0,200,180,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: "'Geist Mono', monospace", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#00C8B4"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(0,200,180,0.6)"}
        >
          View all <ArrowRight size={11} />
        </button>
      )}
    </div>
    <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 12 }} />
    {children}
  </div>
);

// ─── Upcoming Events Card ──────────────────────────────────────────────────────
const UpcomingEventsCard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7); // "2026-03"
    api.get("/api/planner/events", { params: { month } })
      .then(r => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = (r.data?.data || r.data || [])
          .filter(e => new Date(e.event_date) >= today)
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
          .slice(0, 5);
        setEvents(upcoming);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const formatEventDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SectionCard
      title="Upcoming Events"
      label="Planner"
      isEmpty={!loading && events.length === 0}
      onNavigate={() => navigate("/planner")}
    >
      {loading ? (
        <div>{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
      ) : events.length > 0 ? (
        <div>
          {events.map(event => {
            const cfg = eventTypeConfig[event.event_type] || eventTypeConfig.other;
            const Icon = cfg.icon;
            const days = getDaysUntil(event.event_date);
            return (
              <Row key={event.id} onClick={() => navigate("/planner")}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {event.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: cfg.color, fontFamily: "'Geist Mono', monospace", opacity: 0.8 }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(245,245,247,0.2)" }}>·</span>
                    <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>
                      {formatEventDate(event.event_date)}
                    </span>
                  </div>
                </div>
                <CountdownBadge days={days} eventType={event.event_type} />
              </Row>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <Calendar size={28} style={{ color: "rgba(245,245,247,0.15)", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, color: "rgba(245,245,247,0.35)", marginBottom: 4 }}>No upcoming events</p>
          <p style={{ fontSize: 11, color: "rgba(245,245,247,0.22)" }}>Add exams and lectures in the Planner</p>
        </div>
      )}
    </SectionCard>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const DashboardRecentActivity = () => {
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        (async () => {
          try { setRecentFiles(await getRecentFiles(5)); }
          catch { setRecentFiles([]); }
        })(),
        (async () => {
          try {
            const [summaries, mcqDecks, flashcardDecks] = await Promise.all([
              getAllSummaries().catch(() => []),
              getMCQDecks().catch(() => []),
              getDecks().catch(() => []),
            ]);
            const all = [
              ...(summaries || []).filter(s => s.status === "completed" || (!s.generating && s.status !== "generating")).map(s => ({ type: "summary", id: s.id, title: s.title || "Untitled Summary", created_at: s.created_at })),
              ...(mcqDecks || []).filter(d => !d.generating).map(d => ({ type: "mcq", id: d.id, title: d.title || "Untitled MCQ Deck", created_at: d.created_at })),
              ...(flashcardDecks || []).filter(d => !d.generating).map(d => ({ type: "flashcards", id: d.id, title: d.title || "Untitled Deck", created_at: d.created_at })),
            ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
            setRecentGenerations(all);
          } catch { setRecentGenerations([]); }
        })(),
      ]);
      setLoading(false);
    };
    load();
  }, []);

  const handleFileClick = (fileId) => navigate(`/library/file/${fileId}`, { state: { fromFolderPath: "/library" } });
  const handleGenClick = (gen) => {
    if (gen.type === "summary") navigate(`/summaries/${gen.id}`);
    else if (gen.type === "mcq") navigate(`/mcq/${gen.id}`);
    else navigate(`/flashcards/${gen.id}`);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,245,247,0.3)" }}>
          Recent Activity
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>

        {/* Recent Uploads */}
        <SectionCard title="Recent Uploads" label="Files" isEmpty={!loading && recentFiles.length === 0} onNavigate={() => navigate("/library")}>
          {loading ? (
            <div>{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
          ) : recentFiles.length > 0 ? (
            <div>
              {recentFiles.map(file => (
                <Row key={file.id} onClick={() => handleFileClick(file.id)}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(0,200,180,0.08)", border: "1px solid rgba(0,200,180,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={16} style={{ color: "#00C8B4" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cleanTitle(file.title)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{file.uiCategory || "File"}</span>
                      <span style={{ fontSize: 10, color: "rgba(245,245,247,0.2)" }}>·</span>
                      <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{formatRelativeTime(file.created_at || file.updated_at)}</span>
                    </div>
                  </div>
                </Row>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <FileText size={28} style={{ color: "rgba(245,245,247,0.15)", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13, color: "rgba(245,245,247,0.35)", marginBottom: 4 }}>No uploads yet</p>
              <p style={{ fontSize: 11, color: "rgba(245,245,247,0.22)" }}>Upload your first file to get started</p>
            </div>
          )}
        </SectionCard>

        {/* Recent Generations */}
        <SectionCard title="Recent Generations" label="Outputs" isEmpty={!loading && recentGenerations.length === 0} onNavigate={() => navigate("/library")}>
          {loading ? (
            <div>{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
          ) : recentGenerations.length > 0 ? (
            <div>
              {recentGenerations.map(gen => {
                const cfg = typeConfig[gen.type] || typeConfig.mcq;
                const Icon = cfg.icon;
                return (
                  <Row key={`${gen.type}-${gen.id}`} onClick={() => handleGenClick(gen)}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.glow, border: `1px solid ${cfg.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} style={{ color: cfg.accent }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cleanTitle(gen.title)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{cfg.label}</span>
                        <span style={{ fontSize: 10, color: "rgba(245,245,247,0.2)" }}>·</span>
                        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{formatRelativeTime(gen.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ padding: "3px 9px", borderRadius: 100, background: cfg.glow, border: `1px solid ${cfg.accent}30`, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: cfg.accent, fontFamily: "'Geist Mono', monospace", letterSpacing: "0.05em" }}>Done</span>
                    </div>
                  </Row>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <BookOpen size={28} style={{ color: "rgba(245,245,247,0.15)", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13, color: "rgba(245,245,247,0.35)", marginBottom: 4 }}>Nothing generated yet</p>
              <p style={{ fontSize: 11, color: "rgba(245,245,247,0.22)" }}>Summaries, MCQs, and flashcards appear here</p>
            </div>
          )}
        </SectionCard>

        {/* Upcoming Events */}
        <UpcomingEventsCard />

      </div>
    </div>
  );
};

export default DashboardRecentActivity;
