import React from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingAstra() {
  return (
    <section className="astra-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header mb-16">
          <div className="section-label mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              Astra AI Tutor
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            An AI tutor that
            <br />
            knows your exact page.
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
            Not a chatbot bolted on. Astra operates in three distinct contexts — each one purpose-built to ground
            answers in your material, not the internet.
          </p>
        </RevealWrapper>
        <div className="astra-modes grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <RevealWrapper>
            <div className="astra-mode-card p-7 bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-2xl transition-all duration-250 relative overflow-hidden hover:border-[rgba(0,200,180,0.2)] hover:-translate-y-0.5">
              <div className="astra-mode-pill pill-standalone inline-block font-mono text-[9px] tracking-[0.14em] uppercase py-1 px-2.5 rounded-full mb-4 bg-[rgba(63,124,255,0.1)] text-[var(--blue)] border border-[rgba(63,124,255,0.2)]">
                Standalone
              </div>
              <div className="astra-mode-title text-base font-bold mb-2">Medical study chat</div>
              <div className="astra-mode-desc text-[13px] text-[var(--muted)] leading-relaxed mb-4">
                General high-yield conversations, concept explanations, exam-focused reviews. Quick access to four modes:
                explain, review, use a file, or "I'm confused."
              </div>
              <div className="astra-mode-feature font-mono text-[10px] tracking-wide text-[rgba(245,245,247,0.35)] leading-[1.8]">
                <span className="text-[var(--teal)]">→ Persistent sessions</span>
                <br />
                <span className="text-[var(--teal)]">→ Rename & return to threads</span>
                <br />
                → Follow-up suggestions after each answer
              </div>
            </div>
          </RevealWrapper>
          <RevealWrapper style={{ transitionDelay: "0.1s" }}>
            <div className="astra-mode-card p-7 bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-2xl transition-all duration-250 relative overflow-hidden hover:border-[rgba(0,200,180,0.2)] hover:-translate-y-0.5">
              <div className="astra-mode-pill pill-file inline-block font-mono text-[9px] tracking-[0.14em] uppercase py-1 px-2.5 rounded-full mb-4 bg-[rgba(0,200,180,0.08)] text-[var(--teal)] border border-[rgba(0,200,180,0.18)]">
                File Viewer
              </div>
              <div className="astra-mode-title text-base font-bold mb-2">Page-aware answers</div>
              <div className="astra-mode-desc text-[13px] text-[var(--muted)] leading-relaxed mb-4">
                Open any file in the viewer. Astra sees your current page — and optionally the page image. Ask about
                what's in front of you, right now.
              </div>
              <div className="astra-mode-feature font-mono text-[10px] tracking-wide text-[rgba(245,245,247,0.35)] leading-[1.8]">
                <span className="text-[var(--teal)]">→ Sends fileId + current page</span>
                <br />
                <span className="text-[var(--teal)]">→ Optional page image for vision context</span>
                <br />
                → Answers grounded in your document
              </div>
            </div>
          </RevealWrapper>
          <RevealWrapper style={{ transitionDelay: "0.2s" }}>
            <div className="astra-mode-card p-7 bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-2xl transition-all duration-250 relative overflow-hidden hover:border-[rgba(0,200,180,0.2)] hover:-translate-y-0.5">
              <div className="astra-mode-pill pill-summary inline-block font-mono text-[9px] tracking-[0.14em] uppercase py-1 px-2.5 rounded-full mb-4 bg-[rgba(122,108,255,0.1)] text-[var(--purple)] border border-[rgba(122,108,255,0.2)]">
                Summary Viewer
              </div>
              <div className="astra-mode-title text-base font-bold mb-2">Select text → ask Astra</div>
              <div className="astra-mode-desc text-[13px] text-[var(--muted)] leading-relaxed mb-4">
                Reading a generated summary? Highlight any passage and Astra receives the exact selection — plus the
                source file — to explain or expand just that part.
              </div>
              <div className="astra-mode-feature font-mono text-[10px] tracking-wide text-[rgba(245,245,247,0.35)] leading-[1.8]">
                <span className="text-[var(--teal)]">→ Selection-level context</span>
                <br />
                <span className="text-[var(--teal)]">→ Cites the summary section</span>
                <br />
                → No need to retype what you're confused about
              </div>
            </div>
          </RevealWrapper>
        </div>
        <RevealWrapper>
          <div className="astra-prefs mt-12 py-8 px-8 bg-[rgba(13,15,18,0.8)] border border-[var(--border)] rounded-[18px] flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <div>
              <div className="astra-prefs-title text-[15px] font-bold mb-1">Astra learns your preferences</div>
              <div className="astra-prefs-sub text-[13px] text-[var(--muted)]">
                Language, answer length, teaching style, study context
              </div>
            </div>
            <div className="astra-prefs-chips flex flex-wrap gap-2 flex-1">
              <span className="pref-chip active font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-[rgba(0,200,180,0.08)] border border-[rgba(0,200,180,0.2)] text-[var(--teal)]">
                Exam-focused
              </span>
              <span className="pref-chip active font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-[rgba(0,200,180,0.08)] border border-[rgba(0,200,180,0.2)] text-[var(--teal)]">
                Balanced length
              </span>
              <span className="pref-chip active font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-[rgba(0,200,180,0.08)] border border-[rgba(0,200,180,0.2)] text-[var(--teal)]">
                Arabic
              </span>
              <span className="pref-chip font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[rgba(245,245,247,0.6)]">
                Step-by-step
              </span>
              <span className="pref-chip font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[rgba(245,245,247,0.6)]">
                Detailed
              </span>
              <span className="pref-chip font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[rgba(245,245,247,0.6)]">
                Direct
              </span>
              <span className="pref-chip font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[rgba(245,245,247,0.6)]">
                English
              </span>
              <span className="pref-chip font-mono text-[10px] tracking-wide py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[rgba(245,245,247,0.6)]">
                Turkish
              </span>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
