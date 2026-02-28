import React, { useEffect, useState } from "react";
import "./landing/landing.css";
import LandingHero from "./LandingHero";
import LandingCTA from "./LandingCTA";
import CursorDot from "./landing/CursorDot";
import LandingSectionDivider from "./landing/LandingSectionDivider";
import LandingProblem from "./landing/LandingProblem";
import LandingLibrary from "./landing/LandingLibrary";
import LandingAstra from "./landing/LandingAstra";
import LandingMCQ from "./landing/LandingMCQ";
import LandingLearning from "./landing/LandingLearning";
import LandingFlashcards from "./landing/LandingFlashcards";
import LandingSummaries from "./landing/LandingSummaries";
import LandingPlanner from "./landing/LandingPlanner";
import LandingReinforcement from "./landing/LandingReinforcement";
import LandingTestimonials from "./landing/LandingTestimonials";
import LandingPricing from "./landing/LandingPricing";
import LandingFooter from "./landing/LandingFooter";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Geist+Mono:wght@400;500;600&family=Syne:wght@400;500;600;700&display=swap";

const LandingPage = ({ onLogin, onSignup }) => {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    document.body.classList.add("landing");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONTS_HREF;
    link.setAttribute("data-landing-fonts", "true");
    document.head.appendChild(link);
    return () => {
      document.body.classList.remove("landing");
      document.querySelector('link[data-landing-fonts="true"]')?.remove();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-page w-full min-h-screen bg-[#0D0F12] text-white overflow-x-hidden selection:bg-[var(--teal)] selection:text-[var(--void)]">
      <CursorDot />

      <nav
        id="nav"
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300 ${
          navScrolled ? "scrolled" : ""
        }`}
      >
        <a href="#" className="nav-logo flex items-center gap-2 no-underline text-[var(--text)]">
          <img src="/src/assets/synapse-logo.png" alt="Synapse" className="w-7 h-7 object-contain" />
          <span className="nav-logo-text font-bold tracking-tight text-lg">Synapse</span>
          <span className="nav-badge text-[10px] font-medium px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[var(--muted)]">
            Beta
          </span>
        </a>
        <div className="nav-right flex items-center gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="btn-nav-ghost text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] bg-transparent border-0 cursor-pointer py-2 px-3 rounded-lg transition-colors"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onSignup}
            className="btn-nav-primary text-sm font-bold py-2 px-4 rounded-lg cursor-pointer transition-all bg-[rgba(0,200,180,0.15)] border border-[rgba(0,200,180,0.25)] text-[var(--teal)] hover:bg-[rgba(0,200,180,0.22)] hover:border-[rgba(0,200,180,0.35)]"
          >
            Start free
          </button>
        </div>
      </nav>

      <main className="flex flex-col">
        <LandingHero onSignup={onSignup} />
        <LandingSectionDivider />
        <LandingProblem />
        <LandingSectionDivider />
        <LandingLibrary />
        <LandingSectionDivider />
        <LandingAstra />
        <LandingSectionDivider />
        <LandingMCQ />
        <LandingSectionDivider />
        <LandingLearning />
        <LandingSectionDivider />
        <LandingFlashcards />
        <LandingSectionDivider />
        <LandingSummaries />
        <LandingSectionDivider />
        <LandingPlanner />
        <LandingSectionDivider />
        <LandingReinforcement />
        <LandingSectionDivider />
        <LandingTestimonials />
        <LandingSectionDivider />
        <LandingPricing onSignup={onSignup} />
        <LandingSectionDivider />
        <LandingCTA onSignup={onSignup} />
        <LandingFooter />
      </main>
    </div>
  );
};

export default LandingPage;
