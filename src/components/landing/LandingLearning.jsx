import React from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingLearning() {
  return (
    <section className="learning-section py-[120px]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header mb-16">
          <div className="section-label mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              Learning Analytics
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            Three words that
            <br />
            change how you study.
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] leading-[1.7]">
            DECLINING. STABLE. IMPROVING. Synapse computes your learning state from every session and tells you which
            concept is actively limiting your performance — and what to do about it.
          </p>
        </RevealWrapper>
        <div className="learning-layout grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8 items-start">
          <RevealWrapper>
            <div className="state-card bg-[rgba(13,15,18,0.95)] border border-[var(--border)] rounded-[18px] overflow-hidden">
              <div className="state-header py-5 px-6 border-b border-[var(--border)]">
                <div className="state-eyebrow font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] mb-3">
                  Current learning state
                </div>
                <div className="state-badge state-declining inline-flex items-center gap-2 py-2 px-4 rounded-full font-serif text-[22px] bg-[rgba(255,75,75,0.08)] border border-[rgba(255,75,75,0.2)] text-[var(--red)]">
                  <div className="state-dot declining-dot w-2 h-2 rounded-full bg-[var(--red)]" />
                  DECLINING
                </div>
                <div className="state-momentum mt-2 text-[13px] text-[var(--muted)]">
                  Accuracy dropped <span className="momentum-val text-[var(--red)] font-semibold">−12%</span> in 7 days
                  across 3 concepts
                </div>
              </div>
              <div className="state-body p-5">
                <div className="sparkline-wrap mb-5">
                  <div className="sparkline-label font-mono text-[9px] tracking-[0.1em] uppercase text-[var(--muted)] mb-2">
                    Session accuracy — last 8 sessions
                  </div>
                  <svg className="sparkline-svg w-full h-12" viewBox="0 0 280 48">
                    <polyline
                      fill="none"
                      stroke="rgba(255,75,75,0.6)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="10,12 50,10 90,16 130,14 170,24 210,30 250,40 270,44"
                    />
                    <circle cx="270" cy="44" r="3" fill="var(--red)" />
                  </svg>
                </div>
                <div className="risk-panel p-4 bg-[rgba(255,75,75,0.05)] border border-[rgba(255,75,75,0.14)] rounded-xl mb-3.5">
                  <div className="risk-eyebrow font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--red)] mb-2">
                    PRIMARY RISK · CHRONIC
                  </div>
                  <div className="risk-concept text-sm font-bold mb-1">Systolic vs Diastolic Heart Failure</div>
                  <div className="risk-meta flex gap-2.5 font-mono text-[10px] text-[var(--muted)]">
                    <span>Accuracy: 41%</span>
                    <span>·</span>
                    <span>23 attempts</span>
                  </div>
                  <div className="risk-badges flex flex-wrap gap-1.5 mt-2.5">
                    <span className="risk-badge font-mono text-[9px] tracking-wide py-0.5 px-2 rounded bg-[rgba(255,75,75,0.08)] border border-[rgba(255,75,75,0.16)] text-[rgba(255,150,150,0.8)]">
                      Low accuracy trend
                    </span>
                    <span className="risk-badge font-mono text-[9px] tracking-wide py-0.5 px-2 rounded bg-[rgba(255,75,75,0.08)] border border-[rgba(255,75,75,0.16)] text-[rgba(255,150,150,0.8)]">
                      Performance fluctuating
                    </span>
                    <span className="risk-badge font-mono text-[9px] tracking-wide py-0.5 px-2 rounded bg-[rgba(255,75,75,0.08)] border border-[rgba(255,75,75,0.16)] text-[rgba(255,150,150,0.8)]">
                      Extended solve time
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="prescription-btn w-full py-3 px-4 rounded-[10px] font-sans text-[13px] font-semibold text-[var(--green-neon)] bg-[linear-gradient(135deg,rgba(78,158,122,0.12),rgba(91,255,168,0.08))] border border-[rgba(78,158,122,0.25)] flex items-center justify-center gap-2 cursor-default"
                >
                  ⚡ Start 12-Minute Focus Session
                </button>
              </div>
            </div>
          </RevealWrapper>
          <RevealWrapper style={{ transitionDelay: "0.1s" }}>
            <div className="timeline-panel p-7 bg-[rgba(13,15,18,0.95)] border border-[var(--border)] rounded-[18px]">
              <div className="timeline-title font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--muted)] mb-5">
                Concept breakdown
              </div>
              <div className="concept-list flex flex-col gap-2.5">
                {[
                  { name: "Systolic HF Pathophysiology", acc: 41, color: "var(--red)", trend: "↓" },
                  { name: "Beta-blocker Pharmacology", acc: 62, color: "var(--amber)", trend: "→" },
                  { name: "ACE Inhibitor Mechanism", acc: 78, color: "var(--teal)", trend: "↑" },
                  { name: "Fluid Management in HF", acc: 55, color: "var(--amber)", trend: "→" },
                  { name: "Digoxin Use Cases", acc: 85, color: "var(--green)", trend: "↑" },
                  { name: "NYHA Classification", acc: 91, color: "var(--green)", trend: "↑" },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="concept-row py-3.5 px-4 bg-white/[0.02] border border-white/[0.04] rounded-[10px] flex items-center gap-3"
                  >
                    <div className="concept-name flex-1 text-[13px]">{c.name}</div>
                    <div className="concept-acc-bar-wrap w-[100px] h-1 bg-white/[0.07] rounded overflow-hidden">
                      <div
                        className="concept-acc-bar h-full rounded"
                        style={{ width: `${c.acc}%`, background: c.color }}
                      />
                    </div>
                    <div className="concept-acc font-mono text-[11px] w-9 text-right" style={{ color: c.color }}>
                      {c.acc}%
                    </div>
                    <div className="concept-trend font-mono text-[10px] w-5 text-center" style={{ color: c.color }}>
                      {c.trend}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-[rgba(0,200,180,0.04)] border border-[rgba(0,200,180,0.1)] rounded-[10px]">
                <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--teal)] mb-2">
                  System message
                </div>
                <div className="text-xs text-[var(--muted)] leading-relaxed">
                  "Your performance is currently unstable. Immediate reinforcement of high-risk concepts is recommended.{" "}
                  <strong className="text-[var(--text)]">Start a focus session for Systolic HF — it's actively limiting your progress.</strong>"
                </div>
              </div>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
