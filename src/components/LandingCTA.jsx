import React from "react";
import RevealWrapper from "./landing/RevealWrapper";

const LandingCTA = ({ onSignup }) => {
  return (
    <section className="cta-section py-[160px] text-center relative overflow-hidden">
      <div
        className="cta-orb absolute w-[700px] h-[700px] rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,200,180,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10 relative">
        <RevealWrapper className="cta-content">
          <h2 className="cta-title font-serif text-[clamp(36px,4.5vw,56px)] leading-[1.12] tracking-[-0.02em] mb-4 text-[var(--text)]">
            Synapse knows your history,
            <br />
            your weak spots, your exam date.
            <br />
            <em className="not-italic bg-gradient-to-r from-[var(--teal)] to-[var(--teal-neon)] bg-clip-text text-transparent">
              Start using it.
            </em>
          </h2>
          <p className="cta-sub text-[17px] text-[var(--muted)] mb-8">
            Stop guessing what to study next. Your performance data is waiting.
          </p>
          <button
            type="button"
            onClick={onSignup}
            className="btn-primary-lg inline-block py-4 px-8 rounded-xl font-sans text-base font-bold text-[var(--void)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,200,180,0.4)]"
            style={{
              background: "linear-gradient(135deg, var(--teal), var(--teal-neon))",
              border: "none",
            }}
          >
            Start for free — no card needed
          </button>
          <div className="cta-footnote mt-4 font-mono text-[11px] tracking-wide text-[var(--muted)]">
            Upload your first file in under 60 seconds.
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
};

export default LandingCTA;
