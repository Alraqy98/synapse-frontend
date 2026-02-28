import React, { useState } from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingFlashcards() {
  const [flipped, setFlipped] = useState(false);

  return (
    <section className="flashcard-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="flashcard-layout grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <RevealWrapper>
            <div className="section-header mb-8">
              <div className="section-label mb-4">
                <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
                  Flashcards
                </span>
              </div>
              <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
                Three modes.
                <br />
                One goal: retention.
              </h2>
              <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
                Generate from your files. Choose how deep to go. Every card tells you which page it came from — so you
                can jump straight back to the source.
              </p>
            </div>
            <div className="fc-modes flex flex-col gap-3.5">
              <div className="fc-mode-card p-5 bg-[rgba(13,15,18,0.8)] border border-[var(--border)] rounded-[14px] transition-all hover:border-[rgba(0,200,180,0.2)] hover:translate-x-1">
                <div className="fc-mode-name text-sm font-bold mb-1">
                  ⚡ Turbo Recall{" "}
                  <span
                    className="fc-mode-tag font-mono text-[9px] tracking-wide py-0.5 px-1.5 rounded float-right mt-1"
                    style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", color: "var(--amber)" }}
                  >
                    Speed
                  </span>
                </div>
                <div className="fc-mode-desc text-xs text-[var(--muted)]">
                  Fast recall, minimal redundancy. Rapid-fire key facts. Ideal 24 hours before an exam.
                </div>
              </div>
              <div className="fc-mode-card p-5 bg-[rgba(13,15,18,0.8)] border border-[var(--border)] rounded-[14px] transition-all hover:border-[rgba(0,200,180,0.2)] hover:translate-x-1">
                <div className="fc-mode-name text-sm font-bold mb-1">
                  🎯 High Yield{" "}
                  <span
                    className="fc-mode-tag font-mono text-[9px] tracking-wide py-0.5 px-1.5 rounded float-right mt-1"
                    style={{ background: "rgba(0,200,180,0.07)", border: "1px solid rgba(0,200,180,0.2)", color: "var(--teal)" }}
                  >
                    Exam
                  </span>
                </div>
                <div className="fc-mode-desc text-xs text-[var(--muted)]">
                  Keeps only the highest exam-probability points from your material. Curated, not exhaustive.
                </div>
              </div>
              <div className="fc-mode-card p-5 bg-[rgba(13,15,18,0.8)] border border-[var(--border)] rounded-[14px] transition-all hover:border-[rgba(0,200,180,0.2)] hover:translate-x-1">
                <div className="fc-mode-name text-sm font-bold mb-1">
                  📚 Deep Mastery{" "}
                  <span
                    className="fc-mode-tag font-mono text-[9px] tracking-wide py-0.5 px-1.5 rounded float-right mt-1"
                    style={{ background: "rgba(122,108,255,0.08)", border: "1px solid rgba(122,108,255,0.2)", color: "var(--purple)" }}
                  >
                    Thorough
                  </span>
                </div>
                <div className="fc-mode-desc text-xs text-[var(--muted)]">
                  Full concepts with strong explanations. Builds lasting understanding, not just recall.
                </div>
              </div>
            </div>
          </RevealWrapper>
          <RevealWrapper style={{ transitionDelay: "0.1s" }}>
            <div
              className="card-flip-wrapper h-[240px] cursor-default"
              style={{ perspective: "1000px" }}
              onClick={() => setFlipped((f) => !f)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              aria-label="Flip card"
            >
              <div
                className="card-flip-inner w-full h-full relative transition-transform duration-[0.7s]"
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div
                  className="card-face card-front absolute inset-0 rounded-[20px] flex flex-col justify-center p-8 border border-[rgba(0,200,180,0.18)] bg-gradient-to-br from-[rgba(18,22,28,0.95)] to-[rgba(13,15,18,0.99)] shadow-[0_0_40px_rgba(0,200,180,0.08),0_20px_60px_rgba(0,0,0,0.5)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="card-face-label font-mono text-[9px] tracking-[0.14em] uppercase text-[var(--teal)] mb-4">
                    Question
                  </div>
                  <div className="card-q-text text-[15px] leading-relaxed font-semibold">
                    What is the primary difference between HFrEF and HFpEF in terms of ejection fraction and underlying
                    mechanism?
                  </div>
                  <div className="card-source-tag mt-4 font-mono text-[9px] tracking-wide text-[rgba(0,200,180,0.5)]">
                    📄 Harrison's Ch.12 — Page 47
                  </div>
                </div>
                <div
                  className="card-face card-back absolute inset-0 rounded-[20px] flex flex-col justify-center p-8 border border-[rgba(78,158,122,0.22)] bg-gradient-to-br from-[rgba(13,20,18,0.95)] to-[rgba(10,18,16,0.99)] shadow-[0_0_40px_rgba(78,158,122,0.08),0_20px_60px_rgba(0,0,0,0.5)]"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="card-face-label font-mono text-[9px] tracking-[0.14em] uppercase text-[var(--green)] mb-4">
                    Answer
                  </div>
                  <div className="card-a-text text-[13px] leading-relaxed text-[rgba(245,245,247,0.85)]">
                    <ul className="list-none p-0 space-y-1">
                      <li>
                        • <strong>HFrEF:</strong> EF &lt;40%, caused by reduced myocardial contractility (systolic
                        dysfunction)
                      </li>
                      <li>
                        • <strong>HFpEF:</strong> EF ≥50%, caused by impaired ventricular relaxation (diastolic
                        dysfunction)
                      </li>
                      <li>• HFrEF responds to ACEi/ARB + beta-blockers + spironolactone</li>
                    </ul>
                  </div>
                  <div className="card-source-tag mt-4 font-mono text-[9px] tracking-wide text-[rgba(0,200,180,0.5)]">
                    📄 Harrison's Ch.12 — Page 47
                  </div>
                </div>
              </div>
            </div>
            <div className="flip-hint text-center mt-3 font-mono text-[10px] tracking-[0.1em] uppercase text-[rgba(245,245,247,0.25)]">
              Click card to flip · Arrow keys to navigate
            </div>
            <div className="grade-row flex gap-2.5 mt-4">
              <div className="grade-btn grade-correct flex-1 py-2.5 rounded-[10px] font-mono text-[11px] tracking-wide text-center border border-[rgba(0,200,180,0.2)] bg-[rgba(0,200,180,0.07)] text-[var(--teal)] cursor-default">
                ✓ Correct
              </div>
              <div
                className="grade-btn grade-not-sure flex-1 py-2.5 rounded-[10px] font-mono text-[11px] tracking-wide text-center border cursor-default"
                style={{ borderColor: "rgba(245,166,35,0.18)", background: "rgba(245,166,35,0.06)", color: "var(--amber)" }}
              >
                ? Not sure
              </div>
              <div className="grade-btn grade-wrong flex-1 py-2.5 rounded-[10px] font-mono text-[11px] tracking-wide text-center border border-[rgba(255,75,75,0.18)] bg-[rgba(255,75,75,0.06)] text-[var(--red)] cursor-default">
                ✗ Wrong
              </div>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
