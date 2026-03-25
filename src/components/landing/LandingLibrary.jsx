import React from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingLibrary() {
  return (
    <section id="features" className="library-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="library-showcase grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
          <div>
            <RevealWrapper className="section-header mb-8">
              <div className="section-label mb-4">
                <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
                  Library
                </span>
              </div>
              <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
                Your material.
                <br />
                Fully indexed.
              </h2>
              <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
                Upload your PDFs, slides, notes. Synapse processes every page — not just the file. Then everything you
                do is grounded in what you actually uploaded.
              </p>
            </RevealWrapper>
            <RevealWrapper>
              <div className="library-features grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="lib-feat p-5 rounded-[14px] bg-[rgba(18,22,28,0.6)] border border-[var(--border)] transition-colors hover:border-[rgba(0,200,180,0.2)]">
                  <div className="lib-feat-icon text-lg mb-2">📄</div>
                  <div className="lib-feat-title text-sm font-semibold mb-1">PDF, DOCX, PPTX, images</div>
                  <div className="lib-feat-desc text-xs text-[var(--muted)] leading-snug">
                    Every major format, processed at the page level. Not just text — structure and context.
                  </div>
                </div>
                <div className="lib-feat p-5 rounded-[14px] bg-[rgba(18,22,28,0.6)] border border-[var(--border)] transition-colors hover:border-[rgba(0,200,180,0.2)]">
                  <div className="lib-feat-icon text-lg mb-2">📁</div>
                  <div className="lib-feat-title text-sm font-semibold mb-1">Folders & categories</div>
                  <div className="lib-feat-desc text-xs text-[var(--muted)] leading-snug">
                    Organize by rotation, block, or specialty. Color-code your folders. Mark files done.
                  </div>
                </div>
                <div className="lib-feat p-5 rounded-[14px] bg-[rgba(18,22,28,0.6)] border border-[var(--border)] transition-colors hover:border-[rgba(0,200,180,0.2)]">
                  <div className="lib-feat-icon text-lg mb-2">🔗</div>
                  <div className="lib-feat-title text-sm font-semibold mb-1">Linked to your planner</div>
                  <div className="lib-feat-desc text-xs text-[var(--muted)] leading-snug">
                    Tag files to a study period. Synapse knows which materials belong to which rotation.
                  </div>
                </div>
                <div className="lib-feat p-5 rounded-[14px] bg-[rgba(18,22,28,0.6)] border border-[var(--border)] transition-colors hover:border-[rgba(0,200,180,0.2)]">
                  <div className="lib-feat-icon text-lg mb-2">⚡</div>
                  <div className="lib-feat-title text-sm font-semibold mb-1">One source, every feature</div>
                  <div className="lib-feat-desc text-xs text-[var(--muted)] leading-snug">
                    Upload once. Generate summaries, MCQs, flashcards, and ask Astra — all from that file.
                  </div>
                </div>
              </div>
            </RevealWrapper>
          </div>
          <RevealWrapper>
            <div className="library-tree mb-4 bg-[rgba(13,15,18,0.95)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="lib-top-bar py-3.5 px-4 border-b border-[var(--border)] flex items-center gap-2">
                <div className="lib-dot w-2 h-2 rounded-full bg-[#FF5F5C]" />
                <div className="lib-dot w-2 h-2 rounded-full bg-[#FFBD2E] ml-1" />
                <div className="lib-dot w-2 h-2 rounded-full bg-[#27C93F] ml-1" />
                <span className="lib-top-title font-mono text-[11px] text-[var(--muted)] tracking-wider ml-auto">
                  Library
                </span>
              </div>
              <div className="lib-folder active py-2.5 px-4 flex items-center gap-2 text-[13px] text-[var(--text)] border-b border-white/[0.03] cursor-default">
                <span>📁</span> Internal Medicine
              </div>
              <div className="lib-file py-2 px-4 pl-10 flex items-center gap-2 text-xs text-[rgba(245,245,247,0.5)] border-b border-white/[0.02]">
                <span>📄</span> Harrison's Chapter 12 — Cardiology
                <span className="lib-file-tag ml-auto font-mono text-[9px] tracking-wider py-0.5 px-1.5 rounded bg-[rgba(0,200,180,0.08)] text-[var(--teal)] border border-[rgba(0,200,180,0.15)]">
                  Ready
                </span>
              </div>
              <div className="lib-file py-2 px-4 pl-10 flex items-center gap-2 text-xs text-[rgba(245,245,247,0.5)] border-b border-white/[0.02]">
                <span>📄</span> Lecture 4 — Heart Failure
                <span className="lib-file-tag ml-auto font-mono text-[9px] tracking-wider py-0.5 px-1.5 rounded bg-[rgba(0,200,180,0.08)] text-[var(--teal)] border border-[rgba(0,200,180,0.15)]">
                  Ready
                </span>
              </div>
              <div className="lib-file py-2 px-4 pl-10 flex items-center gap-2 text-xs text-[rgba(245,245,247,0.5)] border-b border-white/[0.02]">
                <span>📄</span> ECG Interpretation Guide
              </div>
              <div className="lib-folder py-2.5 px-4 flex items-center gap-2 text-[13px] text-[var(--muted)] border-b border-white/[0.03] cursor-default">
                <span>📁</span> Pharmacology
              </div>
              <div className="lib-folder py-2.5 px-4 flex items-center gap-2 text-[13px] text-[var(--muted)] border-b border-white/[0.03] cursor-default">
                <span>📁</span> Surgery Block
              </div>
            </div>
            <div className="library-viewer-card bg-[rgba(13,15,18,0.95)] border border-[rgba(0,200,180,0.12)] rounded-2xl overflow-hidden">
              <div className="viewer-topbar py-3 px-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
                <div className="viewer-tab active font-mono text-[11px] tracking-wide text-[var(--teal)] py-1 px-2.5 rounded-md bg-[var(--teal-dim)] border border-[rgba(0,200,180,0.18)]">
                  📄 Lecture 4 — Heart Failure
                </div>
                <div className="viewer-page-badge font-mono text-[10px] text-[var(--muted)] ml-auto">
                  Page 12 / 38
                </div>
              </div>
              <div className="viewer-body flex">
                <div className="viewer-doc flex-1 p-5 border-r border-[var(--border)]">
                  <div className="doc-page-sim bg-[rgba(20,24,30,0.8)] border border-[var(--border)] rounded-[10px] p-5 min-h-[220px]">
                    <div className="doc-line long h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-line med w-4/5 h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-highlight w-4/5 h-2 rounded bg-[rgba(0,200,180,0.18)] mb-2 relative" />
                    <div className="doc-line long h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-line short w-[60%] h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-line long h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-line med w-4/5 h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-line short w-[60%] h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-line long h-2 rounded bg-white/[0.07] mb-2" />
                    <div className="doc-line med w-4/5 h-2 rounded bg-white/[0.07] mb-2" />
                  </div>
                </div>
                <div className="viewer-astra w-[220px] p-4 flex flex-col gap-2.5">
                  <div className="astra-label font-mono text-[10px] tracking-wider uppercase text-[var(--teal)] mb-1">
                    Astra
                  </div>
                  <div className="astra-bubble user py-2.5 px-3 rounded-[10px] text-xs leading-snug bg-[rgba(63,124,255,0.12)] border border-[rgba(63,124,255,0.16)] text-[rgba(245,245,247,0.85)]">
                    What's the difference between systolic and diastolic failure on this page?
                  </div>
                  <div className="astra-bubble ai py-2.5 px-3 rounded-[10px] text-xs leading-snug bg-[rgba(0,200,180,0.06)] border border-[rgba(0,200,180,0.12)] text-[rgba(245,245,247,0.8)]">
                    On this page (p.12), systolic failure refers to reduced ejection fraction (&lt;40%), while diastolic
                    failure occurs with preserved EF but impaired relaxation...
                  </div>
                </div>
              </div>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
