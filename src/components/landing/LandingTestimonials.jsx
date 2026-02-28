import React from "react";
import RevealWrapper from "./RevealWrapper";

const testimonials = [
  {
    text: '"I failed my cardiology block twice. Uploaded my lectures to Synapse, it told me my accuracy on Heart Failure concepts was <strong>38%</strong> — I had no idea. Two weeks of focus sessions later, I passed with 81%."',
    avatar: { bg: "rgba(0,200,180,0.12)", border: "rgba(0,200,180,0.2)", color: "var(--teal)", letter: "L" },
    name: "Layla A.",
    role: "4th Year · Internal Medicine",
  },
  {
    text: '"The page-aware Astra is insane. I\'m reading my lecture on page 14, I ask \'what does this mean clinically?\' — it answers about <strong>that exact page</strong>. Not general knowledge. My lecture."',
    avatar: { bg: "rgba(63,124,255,0.1)", border: "rgba(63,124,255,0.2)", color: "var(--blue)", letter: "K" },
    name: "Kareem M.",
    role: "3rd Year · Surgery Block",
  },
  {
    text: '"I generate a summary before every exam. I set it to 4th year, exam goal, internal medicine — and it gives me exactly what I need. Then I highlight anything I don\'t understand and ask Astra right there."',
    avatar: { bg: "rgba(122,108,255,0.1)", border: "rgba(122,108,255,0.2)", color: "var(--purple)", letter: "S" },
    name: "Sara H.",
    role: "Final Year · Residency Prep",
  },
];

export default function LandingTestimonials() {
  return (
    <section className="social-section py-20 border-t border-[var(--border)] border-b border-[var(--border)] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(0,200,180,0.02) 0%, transparent 60%)" }}
      />
      <div className="container max-w-[1200px] mx-auto px-6 md:px-10 relative">
        <RevealWrapper className="social-label text-center mb-10">
          <span className="label-tag inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--teal)] border border-[rgba(0,200,180,0.2)] rounded-full py-1 px-3 bg-[rgba(0,200,180,0.06)]">
            From beta users
          </span>
        </RevealWrapper>
        <div className="testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <RevealWrapper key={t.name} style={{ transitionDelay: `${0.1 * i}s` }}>
              <div className="testimonial-card p-7 bg-[rgba(13,15,18,0.9)] border border-[var(--border)] rounded-[18px] relative transition-all hover:border-[rgba(0,200,180,0.16)] hover:-translate-y-0.5">
                <div
                  className="absolute top-5 right-6 font-serif text-[64px] leading-none text-[rgba(0,200,180,0.08)]"
                  aria-hidden
                >
                  "
                </div>
                <div
                  className="testimonial-text text-sm leading-relaxed mb-5 text-[rgba(245,245,247,0.8)] italic [&_strong]:text-[var(--text)] [&_strong]:not-italic"
                  dangerouslySetInnerHTML={{ __html: t.text }}
                />
                <div className="testimonial-author flex items-center gap-2.5">
                  <div
                    className="testimonial-avatar w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold font-sans flex-shrink-0"
                    style={{
                      background: t.avatar.bg,
                      border: `1px solid ${t.avatar.border}`,
                      color: t.avatar.color,
                    }}
                  >
                    {t.avatar.letter}
                  </div>
                  <div>
                    <div className="testimonial-name text-[13px] font-bold mb-0.5">{t.name}</div>
                    <div className="testimonial-role font-mono text-[10px] tracking-wide text-[var(--muted)]">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
