import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";
import { Sidebar } from "../components/Sidebar";
import { MOCK_PLANNER_EVENTS, MOCK_PLANNER_MONTH } from "../staticData";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// March 2026: 1st is Sunday
const MARCH_2026_START = 0;
const MARCH_DAYS = 31;

export const Scene7Planner: React.FC<{ frame: number }> = ({ frame }) => {
  const slideIn = interpolate(frame, [0, 20], [80, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const captionOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < MARCH_2026_START; i++) cells.push(null);
  for (let d = 1; d <= MARCH_DAYS; d++) cells.push(d);

  return (
    <AbsoluteFill
      style={{
        background: BRAND.background,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ height: 28, background: "#2d2d2d", borderBottom: "1px solid rgba(255,255,255,0.08)" }} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar active="calendar" />
        <div
          style={{
            flex: 1,
            padding: "24px 32px",
            transform: `translateX(${slideIn}px)`,
            opacity,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: BRAND.textPrimary, margin: 0 }}>Planner</h1>
            <button
              style={{
                padding: "10px 20px",
                background: BRAND.primary,
                color: BRAND.background,
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              + New Event
            </button>
          </div>
          <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${BRAND.border}` }}>
            <span
              style={{
                padding: "10px 16px",
                fontSize: 14,
                color: BRAND.primary,
                borderBottom: `2px solid ${BRAND.primary}`,
                marginBottom: -1,
              }}
            >
              Calendar
            </span>
            <span style={{ padding: "10px 16px", fontSize: 14, color: BRAND.textMuted }}>Periods</span>
            <span style={{ padding: "10px 16px", fontSize: 14, color: BRAND.textMuted }}>Upcoming</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: BRAND.textPrimary, marginBottom: 12 }}>
            March 2026
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  fontSize: 11,
                  color: BRAND.textMuted,
                  textAlign: "center",
                  padding: "8px 0",
                }}
              >
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              const col = i % 7;
              const isWeekend = col === 0 || col === 6;
              const dayEvents = d != null ? MOCK_PLANNER_EVENTS.filter((e) => e.event_date === `2026-03-${String(d).padStart(2, "0")}`) : [];
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    background: isWeekend ? "rgba(99,102,241,0.15)" : BRAND.cardBg,
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: 4,
                    fontSize: 12,
                    color: d ? BRAND.textPrimary : "transparent",
                  }}
                >
                  {d}
                  {dayEvents.map((ev) => (
                    <span
                      key={ev.id}
                      style={{
                        marginTop: 4,
                        padding: "2px 8px",
                        background: ev.color || BRAND.errorRed,
                        borderRadius: 4,
                        fontSize: 10,
                        color: BRAND.textPrimary,
                      }}
                    >
                      {ev.event_type === "oral" ? "Oral" : ev.title}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "Syne, sans-serif",
          fontSize: 24,
          color: BRAND.textPrimary,
          opacity: captionOpacity,
        }}
      >
        Your exam is in the calendar. Synapse studies backward from it.
      </div>
    </AbsoluteFill>
  );
};
