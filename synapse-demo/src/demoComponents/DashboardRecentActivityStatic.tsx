/**
 * Presentational clone of DashboardRecentActivity for Remotion.
 * Same UI as @modules/dashboard/DashboardRecentActivity but accepts static data.
 */
import React from "react";
import { FileText, BookOpen, CheckSquare, Zap, ArrowRight, Calendar, GraduationCap, Clock } from "lucide-react";

const typeConfig: Record<string, { icon: typeof BookOpen; label: string; accent: string; glow: string }> = {
  summary: { icon: BookOpen, label: "Summary", accent: "#00C8B4", glow: "rgba(0,200,180,0.12)" },
  mcq: { icon: CheckSquare, label: "MCQ Deck", accent: "#F5A623", glow: "rgba(245,166,35,0.12)" },
  flashcards: { icon: Zap, label: "Flashcards", accent: "#5BFFA8", glow: "rgba(91,255,168,0.12)" },
};

const eventTypeConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Calendar; label: string }> = {
  exam: { color: "#FF4B4B", bg: "rgba(255,75,75,0.08)", border: "rgba(255,75,75,0.2)", icon: GraduationCap, label: "Exam" },
  lecture: { color: "#3F7CFF", bg: "rgba(63,124,255,0.08)", border: "rgba(63,124,255,0.2)", icon: BookOpen, label: "Lecture" },
  lab: { color: "#7A6CFF", bg: "rgba(122,108,255,0.08)", border: "rgba(122,108,255,0.2)", icon: Clock, label: "Lab" },
  other: { color: "#F5A623", bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)", icon: Calendar, label: "Event" },
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRelativeTime(dateString: string): string {
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
}

function cleanTitle(title: string): string {
  if (!title) return "Untitled";
  return title.replace(/\.(pdf|pptx?|docx?|txt)$/i, "");
}

const SectionCard = ({
  title,
  label,
  children,
  isEmpty,
}: {
  title: string;
  label: string;
  children: React.ReactNode;
  isEmpty: boolean;
}) => (
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
      {!isEmpty && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(0,200,180,0.6)", fontFamily: "'Geist Mono', monospace" }}>
          View all <ArrowRight size={11} />
        </span>
      )}
    </div>
    <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 12 }} />
    {children}
  </div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 10,
    }}
  >
    {children}
  </div>
);

const CountdownBadge = ({ days, eventType }: { days: number; eventType: string }) => {
  const cfg = eventTypeConfig[eventType] || eventTypeConfig.other;
  let label: string;
  let color: string;
  let bg: string;
  let border: string;
  if (days === 0) {
    label = "Today";
    color = cfg.color;
    bg = cfg.bg;
    border = cfg.border;
  } else if (days === 1) {
    label = "Tomorrow";
    color = cfg.color;
    bg = cfg.bg;
    border = cfg.border;
  } else if (days <= 7) {
    label = `in ${days}d`;
    color = cfg.color;
    bg = cfg.bg;
    border = cfg.border;
  } else {
    label = `in ${days}d`;
    color = "rgba(245,245,247,0.5)";
    bg = "rgba(255,255,255,0.04)";
    border = "rgba(255,255,255,0.08)";
  }
  return (
    <div style={{ padding: "3px 9px", borderRadius: 100, background: bg, border: `1px solid ${border}`, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color, fontFamily: "'Geist Mono', monospace", fontWeight: 600, letterSpacing: "0.05em" }}>
        {label}
      </span>
    </div>
  );
};

export interface RecentFile {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  uiCategory?: string;
}

export interface RecentGeneration {
  type: string;
  id: string;
  title: string;
  created_at?: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
}

export default function DashboardRecentActivityStatic({
  recentFiles,
  recentGenerations,
  upcomingEvents,
}: {
  recentFiles: RecentFile[];
  recentGenerations: RecentGeneration[];
  upcomingEvents: UpcomingEvent[];
}) {
  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
        <SectionCard title="Recent Uploads" label="Files" isEmpty={recentFiles.length === 0}>
          {recentFiles.length > 0 ? (
            <div>
              {recentFiles.map((file) => (
                <Row key={file.id}>
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
                      <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{formatRelativeTime(file.created_at || file.updated_at || "")}</span>
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

        <SectionCard title="Recent Generations" label="Outputs" isEmpty={recentGenerations.length === 0}>
          {recentGenerations.length > 0 ? (
            <div>
              {recentGenerations.map((gen) => {
                const cfg = typeConfig[gen.type] || typeConfig.mcq;
                const Icon = cfg.icon;
                return (
                  <Row key={`${gen.type}-${gen.id}`}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.glow, border: `1px solid ${cfg.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} style={{ color: cfg.accent }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cleanTitle(gen.title)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{cfg.label}</span>
                        <span style={{ fontSize: 10, color: "rgba(245,245,247,0.2)" }}>·</span>
                        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{formatRelativeTime(gen.created_at || "")}</span>
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

        <SectionCard title="Upcoming Events" label="Planner" isEmpty={upcomingEvents.length === 0}>
          {upcomingEvents.length > 0 ? (
            <div>
              {upcomingEvents.map((event) => {
                const cfg = eventTypeConfig[event.event_type] || eventTypeConfig.other;
                const Icon = cfg.icon;
                const days = getDaysUntil(event.event_date);
                return (
                  <Row key={event.id}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {event.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: cfg.color, fontFamily: "'Geist Mono', monospace", opacity: 0.8 }}>{cfg.label}</span>
                        <span style={{ fontSize: 10, color: "rgba(245,245,247,0.2)" }}>·</span>
                        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", fontFamily: "'Geist Mono', monospace" }}>{formatEventDate(event.event_date)}</span>
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
      </div>
    </div>
  );
}
