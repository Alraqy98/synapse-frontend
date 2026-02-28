import React from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingSummaries() {
  return (
    <section className="summary-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header mb-16">
          <div className="section-label mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              Summaries
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            Your file. Your stage.
            <br />
            Your exam goal.
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
            Summaries aren't one-size-fits-all. Set your academic year, specialty, and goal — then ask Astra questions
            about any passage without leaving the page.
          </p>
        </RevealWrapper>
        <div className="summary-layout grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <RevealWrapper>
            <div className="summary-modal bg-[rgba(13,15,18,0.95)] border border-[rgba(0,200,180,0.12)] rounded-[18px] overflow-hidden">
              <div className="summary-modal-header py-4 px-5 border-b border-[var(--border)]">
                <div className="summary-modal-title text-base font-bold">Generate Summary</div>
                <div className="summary-modal-sub text-xs text-[var(--muted)] mt-0.5">
                  Tailored to your stage and specialty
                </div>
              </div>
              <div className="summary-form p-5 flex flex-col gap-3.5">
                <div className="form-field">
                  <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--muted)] mb-1.5">
                    Source file
                  </label>
                  <div className="selected-file-chip flex items-center gap-2 py-2.5 px-3.5 bg-[rgba(0,200,180,0.06)] border border-[rgba(0,200,180,0.15)] rounded-[10px] text-[13px]">
                    <span className="file-chip-icon text-[var(--teal)]">📄</span>
                    Harrison's Chapter 12 — Cardiology
                  </div>
                </div>
                <div className="form-field">
                  <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--muted)] mb-1.5">
                    Academic stage
                  </label>
                  <select className="form-select w-full py-2.5 px-3.5 bg-white/[0.03] border border-white/[0.07] rounded-[10px] text-[var(--text)] text-[13px] font-sans">
                    <option>4th Year</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--muted)] mb-1.5">
                    Specialty
                  </label>
                  <select className="form-select w-full py-2.5 px-3.5 bg-white/[0.03] border border-white/[0.07] rounded-[10px] text-[var(--text)] text-[13px] font-sans">
                    <option>Internal Medicine</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--muted)] mb-1.5">
                    Goal
                  </label>
                  <div className="form-tags flex flex-wrap gap-2">
                    <span className="form-tag selected py-1.5 px-3.5 rounded-lg text-xs border border-[rgba(0,200,180,0.25)] bg-[var(--teal-dim)] text-[var(--teal)] cursor-default">
                      Exam
                    </span>
                    <span className="form-tag unselected py-1.5 px-3.5 rounded-lg text-xs border border-white/[0.06] bg-white/[0.02] text-[var(--muted)] cursor-default">
                      Understanding
                    </span>
                    <span className="form-tag unselected py-1.5 px-3.5 rounded-lg text-xs border border-white/[0.06] bg-white/[0.02] text-[var(--muted)] cursor-default">
                      Revision
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="generate-btn py-3 px-4 rounded-[10px] font-sans text-sm font-bold text-[var(--void)] bg-gradient-to-br from-[var(--teal)] to-[var(--teal-neon)] border-0 cursor-default transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,200,180,0.35)]"
                >
                  Generate Summary →
                </button>
              </div>
            </div>
          </RevealWrapper>
          <RevealWrapper style={{ transitionDelay: "0.1s" }}>
            <div className="summary-viewer-card bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-[18px] overflow-hidden">
              <div className="sv-header py-4 px-5 border-b border-[var(--border)]">
                <div className="sv-title text-[15px] font-bold mb-1">Cardiology Block Summary</div>
                <div className="sv-meta font-mono text-[10px] text-[var(--muted)] tracking-wide">
                  4th_year · internal_medicine · exam · Harrison's Ch.12
                </div>
              </div>
              <div className="sv-body p-5">
                <div className="sv-section mb-4 py-3.5 px-4 bg-white/[0.02] border border-white/[0.04] rounded-[10px]">
                  <div className="sv-section-title text-[13px] font-bold mb-2 flex items-center gap-1.5">
                    <span className="sv-section-icon text-[var(--teal)] text-xs">🫀</span>
                    Heart Failure Classification
                  </div>
                  <div className="sv-section-text text-xs text-[var(--muted)] leading-relaxed">
                    Heart failure is classified by ejection fraction: HFrEF (&lt;40%) is associated with systolic
                    dysfunction and responds well to neurohormonal blockade. HFpEF (≥50%) involves diastolic dysfunction
                    and has fewer evidence-based therapies...
                  </div>
                </div>
                <div className="sv-section mb-4 py-3.5 px-4 bg-white/[0.02] border border-white/[0.04] rounded-[10px]">
                  <div className="sv-section-title text-[13px] font-bold mb-2 flex items-center gap-1.5">
                    <span className="sv-section-icon text-[var(--teal)] text-xs">💊</span>
                    High-Yield Pharmacology
                  </div>
                  <div className="sv-section-text text-xs text-[var(--muted)] leading-relaxed">
                    ACE inhibitors reduce mortality in HFrEF. Beta-blockers (carvedilol, metoprolol) reduce sudden
                    cardiac death risk. Spironolactone indicated when EF &lt;35%...
                  </div>
                </div>
                <div className="sv-key-takeaways py-3.5 px-4 bg-[rgba(0,200,180,0.04)] border border-[rgba(0,200,180,0.1)] rounded-[10px]">
                  <div className="sv-kt-label font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--teal)] mb-2">
                    Key takeaways
                  </div>
                  <div className="sv-kt-item text-xs text-[rgba(245,245,247,0.7)] py-1 border-b border-white/[0.03] flex items-start gap-1.5">
                    <span className="text-[var(--teal)] font-mono flex-shrink-0">—</span>
                    EF &lt;40% = systolic HF; always check eligibility for ACEi + BB
                  </div>
                  <div className="sv-kt-item text-xs text-[rgba(245,245,247,0.7)] py-1 border-b border-white/[0.03] flex items-start gap-1.5">
                    <span className="text-[var(--teal)] font-mono flex-shrink-0">—</span>
                    Loop diuretics for symptom relief but do NOT improve mortality
                  </div>
                  <div className="sv-kt-item text-xs text-[rgba(245,245,247,0.7)] py-1 flex items-start gap-1.5">
                    <span className="text-[var(--teal)] font-mono flex-shrink-0">—</span>
                    NT-proBNP &gt;900 pg/mL is diagnostic threshold in acute setting
                  </div>
                </div>
              </div>
            </div>
          </RevealWrapper>
        </div>
        <RevealWrapper>
          <div className="mt-6 text-center">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] border border-[rgba(255,255,255,0.08)] rounded-full py-1 px-3">
              ✦ Share with a code · Import from a friend · Select any text → Ask Astra
            </span>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
