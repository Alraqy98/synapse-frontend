import React from "react";
import SynapseCanvas from "./landing/SynapseCanvas";

const LogoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="13" r="12" stroke="#00C8B4" strokeWidth="1.5" opacity="0.5" />
    <circle cx="13" cy="13" r="4" fill="#00F5CC" />
    <path d="M13 1v4M13 21v4M1 13h4M21 13h4" stroke="#00C8B4" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export default function LandingHero({ onSignup, onLogin }) {
  return (
    <section className="min-h-screen grid place-items-center pt-[100px] pb-16 px-6 md:px-[60px] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 100% 80% at 70% 50%, black 20%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 100% 80% at 70% 50%, black 20%, transparent 100%)",
          }}
        />
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[80px] opacity-35"
          style={{
            background: "radial-gradient(circle, rgba(0,200,180,0.22) 0%, transparent 70%)",
            top: -300,
            right: -100,
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-35"
          style={{
            background: "radial-gradient(circle, rgba(63,124,255,0.18) 0%, transparent 70%)",
            bottom: -100,
            left: -100,
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-35"
          style={{
            background: "radial-gradient(circle, rgba(122,108,255,0.15) 0%, transparent 70%)",
            top: "40%",
            left: "30%",
          }}
        />
        <SynapseCanvas />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 pt-5">
        {/* Left: copy — forced visible (above fold) */}
        <div className="reveal visible hero-left">
          <div className="mb-6 hero-label">
            <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
              <span className="dot w-1.5 h-1.5 rounded-full bg-[var(--teal-neon)]" />
              Built for medical students
            </span>
          </div>
          <h1 className="hero-headline font-serif text-[clamp(44px,5.5vw,80px)] leading-[1.02] tracking-[-0.025em] mb-6 text-[var(--text)]">
            It knows which
            <br />
            concept is
            <br />
            <em>failing you.</em>
          </h1>
          <p className="hero-sub font-sans text-[17px] font-normal text-[var(--muted)] max-w-[440px] mb-9 leading-[1.75]">
            Synapse tracks your performance across every session, identifies your primary risk concept, and builds a
            targeted session to fix it — before your exam does.
          </p>
          <div className="hero-actions flex items-center gap-3 flex-wrap mb-10">
            <button
              type="button"
              onClick={onSignup}
              className="btn-primary-lg font-sans text-[15px] font-bold text-[var(--void)] bg-gradient-to-br from-[var(--teal)] to-[var(--teal-neon)] border-0 py-3.5 px-8 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(0,200,180,0.4)] inline-block tracking-tight"
            >
              Start for free
            </button>
            <a
              href="#problem"
              className="btn-ghost-lg font-sans text-[15px] font-medium text-[var(--muted)] bg-white/5 border border-white/10 py-3.5 px-7 rounded-xl transition-all inline-block hover:text-[var(--text)] hover:bg-white/[0.08] hover:-translate-y-px"
            >
              See how it works
            </a>
          </div>
          <div className="hero-footnote font-mono text-[11px] tracking-wider text-[rgba(245,245,247,0.22)]">
            No credit card · Upload your first file in 60 seconds
          </div>
        </div>

        {/* Right: live state mockup — forced visible */}
        <div className="reveal visible hero-right relative">
          <div className="hero-state-card bg-[rgba(11,14,18,0.97)] border border-[rgba(255,75,75,0.18)] rounded-[20px] overflow-hidden shadow-[0_0_60px_rgba(255,75,75,0.05),0_32px_64px_rgba(0,0,0,0.5)] max-h-[85vh]">
            <div className="hsc-topbar py-3.5 px-4 border-b border-white/5 flex items-center justify-between">
              <span className="hsc-title font-mono text-[10px] tracking-wider uppercase text-[var(--muted)]">
                Learning State — Your Account
              </span>
              <span className="hsc-live flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase text-[var(--teal)]">
                <span className="hsc-live-dot w-1.5 h-1.5 rounded-full bg-[var(--teal-neon)]" />
                Live
              </span>
            </div>
            <div className="hsc-state-row py-3.5 px-4 border-b border-white/5 flex items-center justify-between">
              <div className="hsc-state-badge inline-flex items-center gap-2 py-2 px-4 rounded-full bg-[rgba(255,75,75,0.08)] border border-[rgba(255,75,75,0.2)]">
                <div className="hsc-state-dot w-[7px] h-[7px] rounded-full bg-[var(--red)] shadow-[0_0_8px_var(--red)]" />
                <span className="hsc-state-text font-serif text-lg text-[var(--red)] tracking-tight">DECLINING</span>
              </div>
              <span className="hsc-momentum font-mono text-[11px] text-[var(--red)]">−12% in 7 days</span>
            </div>
            <div className="hsc-sparkline py-3.5 px-4 border-b border-white/5">
              <div className="hsc-spark-label font-mono text-[9px] tracking-wider uppercase text-white/25 mb-2">
                Session accuracy — last 8 sessions
              </div>
              <svg width="100%" height="44" viewBox="0 0 320 44" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,75,75,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,75,75,0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,10 L46,8 L92,15 L138,13 L184,22 L230,28 L276,36 L320,40 L320,44 L0,44 Z"
                  fill="url(#spark-fill)"
                />
                <polyline
                  fill="none"
                  stroke="rgba(255,75,75,0.75)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,10 46,8 92,15 138,13 184,22 230,28 276,36 320,40"
                />
                <circle cx="320" cy="40" r="3.5" fill="#FF4B4B" />
              </svg>
            </div>
            <div className="hsc-risk py-3 px-4 border-b border-white/5">
              <div className="hsc-risk-eyebrow font-mono text-[9px] tracking-wider uppercase text-[var(--red)] mb-2 flex items-center gap-2">
                Primary risk concept
                <span className="hsc-chronic bg-[rgba(255,75,75,0.12)] border border-[rgba(255,75,75,0.22)] py-0.5 px-1.5 rounded text-[8px] tracking-wider">
                  CHRONIC
                </span>
              </div>
              <div className="hsc-concept text-sm font-bold mb-1">Systolic vs Diastolic Heart Failure</div>
              <div className="hsc-risk-meta flex gap-3 font-mono text-[10px] text-[var(--muted)] mb-2">
                <span>Accuracy: 41%</span>
                <span>·</span>
                <span>23 attempts</span>
                <span>·</span>
                <span className="text-[#FF4B4B]">HIGH RISK</span>
              </div>
              <div className="hsc-risk-badges flex gap-1.5 flex-wrap">
                <span className="hsc-risk-badge font-mono text-[9px] tracking-wide py-0.5 px-2 rounded bg-[rgba(255,75,75,0.07)] border border-[rgba(255,75,75,0.15)] text-[rgba(255,160,160,0.8)]">
                  Low accuracy trend
                </span>
                <span className="hsc-risk-badge font-mono text-[9px] tracking-wide py-0.5 px-2 rounded bg-[rgba(255,75,75,0.07)] border border-[rgba(255,75,75,0.15)] text-[rgba(255,160,160,0.8)]">
                  Performance fluctuating
                </span>
                <span className="hsc-risk-badge font-mono text-[9px] tracking-wide py-0.5 px-2 rounded bg-[rgba(255,75,75,0.07)] border border-[rgba(255,75,75,0.15)] text-[rgba(255,160,160,0.8)]">
                  Extended solve time
                </span>
              </div>
            </div>
            <div className="hsc-cta my-2.5 mx-4 py-2.5 px-4 bg-gradient-to-br from-[rgba(78,158,122,0.1)] to-[rgba(91,255,168,0.06)] border border-[rgba(78,158,122,0.22)] rounded-lg font-sans text-[13px] font-semibold text-[var(--green-neon)] flex items-center justify-between cursor-default">
              <span>⚡ Start 12-Minute Focus Session</span>
              <span className="hsc-cta-arrow text-base text-[rgba(91,255,168,0.5)]">→</span>
            </div>
          </div>
          {/* Floating accent cards — hidden on small screens */}
          <div
            className="hero-accent-card hero-accent-1 hidden lg:block absolute bg-[rgba(11,14,18,0.95)] border border-[var(--border)] rounded-xl py-3 px-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{ bottom: 40, left: -44, borderColor: "rgba(0,200,180,0.22)" }}
          >
            <div className="accent-label font-mono text-[9px] tracking-wider uppercase text-[var(--muted)] mb-1">
              Global accuracy
            </div>
            <div className="accent-val font-serif text-xl" style={{ color: "#F5A623" }}>
              73%
            </div>
            <div className="accent-sub text-[11px] text-[var(--muted)] mt-0.5">Across 486 questions</div>
          </div>
          <div
            className="hero-accent-card hero-accent-2 hidden lg:block absolute bg-[rgba(11,14,18,0.95)] border border-[var(--border)] rounded-xl py-3 px-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{ top: -16, right: -36, borderColor: "rgba(63,124,255,0.22)" }}
          >
            <div className="accent-label font-mono text-[9px] tracking-wider uppercase text-[var(--muted)] mb-1">
              Weakest page
            </div>
            <div
              className="accent-val text-[15px] font-bold font-sans"
              style={{ color: "#FF4B4B" }}
            >
              Page 47 · 42%
            </div>
            <div className="accent-sub text-[11px] text-[var(--muted)] mt-0.5">Harrison's Ch.12</div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        className="scroll-hint absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-35"
        style={{ animation: "float-up 2s ease-in-out infinite" }}
      >
        <div
          className="scroll-hint-line w-px h-10 bg-gradient-to-b from-transparent to-[var(--teal)]"
        />
        <div className="scroll-hint-dot w-1 h-1 rounded-full bg-[var(--teal)]" />
      </div>
    </section>
  );
}
