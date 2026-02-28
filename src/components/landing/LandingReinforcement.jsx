import React from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingReinforcement() {
  return (
    <section className="reinforce-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header mb-16">
          <div className="section-label mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              Reinforcement
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            Targeted sessions
            <br />
            built for your weak concept.
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
            Not random practice. Synapse identifies which concept is limiting you, builds a timed MCQ session around it,
            and gives you an AI teaching summary when you're done.
          </p>
        </RevealWrapper>
        <div className="reinforce-layout grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <RevealWrapper>
            <div
              className="reinforce-session-card bg-[rgba(10,16,14,0.98)] border border-[rgba(78,158,122,0.2)] rounded-[18px] overflow-hidden shadow-[0_0_40px_rgba(78,158,122,0.06)]"
            >
              <div className="rs-header py-4 px-5 border-b border-[rgba(78,158,122,0.12)] flex items-center justify-between">
                <span className="rs-title text-[13px] font-bold text-[var(--green-neon)]">
                  ⚡ Reinforcement Session
                </span>
                <span className="rs-timer font-mono text-xs text-[var(--muted)]">⏱ 08:42 remaining</span>
              </div>
              <div
                className="rs-concept py-3 px-5 bg-[rgba(78,158,122,0.06)] border-b border-[rgba(78,158,122,0.1)] font-mono text-[10px] tracking-[0.1em] text-[var(--green)] flex items-center gap-1.5"
              >
                🎯 FOCUS CONCEPT: Systolic vs Diastolic Heart Failure — 3 / 6
              </div>
              <div className="rs-q p-5">
                <div className="rs-q-text text-sm leading-relaxed mb-4">
                  Which of the following is the most appropriate initial treatment for a patient with newly diagnosed
                  HFrEF (EF 30%) who has no contraindications?
                </div>
                <div className="rs-options flex flex-col gap-1.5">
                  <div
                    className="rs-option rs-opt-correct py-2.5 px-3.5 rounded-lg text-[13px] border border-[rgba(78,158,122,0.28)] bg-[rgba(78,158,122,0.1)] text-[var(--green-neon)] flex items-center gap-2 cursor-default"
                  >
                    <span className="font-mono text-[11px] w-[18px]">A</span>
                    ACE inhibitor + beta-blocker + dietary sodium restriction
                  </div>
                  <div
                    className="rs-option rs-opt-neutral py-2.5 px-3.5 rounded-lg text-[13px] border border-[rgba(78,158,122,0.12)] bg-[rgba(78,158,122,0.04)] text-[var(--muted)] flex items-center gap-2 cursor-default"
                  >
                    <span className="font-mono text-[11px] w-[18px]">B</span>
                    Calcium channel blocker monotherapy
                  </div>
                  <div
                    className="rs-option rs-opt-neutral py-2.5 px-3.5 rounded-lg text-[13px] border border-[rgba(78,158,122,0.12)] bg-[rgba(78,158,122,0.04)] text-[var(--muted)] flex items-center gap-2 cursor-default"
                  >
                    <span className="font-mono text-[11px] w-[18px]">C</span>
                    Digoxin alone for rate control
                  </div>
                </div>
              </div>
              <div className="rs-complete py-5 px-5 border-t border-[rgba(78,158,122,0.12)]">
                <div className="rs-complete-header font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--green)] mb-3">
                  Session complete
                </div>
                <div className="rs-score font-serif text-[28px] text-[var(--green-neon)] mb-3">
                  5 / 6 correct — 83%
                </div>
                <div className="rs-ai-summary text-xs text-[var(--muted)] leading-relaxed py-3.5 px-3.5 bg-[rgba(78,158,122,0.05)] border border-[rgba(78,158,122,0.1)] rounded-[10px]">
                  <strong className="text-[var(--green-neon)]">AI teaching note:</strong> You showed strong improvement
                  on ACE inhibitor indications but still confused EF thresholds in 2 questions. The key distinction: HFrEF
                  is defined by EF &lt;40%, not by symptoms. Review the classification table on Harrison's p.47 once more
                  before your exam.
                </div>
              </div>
            </div>
          </RevealWrapper>
          <div className="reinforce-features-col flex flex-col gap-4">
            {[
              {
                num: "01",
                title: "Concept-targeted",
                desc: "Each session is built specifically for the concept your learning state identifies as the primary risk. Not a random shuffle — a deliberate attack on your weak point.",
              },
              {
                num: "02",
                title: "Timed and resumable",
                desc: "Sessions are timed (10–15 minutes). Close the tab and come back — your answers are saved. The session picks up exactly where you left off.",
              },
              {
                num: "03",
                title: "AI teaching summary",
                desc: "After each session, Synapse generates a personalized teaching note — not a score report. It explains what you missed and what you should review, using the exact language of the concept.",
              },
              {
                num: "04",
                title: "Feeds your learning state",
                desc: "Every answer in a reinforcement session flows back into your analytics. Complete enough sessions and your state shifts: DECLINING → STABLE → IMPROVING.",
              },
            ].map((f, i) => (
              <RevealWrapper key={f.num} style={{ transitionDelay: `${0.05 * (i + 1)}s` }}>
                <div className="rf-feat p-6 bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-[14px] transition-all hover:border-[rgba(78,158,122,0.2)] hover:translate-x-1">
                  <div
                    className="rf-feat-num font-serif text-[32px] leading-none mb-2"
                    style={{ color: "rgba(78,158,122,0.25)" }}
                  >
                    {f.num}
                  </div>
                  <div className="rf-feat-title text-[15px] font-bold mb-1">{f.title}</div>
                  <div className="rf-feat-desc text-[13px] text-[var(--muted)] leading-relaxed">{f.desc}</div>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
