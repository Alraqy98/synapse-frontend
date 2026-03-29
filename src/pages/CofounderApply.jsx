import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, GripVertical, Check } from "lucide-react";
import api from "../lib/api";
import { useNotification } from "../context/NotificationContext";

const RANKING_ITEMS = [
  {
    id: 0,
    text:
      "Generation delay: Users wait ~5 minutes before MCQ generation starts. We say it's because OCR/rendering continues in the background non-blocking, but it's still friction. Do you accept the delay as UX cost? Optimize the pipeline? Change how we position it to users?",
  },
  {
    id: 1,
    text:
      "OCR/render coverage gap: We're stuck at 90-95% coverage on extractions — getting to 99%+ is hard and expensive. Do you invest in better OCR models? Add UI for manual corrections? Accept 5% loss as acceptable?",
  },
  {
    id: 2,
    text:
      "File viewer zoom: Zoom functionality isn't smooth/responsive enough for dense medical PDFs. Students can't read dense text easily. Quick UX fix or deeper rebuild?",
  },
  {
    id: 3,
    text:
      "Apple Pencil + annotations: Med students want to mark up files directly on iPad with annotations. Feature request or core product? How does this fit your roadmap?",
  },
];

const COFOUNDER_OPTIONS = [
  {
    value: "Equity, shared ownership, long-term partnership",
    label: "Equity, shared ownership, long-term partnership",
  },
  {
    value: "Salary + equity, I need immediate income",
    label: "Salary + equity, I need immediate income",
  },
];

const HEARD_FROM_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "LinkedIn post", label: "LinkedIn post" },
  { value: "YC Cofounder Matching", label: "YC Cofounder Matching" },
  { value: "Personal referral", label: "Personal referral" },
  { value: "Other", label: "Other" },
];

const MIN_BACKGROUND = 20;
const MIN_PORTFOLIO = 20;
const MIN_RANKING_EXPL = 50;
const MIN_WHY = 50;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Public cofounder application — POST /api/submissions/cofounder
 */
export default function CofounderApply() {
  const { success, error } = useNotification();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [background, setBackground] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  /** Order of item indices from highest priority (rank 1) to lowest (rank 4) */
  const [rankOrder, setRankOrder] = useState([0, 1, 2, 3]);
  const [rankingExplanation, setRankingExplanation] = useState("");
  const [whySynapse, setWhySynapse] = useState("");
  const [cofounderMeaning, setCofounderMeaning] = useState(
    COFOUNDER_OPTIONS[0].value
  );
  const [readyEquity, setReadyEquity] = useState(false);
  const [readyHours, setReadyHours] = useState(false);
  const [readyTurkey, setReadyTurkey] = useState(false);
  const [heardFrom, setHeardFrom] = useState("");
  const [questions, setQuestions] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [touched, setTouched] = useState({});
  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const githubTrim = github.trim();
  const linkedinTrim = linkedin.trim();
  const hasSocial = githubTrim.length > 0 || linkedinTrim.length > 0;

  const errors = useMemo(() => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!isValidEmail(email)) e.email = "Enter a valid email";
    if (!location.trim()) e.location = "Location is required";
    if (background.trim().length < MIN_BACKGROUND)
      e.background = `At least ${MIN_BACKGROUND} characters`;
    if (!hasSocial) e.social = "Provide at least one of GitHub or LinkedIn";
    if (portfolio.trim().length < MIN_PORTFOLIO)
      e.portfolio = `At least ${MIN_PORTFOLIO} characters`;
    if (rankingExplanation.trim().length < MIN_RANKING_EXPL)
      e.rankingExplanation = `At least ${MIN_RANKING_EXPL} characters`;
    if (whySynapse.trim().length < MIN_WHY)
      e.whySynapse = `At least ${MIN_WHY} characters`;
    if (!readyEquity || !readyHours || !readyTurkey)
      e.checklist = "All three items must be checked";
    return e;
  }, [
    name,
    email,
    location,
    background,
    hasSocial,
    portfolio,
    rankingExplanation,
    whySynapse,
    readyEquity,
    readyHours,
    readyTurkey,
  ]);

  const canSubmit =
    Object.keys(errors).length === 0 && !submitting && !done;

  const moveItem = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setRankOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const onDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e, dropIndex) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(from)) return;
    moveItem(from, dropIndex);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setLocation("");
    setBackground("");
    setGithub("");
    setLinkedin("");
    setPortfolio("");
    setRankOrder([0, 1, 2, 3]);
    setRankingExplanation("");
    setWhySynapse("");
    setCofounderMeaning(COFOUNDER_OPTIONS[0].value);
    setReadyEquity(false);
    setReadyHours(false);
    setReadyTurkey(false);
    setHeardFrom("");
    setQuestions("");
    setTouched({});
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      location: location.trim(),
      background: background.trim(),
      github: githubTrim,
      linkedin: linkedinTrim,
      portfolio: portfolio.trim(),
      ranking: rankOrder,
      ranking_explanation: rankingExplanation.trim(),
      why_synapse: whySynapse.trim(),
      cofounder_meaning: cofounderMeaning,
      ready_equity: readyEquity,
      ready_hours: readyHours,
      ready_turkey: readyTurkey,
      heard_from: heardFrom.trim() || null,
      questions: questions.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      await api.post("/api/submissions/cofounder", payload);
      success(
        "Application received. I'll review and get back within 48 hours if it's a fit."
      );
      resetForm();
      setDone(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again.";
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[100dvh] bg-void flex flex-col items-center justify-center px-4 py-12 font-sans">
        <div
          className="w-full max-w-[500px] p-8 rounded-[var(--radius)] border border-white/[0.08] bg-[#111114]/40"
          role="status"
        >
          <div className="flex items-center gap-3 mb-4 text-teal">
            <div className="rounded-full bg-teal/20 p-2 border border-teal/40">
              <Check className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Application received
            </h1>
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            Thanks for applying. If it&apos;s a fit, you&apos;ll hear back within
            48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setDone(false)}
              className="flex-1 px-4 py-3 rounded-lg bg-teal text-black font-semibold text-sm hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-void"
            >
              Submit another application
            </button>
            <Link
              to="/"
              className="flex-1 text-center px-4 py-3 rounded-lg border border-white/10 text-blue font-semibold text-sm hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue/50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-void flex flex-col items-center px-4 py-10 sm:py-14 font-sans">
      <div className="w-full max-w-[500px] p-8 rounded-[var(--radius)] border border-white/[0.08] bg-[#111114]/30">
        <div className="mb-8">
          <p className="text-xs font-mono text-teal/80 tracking-wider mb-2">
            SYNAPSE
          </p>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Cofounder application
          </h1>
          <p className="text-sm text-white/55 leading-relaxed">
            Tell us about you, how you think, and why Synapse. Fields marked
            with * are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Basic info
            </h2>
            <div>
              <label
                htmlFor="cfa-name"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Full name *
              </label>
              <input
                id="cfa-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => markTouched("name")}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                placeholder="Your legal name"
              />
              {touched.name && errors.name && (
                <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="cfa-email"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Email *
              </label>
              <input
                id="cfa-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                placeholder="you@example.com"
              />
              {touched.email && errors.email && (
                <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="cfa-location"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Location *
              </label>
              <input
                id="cfa-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => markTouched("location")}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                placeholder="Istanbul, London, Riyadh..."
              />
              {touched.location && errors.location && (
                <p className="mt-1.5 text-sm text-red-400">{errors.location}</p>
              )}
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Technical credentials
            </h2>
            <div>
              <label
                htmlFor="cfa-background"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Technical background *
              </label>
              <textarea
                id="cfa-background"
                rows={4}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                onBlur={() => markTouched("background")}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal resize-y min-h-[100px]"
                placeholder="2 years React/TypeScript, shipped 3 B2B SaaS products, led 5-person backend team..."
              />
              <div className="flex justify-between mt-1.5 gap-2">
                {touched.background && errors.background && (
                  <p className="text-sm text-red-400">{errors.background}</p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    background.trim().length >= MIN_BACKGROUND
                      ? "text-teal/80"
                      : "text-white/40"
                  }`}
                >
                  {background.trim().length}/{MIN_BACKGROUND} characters
                </p>
              </div>
            </div>

            <div>
              <p className="block text-xs font-medium text-white/60 mb-1">
                GitHub or LinkedIn *
              </p>
              <p className="text-xs text-white/45 mb-3">
                We want to see your actual work — at least one URL is required.
              </p>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="cfa-github"
                    className="block text-[11px] text-white/50 mb-1"
                  >
                    GitHub link
                  </label>
                  <input
                    id="cfa-github"
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    onBlur={() => markTouched("social")}
                    className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="cfa-linkedin"
                    className="block text-[11px] text-white/50 mb-1"
                  >
                    LinkedIn profile
                  </label>
                  <input
                    id="cfa-linkedin"
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    onBlur={() => markTouched("social")}
                    className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
              {touched.social && errors.social && (
                <p className="mt-2 text-sm text-red-400">{errors.social}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="cfa-portfolio"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Portfolio / live projects *
              </label>
              <textarea
                id="cfa-portfolio"
                rows={3}
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                onBlur={() => markTouched("portfolio")}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal resize-y min-h-[88px]"
                placeholder="https://myportfolio.com or describe 2-3 shipped projects you're proud of"
              />
              <div className="flex justify-between mt-1.5 gap-2">
                {touched.portfolio && errors.portfolio && (
                  <p className="text-sm text-red-400">{errors.portfolio}</p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    portfolio.trim().length >= MIN_PORTFOLIO
                      ? "text-teal/80"
                      : "text-white/40"
                  }`}
                >
                  {portfolio.trim().length}/{MIN_PORTFOLIO} characters
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 — ranking */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Product thinking (prioritization)
            </h2>
            <p className="text-xs text-white/55 leading-relaxed">
              Drag to rank (top = highest priority) or use the move buttons.
              There&apos;s no &quot;right&quot; answer — we want to see how you
              think.
            </p>
            <ol className="space-y-2">
              {rankOrder.map((itemId, listIndex) => {
                const item = RANKING_ITEMS.find((x) => x.id === itemId);
                if (!item) return null;
                return (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, listIndex)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, listIndex)}
                    className="flex gap-2 rounded-lg border border-white/10 bg-void/80 p-3 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={listIndex === 0}
                        onClick={() => moveItem(listIndex, listIndex - 1)}
                        className="px-2 py-0.5 text-[10px] rounded border border-white/15 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={listIndex === rankOrder.length - 1}
                        onClick={() => moveItem(listIndex, listIndex + 1)}
                        className="px-2 py-0.5 text-[10px] rounded border border-white/15 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="flex gap-2 min-w-0 flex-1">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal/15 text-teal text-xs font-mono font-semibold border border-teal/30">
                        {listIndex + 1}
                      </span>
                      <GripVertical
                        className="w-4 h-4 text-white/25 shrink-0 mt-0.5 hidden sm:block"
                        aria-hidden
                      />
                      <span className="text-xs text-white/80 leading-relaxed">
                        {item.text}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div>
              <label
                htmlFor="cfa-rank-expl"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Explanation: Why this order? What&apos;s your first move on the
                top priority? *
              </label>
              <textarea
                id="cfa-rank-expl"
                rows={5}
                value={rankingExplanation}
                onChange={(e) => setRankingExplanation(e.target.value)}
                onBlur={() => markTouched("rankingExplanation")}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal resize-y min-h-[120px]"
                placeholder="I'd start with #1 because... The first move would be..."
              />
              <div className="flex justify-between mt-1.5 gap-2">
                {touched.rankingExplanation && errors.rankingExplanation && (
                  <p className="text-sm text-red-400">
                    {errors.rankingExplanation}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    rankingExplanation.trim().length >= MIN_RANKING_EXPL
                      ? "text-teal/80"
                      : "text-white/40"
                  }`}
                >
                  {rankingExplanation.trim().length}/{MIN_RANKING_EXPL}{" "}
                  characters
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Motivation
            </h2>
            <div>
              <label
                htmlFor="cfa-why"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Why medical education? Why Synapse? Why now? *
              </label>
              <textarea
                id="cfa-why"
                rows={5}
                value={whySynapse}
                onChange={(e) => setWhySynapse(e.target.value)}
                onBlur={() => markTouched("whySynapse")}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal resize-y min-h-[120px]"
                placeholder="I went through med school myself. Saw how broken the tools are. Your reinforcement learning piece is exactly what was missing..."
              />
              <div className="flex justify-between mt-1.5 gap-2">
                {touched.whySynapse && errors.whySynapse && (
                  <p className="text-sm text-red-400">{errors.whySynapse}</p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    whySynapse.trim().length >= MIN_WHY
                      ? "text-teal/80"
                      : "text-white/40"
                  }`}
                >
                  {whySynapse.trim().length}/{MIN_WHY} characters
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Commitment
            </h2>
            <div>
              <label
                htmlFor="cfa-meaning"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                What does &quot;cofounder&quot; mean to you? *
              </label>
              <select
                id="cfa-meaning"
                value={cofounderMeaning}
                onChange={(e) => setCofounderMeaning(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
              >
                {COFOUNDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="text-xs font-medium text-white/60 mb-2">
                Readiness checklist * (all required)
              </legend>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={readyEquity}
                    onChange={(e) => setReadyEquity(e.target.checked)}
                    onBlur={() => markTouched("checklist")}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-void accent-teal text-teal focus:ring-teal focus:ring-offset-void"
                  />
                  <span className="text-sm text-white/80 group-hover:text-white/90">
                    I understand this is equity-based, no salary initially
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={readyHours}
                    onChange={(e) => setReadyHours(e.target.checked)}
                    onBlur={() => markTouched("checklist")}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-void accent-teal text-teal focus:ring-teal focus:ring-offset-void"
                  />
                  <span className="text-sm text-white/80 group-hover:text-white/90">
                    I can commit 40+ hours/week long-term
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={readyTurkey}
                    onChange={(e) => setReadyTurkey(e.target.checked)}
                    onBlur={() => markTouched("checklist")}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-void accent-teal text-teal focus:ring-teal focus:ring-offset-void"
                  />
                  <span className="text-sm text-white/80 group-hover:text-white/90">
                    I&apos;m excited about owning the technical direction and
                    scaling Turkey first
                  </span>
                </label>
              </div>
              {touched.checklist && errors.checklist && (
                <p className="mt-2 text-sm text-red-400">{errors.checklist}</p>
              )}
            </fieldset>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Optional
            </h2>
            <div>
              <label
                htmlFor="cfa-heard"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                How did you hear about us?
              </label>
              <select
                id="cfa-heard"
                value={heardFrom}
                onChange={(e) => setHeardFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
              >
                {HEARD_FROM_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="cfa-questions"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Any questions for me?
              </label>
              <textarea
                id="cfa-questions"
                rows={4}
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-void border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal resize-y min-h-[100px]"
                placeholder="Ask anything — about the product, the vision, equity terms, roadmap, my background, why I'm building this. Seriously, the people who ask questions are the ones I want to talk to. It shows you're actually thinking about whether this is the right move."
              />
            </div>
          </section>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-teal text-black font-semibold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 transition-all focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-void"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit application"
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-xs text-white/35">
          <Link to="/" className="text-blue hover:underline">
            Back to Synapse
          </Link>
        </p>
      </div>
    </div>
  );
}
