import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RevealWrapper from "./RevealWrapper";
import { supabase } from "../../lib/supabaseClient";

function buildCheckoutUrls(userEmail) {
  const q = encodeURIComponent(userEmail || "");
  return {
    monthly: `https://synapse-app.lemonsqueezy.com/checkout/buy/fbd79167-5ccc-445d-b2a9-e44684a891d5?enabled=1450770&checkout[email]=${q}`,
    annual: `https://synapse-app.lemonsqueezy.com/checkout/buy/20dffce6-e573-4528-aaae-9b96d8bedaff?enabled=1450777&checkout[email]=${q}`,
    earlyAccess: `https://synapse-app.lemonsqueezy.com/checkout/buy/4eba9b23-54a6-44a5-88ee-ae8ded2cea58?enabled=1450780&checkout[email]=${q}`,
  };
}

export default function LandingPricing({ onSignup, isFoundingMember = false, userEmail: userEmailProp }) {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user?.email) {
        setUserEmail(user.email);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session?.user?.email) setUserEmail(session.user.email);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const effectiveEmail = userEmailProp ?? userEmail;

  const openCheckout = useCallback(
    (kind) => {
      const email = effectiveEmail?.trim();
      if (!email) {
        navigate("/signup");
        onSignup?.();
        return;
      }
      const urls = buildCheckoutUrls(email);
      window.open(urls[kind], "_blank", "noopener,noreferrer");
    },
    [effectiveEmail, navigate, onSignup]
  );

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
            with early access pricing.
          </p>
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
              onClick={() => {
                setIsAnnual(false);
                openCheckout("monthly");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsAnnual(false);
                  openCheckout("monthly");
                }
              }}
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
              onClick={() => {
                setIsAnnual(true);
                openCheckout("annual");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsAnnual(true);
                  openCheckout("annual");
                }
              }}
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
            <div className="pricing-card explorer-card h-full flex flex-col relative overflow-hidden">
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
            <div className="pricing-card student-card h-full flex flex-col relative overflow-hidden">
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
                <strong className="text-[var(--teal)]">Early access offer:</strong> Lock in $8/mo forever. + 2 free
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
                onClick={() => openCheckout("earlyAccess")}
                className="pricing-cta cta-pro w-full py-3.5 px-4 rounded-xl font-sans text-sm font-bold text-center mt-auto block border-0 text-[var(--void)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,200,180,0.4)]"
                style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-neon))" }}
              >
                Lock in early access rate →
              </button>
            </div>
          </RevealWrapper>

          <RevealWrapper className="h-full" style={{ transitionDelay: "0.2s" }}>
            <div className="pricing-card exam-mode-card flex flex-col h-full min-h-0 relative overflow-hidden">
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
