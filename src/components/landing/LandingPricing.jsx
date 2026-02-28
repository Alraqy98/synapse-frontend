import React, { useState } from "react";
import RevealWrapper from "./RevealWrapper";

export default function LandingPricing({ onSignup }) {
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
            Everything free.
            <br />
            For now.
          </h2>
          <p className="section-sub text-[17px] text-[var(--muted)] max-w-[560px] mx-auto leading-[1.7]">
            Synapse is in early access. Every feature is fully unlocked while we finalize pricing. Pro is launching in
            the coming weeks — sign up today and lock in your rate forever.
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
                <div className="ea-title text-[15px] font-bold mb-0.5">
                  Early access is live — everything is free right now
                </div>
                <div className="ea-sub font-mono text-xs text-[var(--muted)]">
                  Pro plan launching soon · Sign up before billing goes live to lock in your rate
                </div>
              </div>
            </div>
            <div
              className="ea-badge font-mono text-[10px] tracking-[0.12em] uppercase py-1.5 px-3.5 rounded-full border border-[rgba(0,200,180,0.2)] bg-[rgba(0,200,180,0.1)] text-[var(--teal)] whitespace-nowrap"
            >
              🔒 Lock in $8/mo forever
            </div>
          </div>
        </RevealWrapper>

        <RevealWrapper>
          <div className="billing-toggle flex items-center justify-center gap-3 mb-10">
            <span
              className={`billing-label monthly-label font-mono text-[13px] cursor-pointer transition-colors ${!isAnnual ? "text-[var(--text)]" : "text-[var(--muted)]"}`}
              onClick={() => setIsAnnual(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsAnnual(false)}
              role="button"
              tabIndex={0}
            >
              Monthly
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
              Annual
              <span className="billing-save-tag absolute -top-[18px] left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-wide uppercase text-[var(--teal-neon)] whitespace-nowrap">
                Save 33%
              </span>
            </span>
          </div>
        </RevealWrapper>

        <div className="pricing-grid grid grid-cols-1 md:grid-cols-3 gap-5 items-start max-w-[900px] mx-auto md:max-w-none">
          <RevealWrapper>
            <div className="pricing-card free p-8 bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-[20px] relative overflow-hidden">
              <div className="pricing-badge badge-free font-mono text-[9px] tracking-[0.12em] uppercase inline-block py-1 px-2.5 rounded-full mb-5 bg-white/[0.05] border border-white/[0.08] text-[var(--muted)]">
                Free forever
              </div>
              <div className="pricing-name text-base font-bold mb-2">Explorer</div>
              <div className="pricing-price font-serif text-[40px] leading-none mb-1">
                <span className="text-lg opacity-50">$</span>0
              </div>
              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">No credit card · always free</div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Unlimited file uploads
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                File-viewer Astra (page-aware)
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
                Reinforcement sessions — 3 concept slots
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
                className="pricing-cta cta-free w-full py-3 px-4 rounded-xl font-sans text-sm font-bold text-center mt-6 block bg-white/[0.05] border border-white/[0.09] text-[var(--muted)] transition-colors hover:bg-white/[0.09] hover:text-[var(--text)] cursor-pointer"
              >
                Start free
              </button>
            </div>
          </RevealWrapper>

          <RevealWrapper style={{ transitionDelay: "0.1s" }}>
            <div className="pricing-card pro p-8 rounded-[20px] relative overflow-hidden border border-[rgba(0,200,180,0.25)] bg-[rgba(13,20,18,0.95)] shadow-[0_0_40px_rgba(0,200,180,0.07)]">
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: "linear-gradient(90deg, transparent, var(--teal), transparent)" }}
              />
              <span
                className="badge-popular absolute top-4 right-4 font-mono text-[8px] tracking-[0.1em] uppercase py-0.5 px-2 rounded-full border border-[rgba(0,200,180,0.25)] bg-[var(--teal-dim)] text-[var(--teal)]"
              >
                Early access
              </span>
              <div className="pricing-badge badge-pro font-mono text-[9px] tracking-[0.12em] uppercase inline-block py-1 px-2.5 rounded-full mb-5 bg-[rgba(0,200,180,0.1)] border border-[rgba(0,200,180,0.2)] text-[var(--teal)]">
                Pro
              </div>
              <div className="pricing-name text-base font-bold mb-2">Student</div>
              <div className="pricing-price font-serif text-[40px] leading-none mb-1">
                <span className="text-lg opacity-50">$</span>
                {isAnnual ? "8" : "12"}
                <span className="text-lg opacity-50">/mo</span>
              </div>
              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">
                {isAnnual ? "$96/yr · 2 months free · cancel anytime" : "Billed monthly · cancel anytime"}
              </div>
              <div
                className="loyalty-strip my-3 py-2.5 px-3.5 rounded-[10px] text-[11px] font-mono leading-snug border border-[rgba(91,255,168,0.15)]"
                style={{ background: "rgba(91,255,168,0.05)", color: "rgba(91,255,168,0.85)" }}
              >
                🎁 <strong className="text-[var(--green-neon)]">Early access offer:</strong> Sign up before billing goes
                live and pay <strong className="text-[var(--green-neon)]">$8/mo forever</strong> — even after we raise
                prices. + 2 free months on annual.
              </div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              {[
                "Everything in Explorer",
                "Unlimited reinforcement sessions",
                "Full Learning State — IMPROVING / STABLE / DECLINING",
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
                className="pricing-cta cta-pro w-full py-3 px-4 rounded-xl font-sans text-sm font-bold text-center mt-6 block border-0 text-[var(--void)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,200,180,0.4)]"
                style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-neon))" }}
              >
                Lock in early access rate →
              </button>
            </div>
          </RevealWrapper>

          <RevealWrapper style={{ transitionDelay: "0.2s" }}>
            <div className="pricing-card team p-8 bg-[rgba(13,13,18,0.9)] border border-[rgba(63,124,255,0.18)] rounded-[20px] relative overflow-hidden">
              <div className="pricing-badge badge-team font-mono text-[9px] tracking-[0.12em] uppercase inline-block py-1 px-2.5 rounded-full mb-5 bg-[rgba(63,124,255,0.08)] border border-[rgba(63,124,255,0.18)] text-[var(--blue)]">
                Coming soon
              </div>
              <div className="pricing-name text-base font-bold mb-2">Team</div>
              <div className="pricing-price font-sans text-[28px] font-bold mb-1">Custom</div>
              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">For study groups & universities</div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              {[
                "Everything in Student",
                "Shared library & folders",
                "Import peer summaries",
                "Admin dashboard",
                "Priority support",
                "OSCE & Oral Exam (when live)",
              ].map((line) => (
                <div
                  key={line}
                  className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5"
                >
                  <span className="pricing-check flex-shrink-0 text-[var(--blue)]">✓</span>
                  {line}
                </div>
              ))}
              <button
                type="button"
                className="pricing-cta cta-team w-full py-3 px-4 rounded-xl font-sans text-sm font-bold text-center mt-6 block border border-[rgba(63,124,255,0.2)] bg-[rgba(63,124,255,0.1)] text-[var(--blue)] cursor-pointer transition-colors hover:bg-[rgba(63,124,255,0.18)]"
              >
                Join waitlist
              </button>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
