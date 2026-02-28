import React from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingProblem() {
  return (
    <section id="problem" className="problem-section py-[120px] border-t border-[var(--border)]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header mb-16">
          <div className="section-label mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              The problem
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            Your tools don't
            <br />
            know what you don't know.
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
            Every tool you use treats you the same on day one as it does on day sixty. That's not studying — that's
            hoping.
          </p>
        </RevealWrapper>
        <RevealWrapper>
          <div
            className="problem-grid grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-[20px] overflow-hidden"
          >
            <div className="problem-col p-12 bg-[rgba(13,15,18,0.9)]">
              <div className="problem-col-header flex items-center gap-2.5 mb-9">
                <div className="problem-dot w-2 h-2 rounded-full bg-[var(--red)]" />
                <span className="problem-label font-mono text-[11px] tracking-wider uppercase" style={{ color: "rgba(255,75,75,0.7)" }}>
                  Without Synapse
                </span>
              </div>
              <div className="problem-items flex flex-col gap-5">
                <div className="problem-item bad py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(255,75,75,0.04)] border-[rgba(255,75,75,0.14)] text-[rgba(245,245,247,0.6)] line-through decoration-[rgba(255,75,75,0.4)]">
                  Re-read the same chapter hoping something sticks
                </div>
                <div className="problem-item bad py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(255,75,75,0.04)] border-[rgba(255,75,75,0.14)] text-[rgba(245,245,247,0.6)] line-through decoration-[rgba(255,75,75,0.4)]">
                  Ask ChatGPT about a concept — not your lecture
                </div>
                <div className="problem-item bad py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(255,75,75,0.04)] border-[rgba(255,75,75,0.14)] text-[rgba(245,245,247,0.6)] line-through decoration-[rgba(255,75,75,0.4)]">
                  Practice random MCQs with no memory of your history
                </div>
                <div className="problem-item bad py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(255,75,75,0.04)] border-[rgba(255,75,75,0.14)] text-[rgba(245,245,247,0.6)] line-through decoration-[rgba(255,75,75,0.4)]">
                  Flashcards with no idea what you actually got wrong
                </div>
                <div className="problem-item bad py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(255,75,75,0.04)] border-[rgba(255,75,75,0.14)] text-[rgba(245,245,247,0.6)] line-through decoration-[rgba(255,75,75,0.4)]">
                  Study for 8 hours and still not know if you're ready
                </div>
              </div>
            </div>
            <div className="problem-col p-12 bg-[rgba(13,15,18,0.9)]">
              <div className="problem-col-header flex items-center gap-2.5 mb-9">
                <div className="problem-dot w-2 h-2 rounded-full bg-[var(--teal)]" />
                <span className="problem-label font-mono text-[11px] tracking-wider uppercase text-[var(--teal)]">
                  With Synapse
                </span>
              </div>
              <div className="problem-items flex flex-col gap-5">
                <div className="problem-item good py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(0,200,180,0.06)] border-[rgba(0,200,180,0.16)] text-[var(--text)]">
                  AI that reads your lecture and explains exactly page 47
                </div>
                <div className="problem-item good py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(0,200,180,0.06)] border-[rgba(0,200,180,0.16)] text-[var(--text)]">
                  Astra answers from your file, grounded in your material
                </div>
                <div className="problem-item good py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(0,200,180,0.06)] border-[rgba(0,200,180,0.16)] text-[var(--text)]">
                  Performance mentor tracks accuracy across every deck you've ever done
                </div>
                <div className="problem-item good py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(0,200,180,0.06)] border-[rgba(0,200,180,0.16)] text-[var(--text)]">
                  Flashcard modes: Turbo Recall, High Yield, or Deep Mastery
                </div>
                <div className="problem-item good py-4 px-5 rounded-xl border text-sm leading-snug bg-[rgba(0,200,180,0.06)] border-[rgba(0,200,180,0.16)] text-[var(--text)]">
                  Learning state tells you: IMPROVING, STABLE, or DECLINING
                </div>
              </div>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
