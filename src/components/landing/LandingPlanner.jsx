import React from "react";
import RevealWrapper from "./RevealWrapper";

const CAL_DAYS = [
  null,
  null,
  null,
  null,
  null,
  null,
  { day: 1, event: "var(--blue)" },
  { day: 2, event: "var(--teal)" },
  { day: 3, today: true },
  { day: 4, event: "var(--teal)" },
  { day: 5 },
  { day: 6, event: "var(--purple)" },
  { day: 7 },
  { day: 8 },
  { day: 9 },
  { day: 10, event: "var(--teal)" },
  { day: 11 },
  { day: 12, event: "var(--blue)" },
  { day: 13 },
  { day: 14 },
  { day: 15 },
  { day: 16, event: "var(--teal)" },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21, exam: true, event: "var(--red)" },
  { day: 22 },
  { day: 23 },
];

export default function LandingPlanner() {
  return (
    <section className="planner-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header mb-16">
          <div className="section-label mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              Planner
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            Your exam is in
            <br />
            <em className="italic" style={{ color: "var(--red)" }}>
              18 days.
            </em>
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
            Set your rotation dates, link your study files, add your exam date. Synapse counts down — and your Learning
            page adjusts its urgency accordingly.
          </p>
        </RevealWrapper>
        <div className="planner-layout grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
          <RevealWrapper>
            <div className="planner-card bg-[rgba(13,15,18,0.95)] border border-[var(--border)] rounded-[18px] overflow-hidden">
              <div className="planner-topbar py-3.5 px-5 border-b border-[var(--border)] flex items-center justify-between">
                <span className="planner-month text-sm font-bold">March 2026</span>
                <div className="planner-nav flex gap-1.5">
                  <div className="planner-nav-btn w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[10px] text-[var(--muted)] cursor-default">
                    ‹
                  </div>
                  <div className="planner-nav-btn w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[10px] text-[var(--muted)] cursor-default">
                    ›
                  </div>
                </div>
              </div>
              <div className="cal-grid p-3.5">
                <div className="cal-header grid grid-cols-7 gap-0.5 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="cal-day-label font-mono text-[9px] tracking-wide text-center text-[var(--muted)] py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="cal-days grid grid-cols-7 gap-0.5">
                  {CAL_DAYS.map((cell, i) => (
                    <div
                      key={i}
                      className={`cal-day py-1.5 px-1 rounded-md text-center font-mono text-[11px] min-h-[36px] flex flex-col items-center gap-0.5 ${
                        cell?.today
                          ? "bg-[rgba(0,200,180,0.1)] border border-[rgba(0,200,180,0.2)] text-[var(--teal)]"
                          : cell?.exam
                            ? "bg-[rgba(255,75,75,0.07)] border border-[rgba(255,75,75,0.16)] text-[var(--red)]"
                            : cell?.day
                              ? "text-[var(--text)]"
                              : "text-[rgba(245,245,247,0.4)]"
                      }`}
                    >
                      {cell?.day ?? ""}
                      {cell?.event && (
                        <div
                          className="cal-event-dot w-1 h-1 rounded-full"
                          style={{ background: cell.event }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="exam-countdown m-3.5 p-4 bg-[rgba(255,75,75,0.06)] border border-[rgba(255,75,75,0.16)] rounded-xl flex items-center gap-4">
                <div className="countdown-num font-serif text-[40px] leading-none text-[var(--red)] min-w-[64px] text-center">
                  18
                </div>
                <div>
                  <div className="countdown-label text-[13px] font-bold mb-0.5">
                    Days until Internal Medicine Exam
                  </div>
                  <div className="countdown-sub text-xs text-[var(--muted)]">
                    March 21 — All study sessions now prioritized for this block
                  </div>
                </div>
              </div>
            </div>
          </RevealWrapper>
          <RevealWrapper style={{ transitionDelay: "0.1s" }}>
            <div className="planner-intel-card bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-[18px] overflow-hidden">
              <div className="intel-header py-4 px-5 border-b border-[var(--border)] text-[13px] font-bold text-[var(--muted)]">
                Synapse cross-feature intelligence
              </div>
              <div className="intel-item py-3.5 px-5 border-b border-white/[0.03] flex items-start gap-3">
                <div
                  className="intel-icon w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: "rgba(255,75,75,0.08)", border: "1px solid rgba(255,75,75,0.16)" }}
                >
                  ⏰
                </div>
                <div className="intel-text text-xs text-[var(--muted)] leading-relaxed">
                  <strong className="text-[var(--text)]">Exam countdown active.</strong> Learning page now shows "18
                  days" and sessions are urgency-weighted toward Internal Medicine material.
                </div>
              </div>
              <div className="intel-item py-3.5 px-5 border-b border-white/[0.03] flex items-start gap-3">
                <div
                  className="intel-icon w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: "rgba(0,200,180,0.07)", border: "1px solid rgba(0,200,180,0.16)" }}
                >
                  📁
                </div>
                <div className="intel-text text-xs text-[var(--muted)] leading-relaxed">
                  <strong className="text-[var(--text)]">Files tagged to this period:</strong> Harrison's Ch.12, Lecture
                  4 — Heart Failure, ECG Guide. Synapse knows what's in scope.
                </div>
              </div>
              <div className="intel-item py-3.5 px-5 border-b border-white/[0.03] flex items-start gap-3">
                <div
                  className="intel-icon w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: "rgba(63,124,255,0.08)", border: "1px solid rgba(63,124,255,0.16)" }}
                >
                  📅
                </div>
                <div className="intel-text text-xs text-[var(--muted)] leading-relaxed">
                  <strong className="text-[var(--text)]">Upcoming: Cardiology Lecture</strong> on March 6. Your
                  reinforcement sessions are frontloaded before that date.
                </div>
              </div>
              <div className="intel-item py-3.5 px-5 flex items-start gap-3">
                <div
                  className="intel-icon w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: "rgba(122,108,255,0.07)", border: "1px solid rgba(122,108,255,0.16)" }}
                >
                  🎯
                </div>
                <div className="intel-text text-xs text-[var(--muted)] leading-relaxed">
                  The planner doesn't just track time — it <strong className="text-[var(--text)]">informs everything else</strong>. Your analytics, reinforcement sessions, and AI responses all know what rotation you're in.
                </div>
              </div>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
