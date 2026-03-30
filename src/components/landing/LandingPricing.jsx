import React from "react";
import RevealWrapper from "./RevealWrapper";

const PAID_FEATURES = [
  "Unlimited access — every feature, no caps",
  "Full Learning State, Performance Mentor & Planner",
  "Summaries, MCQ, flashcards, reinforcement & more",
  "Cancel anytime — no long-term lock-in",
];

export default function LandingPricing({ onSignup, isFoundingMember = false }) {
  // TODO: payment — wire checkout (e.g. Lemon Squeezy / Stripe) for monthly & annual plans; pass user email from session when ready.

  const handlePaidCta = () => {
    // TODO: replace with checkout URL or billing portal when subscription integration ships.
    onSignup?.();
  };

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
            Start with a 14-day trial — no credit card. Upgrade anytime for unlimited access across Synapse.
          </p>
        </RevealWrapper>

        {isFoundingMember && (
          <RevealWrapper>
            <div
              className="mb-10 p-6 rounded-2xl border border-[rgba(0,200,180,0.35)] bg-[rgba(0,200,180,0.06)] max-w-[640px] mx-auto"
            >
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] mb-2">
                Founding Member
              </div>
              <p className="text-[15px] font-semibold text-[var(--text)] mb-3">
                Your locked-in rate applies at checkout when billing goes live.
              </p>
              <p className="text-[13px] text-[rgba(245,245,247,0.75)] m-0">
                {/* TODO: surface founding-member pricing from API when available */}
                You&apos;ll see your founding discount reflected before you pay.
              </p>
            </div>
          </RevealWrapper>
        )}

        <div className="pricing-grid landing-pricing-grid max-w-[1100px] mx-auto">
          {/* Free — 14-day trial */}
          <RevealWrapper className="h-full">
            <div className="pricing-card explorer-card h-full flex flex-col relative overflow-hidden">
              <div className="pricing-name text-base font-bold mb-2">Free</div>
              <div className="pricing-price font-serif text-[40px] leading-none mb-1">
                <span className="text-lg opacity-50">$</span>0
              </div>
              <div className="pricing-tagline text-sm text-[var(--text)] font-medium mb-1">
                14-day trial
              </div>
              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">
                No credit card required · try the full experience
              </div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Full product access during your trial
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Same onboarding and core workflows as paid
              </div>
              <div className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5">
                <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                Upgrade anytime when you&apos;re ready
              </div>
              <p className="text-[12px] text-[var(--muted)] leading-snug mt-1 mb-2">
                After the trial, choose Monthly or Annual for unlimited access.
              </p>
              <button
                type="button"
                onClick={onSignup}
                className="pricing-cta cta-free w-full py-3 px-4 rounded-xl font-sans text-sm font-bold text-center mt-auto block bg-white/[0.05] border border-white/[0.09] text-[var(--muted)] transition-colors hover:bg-white/[0.09] hover:text-[var(--text)] cursor-pointer"
              >
                Start free trial
              </button>
            </div>
          </RevealWrapper>

          {/* Monthly — recommended */}
          <RevealWrapper className="h-full" style={{ transitionDelay: "0.1s" }}>
            <div className="pricing-card student-card h-full flex flex-col relative overflow-hidden">
              <span className="badge-popular absolute top-4 right-4 font-mono text-[8px] tracking-[0.1em] uppercase py-0.5 px-2 rounded-full border border-[rgba(0,200,180,0.45)] bg-[rgba(0,200,180,0.12)] text-[var(--teal-neon)]">
                Recommended
              </span>
              <div className="pricing-name text-base font-bold mb-2">Monthly</div>

              <div className="flex flex-col gap-3 mb-3">
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="pricing-price font-serif text-[40px] leading-none">
                      <span className="text-lg opacity-50">$</span>15
                      <span className="text-lg opacity-50">/mo</span>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">Standard rate · billed monthly</div>
                </div>

                <div className="rounded-xl border border-[rgba(0,200,180,0.45)] bg-[rgba(0,200,180,0.1)] px-3.5 py-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="inline-flex items-center font-mono text-[9px] tracking-[0.12em] uppercase py-0.5 px-2 rounded-md bg-[rgba(0,200,180,0.2)] text-[var(--teal-neon)] border border-[rgba(0,245,204,0.35)]">
                      University email
                    </span>
                    <span className="text-[11px] text-[rgba(245,245,247,0.75)]">
                      .edu or .std
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-[28px] leading-none text-[var(--text)]">
                      <span className="text-base opacity-50">$</span>10
                      <span className="text-base opacity-50">/mo</span>
                    </span>
                    <span className="text-[12px] text-[var(--teal)] font-medium">Student &amp; faculty discount</span>
                  </div>
                </div>
              </div>

              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">
                Unlimited access · cancel anytime
              </div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              {PAID_FEATURES.map((line) => (
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
                onClick={handlePaidCta}
                className="pricing-cta cta-pro w-full py-3.5 px-4 rounded-xl font-sans text-sm font-bold text-center mt-auto block border-0 text-[var(--void)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,200,180,0.4)]"
                style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-neon))" }}
              >
                Get Monthly
              </button>
            </div>
          </RevealWrapper>

          {/* Annual */}
          <RevealWrapper className="h-full" style={{ transitionDelay: "0.2s" }}>
            <div className="pricing-card explorer-card h-full flex flex-col relative overflow-hidden">
              <span className="absolute top-4 right-4 font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--teal-neon)] whitespace-nowrap">
                Best value
              </span>
              <div className="pricing-name text-base font-bold mb-2">Annual</div>
              <div className="pricing-price font-serif text-[40px] leading-none mb-1">
                <span className="text-lg opacity-50">$</span>80
                <span className="text-lg opacity-50">/yr</span>
              </div>
              <div className="pricing-tagline text-sm text-[var(--text)] font-medium mb-1">
                Save vs paying monthly all year
              </div>
              <div className="pricing-billing text-xs text-[var(--muted)] mb-2">
                Unlimited access · billed once per year · cancel anytime
              </div>
              <div className="pricing-divider h-px bg-[var(--border)] my-5" />
              {PAID_FEATURES.map((line) => (
                <div
                  key={`annual-${line}`}
                  className="pricing-feature flex items-start gap-2.5 text-[13px] text-[rgba(245,245,247,0.7)] mb-2.5"
                >
                  <span className="pricing-check text-[var(--teal)] flex-shrink-0">✓</span>
                  {line}
                </div>
              ))}
              <button
                type="button"
                onClick={handlePaidCta}
                className="pricing-cta w-full py-3 px-4 rounded-xl font-sans text-sm font-bold text-center mt-auto block bg-white/[0.05] border border-white/[0.12] text-[var(--text)] transition-colors hover:bg-white/[0.09] hover:border-[rgba(0,200,180,0.35)] cursor-pointer"
              >
                Get Annual
              </button>
            </div>
          </RevealWrapper>
        </div>

        <RevealWrapper>
          <p className="text-center text-[13px] text-[var(--muted)] max-w-[520px] mx-auto mt-12 leading-relaxed">
            {/* TODO: link to billing FAQ / terms when subscription docs exist */}
            Payment processing and subscription management will be available here soon. Questions? Reach out from the app
            after you sign up.
          </p>
        </RevealWrapper>
      </div>
    </section>
  );
}
