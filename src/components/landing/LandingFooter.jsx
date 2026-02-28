import React from "react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--void)]">
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10 py-8">
        <div className="footer-inner flex flex-col md:flex-row items-center justify-between gap-6 flex-wrap">
          <a
            href="#"
            className="footer-logo flex items-center gap-2 text-[var(--text)] no-underline font-bold tracking-tight hover:opacity-90"
          >
            <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="12" stroke="#00C8B4" strokeWidth="1.5" opacity="0.4" />
              <circle cx="13" cy="13" r="4" fill="#00F5CC" opacity="0.7" />
            </svg>
            <span className="footer-logo-text">Synapse</span>
          </a>
          <div className="footer-links flex flex-wrap items-center justify-center gap-6">
            <a href="#" className="footer-link text-sm text-[var(--muted)] no-underline hover:text-[var(--text)]">
              Features
            </a>
            <a href="#pricing" className="footer-link text-sm text-[var(--muted)] no-underline hover:text-[var(--text)]">
              Pricing
            </a>
            <a href="#" className="footer-link text-sm text-[var(--muted)] no-underline hover:text-[var(--text)]">
              Privacy
            </a>
            <a href="#" className="footer-link text-sm text-[var(--muted)] no-underline hover:text-[var(--text)]">
              Terms
            </a>
            <a href="#" className="footer-link text-sm text-[var(--muted)] no-underline hover:text-[var(--text)]">
              Contact
            </a>
          </div>
          <div className="footer-copy text-sm text-[var(--muted)]">© 2026 Synapse</div>
        </div>
      </div>
    </footer>
  );
}
