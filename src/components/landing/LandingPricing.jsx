import React, { useState } from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingPricing({ onSignup, isFoundingMember = false }) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="pricing-section py-[120px]" id="pricing">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10">
        <RevealWrapper className="section-header text-center mb-16">
          <div className="section-label flex justify-center mb-4">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              Pricing
            </span>
          </div>
          <h2 className="section-title font-serif text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-0.02em] mb-4 text-[var(--text)]">
            Choose your plan
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] mx-auto leading-[1.7]">
            Explorer stays free forever. Student unlocks unlimited AI, Learning State, Performance Mentor, and Planner —
            with early access pricing before billing goes live.
          </p>
        </RevealWrapper>

        <RevealWrapper>
          <div
            className="early-access-banner flex flex-wrap items-center justify-between gap-6 py-6 px-8 mb-12 rounded-2xl border border-[rgba(0,200,180,0.2)]"
            style={{
              background: "linear-gradient(135deg, rgba(0,200,180,0.08), rgba(0,245,204,0.04))",
            }}
          >
            <div className="ea-left flex items-center gap-4">
              <div
                className="ea-pulse w-2.5 h-2.5 rounded-full bg-[var(--teal-neon)] flex-shrink-0"
                style={{ boxShadow: "0 0 12px var(--teal-neon)" }}
              />
              <div>
                <div className="ea-title text-[15px] font-bold mb-0.5">Early access is live</div>
                <div className="ea-sub font-mono text-xs text-[var(--muted)]">
                  Sign up before billing goes live to lock in your rate — including $8/mo forever for early supporters.
                </div>
              </div>
            </div>
            <div
              className="ea-badge font-mono text-[10px] tracking-[0.12em] uppercase py-1.5 px-3.5 rounded-full border border-[rgba(0,200,180,0.2)] bg-[rgba(0,200,180,0.1)] text-[var(--teal)] whitespace-nowrap"
            >
              🔒 Lock in rates
            </div>
          </div>
        </RevealWrapper>

        {isFoundingMember && (
          <RevealWrapper>
            <div
              className="mb-10 p-6 rounded-2xl border border-[rgba(0,200,180,0.35)] bg-[rgba(0,200,180,0.06)] max-w-[640px] mx-auto"
            >
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] mb-2">Founding Member</div>
              <p className="text-[15px] font-semibold text-[var(--text)] mb-3">50% off Plus forever · locked-in rate</p>
              <ul className="text-[13px] text-[rgba(245,245,247,0.75)] space-y-1.5 list-none pl-0">
                <li className="flex gap-2">
                  <span className="text-[var(--teal)]">✓</span>
                  Monthly: $6/mo
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--teal)]">✓</span>
                  Annual: $40/yr
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--teal)]">✓</span>
                  Student (university email): $4/mo
                </li>
              </ul>
            </div>
          </RevealWrapper>
        )}

        <RevealWrapper>
          <div className="billing-toggle flex items-center justify-center gap-3 mb-10">
            <span
              className={`billing-label monthly-label font-mono text-[13px] cursor-pointer transition-colors ${!isAnnual ? "text-[var(--text)]" : "text-[var(--muted)]"}`}
              onClick={() => setIsAnnual(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsAnnual(false)}
              role="button"
              tabIndex={0}
            >
              Monthly ($12)
            </span>
            <button
              type="button"
              className="toggle-switch w-10 h-[22px] rounded-full border border-[rgba(0,200,180,0.25)] relative cursor-pointer transition-colors"
              style={{ background: isAnnual ? "rgba(0,200,180,0.25)" : "rgba(0,200,180,0.15)" }}
              onClick={() => setIsAnnual((a) => !a)}
              aria-label={isAnnual ? "Switch to monthly" : "Switch to annual"}
            >
              <div
                className="toggle-knob absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full bg-[var(--teal-neon)] transition-transform duration-200"
                style={{ transform: isAnnual ? "translateX(18px)" : "translateX(0)" }}
              />
            </button>
            <span
              className="billing-label annual-label font-mono text-[13px] cursor-pointer transition-colors relative"
              style={{ color: isAnnual ? "var(--text)" : "var(--muted)" }}
              onClick={() => setIsAnnual(true)}
              onKeyDown={(e) => e.key === "Enter" && setIsAnnual(true)}
              role="button"
              tabIndex={0}
            >
              Annual ($80/yr)
              <span className="billing-save-tag absolute -top-[18px] left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-wide uppercase text-[var(--teal-neon)] whitespace-nowrap">
                Best value
              </span>
            </span>
          </div>
        </RevealWrapper>

        <div className="pricing-grid landing-pricing-grid max-w-[1100px] mx-auto">
          <RevealWrapper className="h-full">
            <div className="pricing-card free p-8 bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-[20px] relative overflow-hidden h-full flex flex-col">
              <div className="pricing-name text-base font-bold mb-2">Explorer</div>
              <div className="pricing-price font-serif text-[40px] leading-none mb-1">
                <span className="text-lg opacity-50">$</span>0
              </div>
              <div className="pricing-tagline text-sm text-[var(--text)] font-medium mb-1">Free forever</div>
              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">No credit card · always free</div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                5 AI generations/day (hard limit, combined across all types)
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Unlimited file uploads
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                File-viewer Astra (page-aware AI tutor)
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Standalone Astra tutor
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Summaries, MCQ, flashcards
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Reinforcement sessions – 3 concept slots
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] mb-2.5">
                <span className="pricing-x text-white/20 flex-shrink-0">✗</span>
                <span className="text-[var(--muted)]">Full Learning State dashboard</span>
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] mb-2.5">
                <span className="pricing-x text-white/20 flex-shrink-0">✗</span>
                <span className="text-[var(--muted)]">Performance Mentor</span>
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] mb-2.5">
                <span className="pricing-x text-white/20 flex-shrink-0">✗</span>
                <span className="text-[var(--muted)]">Planner & exam countdown</span>
              </div>
              <button
                type="button"
                onClick={onSignup}
                className="pricing-cta cta-free w-full py-3 px-4 rounded-xl font-sans text-sm font-bold text-center mt-auto block bg-white/[0.05] border border-white/[0.09] text-[var(--muted)] transition-colors hover:bg-white/[0.09] hover:text-[var(--text)] cursor-pointer"
              >
                Start free
              </button>
            </div>
          </RevealWrapper>

          <RevealWrapper className="h-full" style={{ transitionDelay: "0.1s" }}>
            <div className="pricing-card pro p-8 rounded-[20px] relative overflow-hidden border border-[rgba(0,200,180,0.25)] bg-[rgba(13,20,18,0.95)] shadow-[0_0_40px_rgba(0,200,180,0.07)] h-full flex flex-col">
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: "linear-gradient(90deg, transparent, var(--teal), transparent)" }}
              />
              <span
                className="badge-popular absolute top-4 right-4 font-mono text-[8px] tracking-[0.1em] uppercase py-0.5 px-2 rounded-full border border-[rgba(0,200,180,0.25)] bg-[var(--teal-dim)] text-[var(--teal)]"
              >
                EARLY ACCESS
              </span>
              <div className="pricing-name text-base font-bold mb-2">Student</div>
              <div className="pricing-price font-serif text-[40px] leading-none mb-1">
                {isAnnual ? (
                  <>
                    <span className="text-lg opacity-50">$</span>80
                    <span className="text-lg opacity-50">/yr</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg opacity-50">$</span>12
                    <span className="text-lg opacity-50">/mo</span>
                  </>
                )}
              </div>
              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">
                {isAnnual
                  ? "Billed annually · cancel anytime · best value"
                  : "Billed monthly · cancel anytime"}
              </div>
              <div className="pricing-options text-[11px] text-[var(--muted)] font-mono space-y-0.5 mb-3">
                <div>Monthly: $12/mo</div>
                <div>Annual: $80/year (best value)</div>
                <div>Student (university email): $8/mo</div>
              </div>
              <div
                className="loyalty-strip my-3 py-3 px-3.5 rounded-[10px] text-[12px] leading-snug border border-[rgba(0,200,180,0.35)] bg-[rgba(0,200,180,0.12)] text-[rgba(245,245,247,0.92)]"
              >
                <span className="text-[var(--teal-neon)] mr-1">🎁</span>
                <strong className="text-[var(--teal)]">Early access offer:</strong> Sign up before billing goes live and
                pay <strong className="text-[var(--teal)]">$8/mo forever</strong> — even after we raise prices. + 2 free
                months on annual.
              </div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              {[
                "Everything in Explorer",
                "Unlimited AI generations (all types)",
                "Full Learning State – IMPROVING / STABLE / DECLINING",
                "Performance Mentor — weakest file & page",
                "Planner — rotation periods, exam countdown",
                "Cross-feature intelligence",
                "Summary share codes",
              ].map((line) => (
                <div
                  key={line}
                  className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5"
                >
                  <span className="pricing-check flex-shrink-0" style={{ color: "var(--teal-neon)" }}>
                    ✓
                  </span>
                  {line}
                </div>
              ))}
              <button
                type="button"
                onClick={onSignup}
                className="pricing-cta cta-pro w-full py-3.5 px-4 rounded-xl font-sans text-sm font-bold text-center mt-auto block border-0 text-[var(--void)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,200,180,0.4)]"
                style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-neon))" }}
              >
                Lock in early access rate →
              </button>
            </div>
          </RevealWrapper>

          <RevealWrapper className="h-full" style={{ transitionDelay: "0.2s" }}>
            <div className="pricing-card exam-mode-card flex flex-col h-full min-h-0 p-8 rounded-[20px] relative overflow-hidden border bg-[rgba(13,15,18,0.9)] border-[rgba(0,200,180,0.3)]">
              <div className="exam-mode-card-header flex flex-col gap-1 mb-2">
                <div className="pricing-name text-base font-bold text-[var(--text)]">Exam Mode</div>
                <div className="text-sm text-[var(--muted)]">Free unlock</div>
              </div>

              <div className="exam-mode-card-details flex flex-col flex-1 min-h-0 gap-0 my-4">
                <div className="exam-detail-item">
                  <span className="exam-detail-label">Trigger:</span>
                  <span className="exam-detail-value">Add exam date in Planner</span>
                </div>
                <div className="exam-detail-item">
                  <span className="exam-detail-label">Duration:</span>
                  <span className="exam-detail-value">2 weeks from exam date</span>
                </div>
                <div className="exam-detail-item">
                  <span className="exam-detail-label">Unlocks:</span>
                  <span className="exam-detail-value">Unlimited generations + full analytics</span>
                </div>
                <div className="exam-detail-item exam-detail-item-last">
                  <span className="exam-detail-label">Cost:</span>
                  <span className="exam-detail-value">Free gift when you plan ahead</span>
                </div>
              </div>

              <div className="exam-mode-card-features">
                <p className="exam-feature-description text-[0.95rem] leading-relaxed text-[rgba(245,245,247,0.55)] m-0">
                  Automatically unlocks when you add an exam date to your Planner. One-time unlock per exam. No strings
                  attached.
                </p>
              </div>

              <a
                href="#planner"
                className="exam-cta-secondary pricing-cta mt-auto w-full py-3 px-4 rounded-xl font-sans text-sm font-bold text-center block no-underline"
              >
                Plan your exam →
              </a>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
