import React from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingMCQ() {
  return (
    <section className="mcq-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header mb-16">
          <div className="section-label mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              MCQ + Performance Mentor
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            It remembers every
            <br />
            question you've ever answered.
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
            Not just the deck you just finished. Your Performance Mentor pulls from your entire history — and it knows
            your weakest file down to the page.
          </p>
        </RevealWrapper>
        <div className="mcq-layout grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
          <div>
            <RevealWrapper>
              <div className="mcq-card bg-[rgba(13,15,18,0.95)] border border-[var(--border)] rounded-[18px] overflow-hidden">
                <div className="mcq-topbar py-3.5 px-5 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="mcq-progress-info font-mono text-[11px] text-[var(--muted)]">
                    Question 4 / 10 — Harrison's Ch.12
                  </span>
                  <span className="mcq-timer font-mono text-xs text-[var(--teal)]">⏱ 02:14</span>
                </div>
                <div className="mcq-progress-bar h-0.5 bg-white/[0.06]">
                  <div
                    className="mcq-progress-fill h-full bg-gradient-to-r from-[var(--teal)] to-[var(--teal-neon)]"
                    style={{ width: "36%" }}
                  />
                </div>
                <div className="mcq-question py-7 px-6">
                  <div className="mcq-source flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-[var(--muted)] mb-4">
                    📄 Harrison's Chapter 12 — Cardiology · Page 47
                  </div>
                  <div className="mcq-q-text text-sm leading-relaxed text-[var(--text)] mb-5">
                    A 68-year-old male with a history of hypertension presents with progressive dyspnea on exertion and
                    bilateral leg swelling. Echocardiography shows EF of 35%. Which of the following is the primary
                    pathophysiological mechanism?
                  </div>
                  <div className="mcq-options flex flex-col gap-2">
                    <div className="mcq-option neutral flex items-start gap-2.5 py-2.5 px-3.5 rounded-[10px] text-[13px] leading-snug bg-white/[0.03] border border-white/[0.07] text-[var(--muted)] cursor-default">
                      <span className="mcq-opt-letter font-mono text-[10px] font-semibold tracking-wide w-[18px] h-[18px] rounded-md bg-white/[0.06] text-[var(--muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        A
                      </span>
                      Increased afterload from systemic vasoconstriction
                    </div>
                    <div className="mcq-option correct flex items-start gap-2.5 py-2.5 px-3.5 rounded-[10px] text-[13px] leading-snug bg-[rgba(0,200,180,0.07)] border border-[rgba(0,200,180,0.22)] text-[var(--text)] cursor-default">
                      <span className="mcq-opt-letter font-mono text-[10px] font-semibold tracking-wide w-[18px] h-[18px] rounded-md bg-[rgba(0,200,180,0.15)] text-[var(--teal)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        B
                      </span>
                      Reduced myocardial contractility leading to decreased stroke volume
                    </div>
                    <div className="mcq-option wrong flex items-start gap-2.5 py-2.5 px-3.5 rounded-[10px] text-[13px] leading-snug bg-[rgba(255,75,75,0.05)] border border-[rgba(255,75,75,0.16)] text-[rgba(245,245,247,0.5)] cursor-default">
                      <span className="mcq-opt-letter font-mono text-[10px] font-semibold tracking-wide w-[18px] h-[18px] rounded-md bg-[rgba(255,75,75,0.1)] text-[var(--red)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        C
                      </span>
                      Diastolic dysfunction with impaired ventricular relaxation
                    </div>
                    <div className="mcq-option neutral flex items-start gap-2.5 py-2.5 px-3.5 rounded-[10px] text-[13px] leading-snug bg-white/[0.03] border border-white/[0.07] text-[var(--muted)] cursor-default">
                      <span className="mcq-opt-letter font-mono text-[10px] font-semibold tracking-wide w-[18px] h-[18px] rounded-md bg-white/[0.06] text-[var(--muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        D
                      </span>
                      Right ventricular failure secondary to pulmonary hypertension
                    </div>
                  </div>
                </div>
                <div className="mcq-explain py-3 px-6 border-t border-[var(--border)] bg-[rgba(0,200,180,0.04)]">
                  <div className="mcq-explain-label font-mono text-[9px] tracking-wider uppercase text-[var(--teal)] mb-1.5">
                    Why B is correct
                  </div>
                  <div className="mcq-explain-text text-xs text-[rgba(245,245,247,0.7)] leading-relaxed">
                    An EF of 35% (&lt;40%) confirms systolic heart failure. The hallmark is reduced contractility →
                    decreased stroke volume → compensatory neurohormonal activation. This matches the clinical picture of
                    HFrEF.
                  </div>
                </div>
              </div>
            </RevealWrapper>
            <div className="mcq-features grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
              <RevealWrapper>
                <div className="mcq-feat p-4 rounded-xl bg-[rgba(18,22,28,0.6)] border border-[var(--border)]">
                  <div className="mcq-feat-title text-[13px] font-semibold mb-1">Explain All</div>
                  <div className="mcq-feat-desc text-xs text-[var(--muted)] leading-snug">
                    Reveals the explanation for every option — A through E — before moving on. Not just correct/wrong.
                  </div>
                </div>
              </RevealWrapper>
              <RevealWrapper>
                <div className="mcq-feat p-4 rounded-xl bg-[rgba(18,22,28,0.6)] border border-[var(--border)]">
                  <div className="mcq-feat-title text-[13px] font-semibold mb-1">Review Mistakes</div>
                  <div className="mcq-feat-desc text-xs text-[var(--muted)] leading-snug">
                    After a deck, retake only the questions you got wrong. Focus exactly where it counts.
                  </div>
                </div>
              </RevealWrapper>
            </div>
          </div>
          <RevealWrapper style={{ transitionDelay: "0.15s" }}>
            <div className="mentor-card bg-[rgba(13,15,18,0.95)] border border-[rgba(63,124,255,0.15)] rounded-[18px] overflow-hidden">
              <div className="mentor-header py-4 px-5 border-b border-[var(--border)] flex items-center gap-2.5">
                <div className="mentor-icon w-8 h-8 bg-[rgba(63,124,255,0.1)] border border-[rgba(63,124,255,0.2)] rounded-lg flex items-center justify-center text-sm">
                  🎯
                </div>
                <div>
                  <div className="mentor-title text-sm font-bold">Performance Mentor</div>
                  <div className="mentor-sub text-[11px] text-[var(--muted)]">After deck · Cross-session analysis</div>
                </div>
              </div>
              <div className="mentor-body p-5">
                <div className="mentor-stat-row grid grid-cols-2 gap-2.5 mb-4">
                  <div className="mentor-stat p-3.5 bg-white/[0.03] border border-white/[0.05] rounded-[10px]">
                    <div className="mentor-stat-label font-mono text-[9px] tracking-wider uppercase text-[var(--muted)] mb-1">
                      Global accuracy
                    </div>
                    <div className="mentor-stat-val neutral font-serif text-[22px] leading-none text-[var(--text)]">
                      73%
                    </div>
                  </div>
                  <div className="mentor-stat p-3.5 bg-white/[0.03] border border-white/[0.05] rounded-[10px]">
                    <div className="mentor-stat-label font-mono text-[9px] tracking-wider uppercase text-[var(--muted)] mb-1">
                      7-day change
                    </div>
                    <div className="mentor-stat-val negative font-serif text-[22px] leading-none text-[var(--red)]">
                      −8%
                    </div>
                  </div>
                  <div className="mentor-stat p-3.5 bg-white/[0.03] border border-white/[0.05] rounded-[10px]">
                    <div className="mentor-stat-label font-mono text-[9px] tracking-wider uppercase text-[var(--muted)] mb-1">
                      Total answered
                    </div>
                    <div className="mentor-stat-val neutral font-serif text-[22px] leading-none text-[var(--text)]">
                      486
                    </div>
                  </div>
                  <div className="mentor-stat p-3.5 bg-white/[0.03] border border-white/[0.05] rounded-[10px]">
                    <div className="mentor-stat-label font-mono text-[9px] tracking-wider uppercase text-[var(--muted)] mb-1">
                      This deck
                    </div>
                    <div className="mentor-stat-val positive font-serif text-[22px] leading-none text-[var(--teal)]">
                      80%
                    </div>
                  </div>
                </div>
                <div className="mentor-weakest p-3.5 bg-[rgba(255,75,75,0.04)] border border-[rgba(255,75,75,0.12)] rounded-[10px] mb-3">
                  <div className="mentor-weakest-label font-mono text-[9px] tracking-wider uppercase text-[var(--red)] mb-1">
                    ⚠ Weakest file
                  </div>
                  <div className="mentor-weakest-val text-[13px] font-semibold">
                    Harrison's Ch.12 — Cardiology
                  </div>
                  <div className="mentor-weakest-acc text-xs text-[var(--muted)]">
                    Accuracy: 51% across 34 attempts
                  </div>
                </div>
                <div
                  className="mentor-weakest p-3.5 rounded-[10px] mb-3"
                  style={{
                    borderColor: "rgba(245,166,35,0.16)",
                    background: "rgba(245,166,35,0.05)",
                  }}
                >
                  <div
                    className="mentor-weakest-label font-mono text-[9px] tracking-wider uppercase mb-1"
                    style={{ color: "var(--amber)" }}
                  >
                    ⚠ Weakest page
                  </div>
                  <div className="mentor-weakest-val text-[13px] font-semibold">
                    Page 47 — Systolic vs Diastolic HF
                  </div>
                  <div className="mentor-weakest-acc text-xs text-[var(--muted)] mt-0.5">
                    Accuracy: 42% across 12 attempts
                  </div>
                </div>
                <div className="mentor-insight p-3.5 bg-[rgba(245,166,35,0.05)] border border-[rgba(245,166,35,0.14)] rounded-[10px] text-xs leading-relaxed text-[rgba(245,245,247,0.75)]">
                  <strong className="text-[var(--amber)]">Note:</strong> You're consistently missing questions from Page
                  47 of this file. This pattern suggests conceptual confusion rather than random error. Consider
                  reviewing the systolic/diastolic distinction in the file viewer with Astra.
                </div>
              </div>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
