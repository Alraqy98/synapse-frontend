# Synapse Design System Snapshot

**Purpose:** Complete design system reference for an AI or developer building a landing page or UI that matches Synapse’s existing style. All values are taken from the current codebase (CSS variables, Tailwind config, and component usage).

---

## 1. COLOR TOKENS

### CSS Variables (`:root` in `src/styles.css`)

| Token | Value | Usage |
|-------|--------|--------|
| `--bg-void` | `#0D0F12` | Main app/dark background |
| `--bg-panel` | `rgba(25, 29, 34, 0.68)` | Cards, panels, modals |
| `--bg-panel-hover` | `rgba(35, 40, 48, 0.82)` | Panel hover state |
| `--text-main` | `#F5F5F7` | Primary text |
| `--text-muted` | `rgba(245, 245, 247, 0.6)` | Secondary/muted text |
| `--border-color` | `rgba(255, 255, 255, 0.06)` | Default borders |
| `--teal` | `#00C8B4` | Primary brand/accent |
| `--teal-neon` | `#00F5CC` | Bright teal (highlights, active) |
| `--teal-dim` | `rgba(0, 200, 180, 0.10)` | Teal tint (backgrounds) |
| `--blue` | `#3F7CFF` | Secondary accent (focus, links) |
| `--blue-dim` | `rgba(63, 124, 255, 0.15)` | Blue tint |
| `--purple` | `#7A6CFF` | Tertiary accent |
| `--shadow-card` | `0 4px 20px rgba(0, 0, 0, 0.40)` | Card shadow |
| `--shadow-glow` | `0 0 15px rgba(0, 245, 204, 0.40)` | Teal glow |
| `--radius` | `14px` | Default panel/card radius |
| `--font-sans` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | Body font stack |
| `--landing-gradient` | `linear-gradient(145deg, #0D0F12 0%, #14181D 100%)` | Page background gradient |

### Tailwind Config (`tailwind.config.js`)

- **teal:** `DEFAULT: '#00C8B4'`, `neon: '#00F5CC'`, `dim: 'rgba(0, 200, 180, 0.10)'`
- **blue:** `DEFAULT: '#3F7CFF'`, `dim: 'rgba(63, 124, 255, 0.15)'`
- **purple:** `#7A6CFF`
- **void:** `#0D0F12`
- **panel:** `rgba(25, 29, 34, 0.68)`
- **muted:** `rgba(245, 245, 247, 0.6)` (maps to `text-muted`)

### Additional Hex / RGBA in Use

- **File viewer canvas:** `#050609`, `#0f1115`
- **Modal/dark surfaces:** `#1a1d24`, `#191D22`, `#0d0f13`, `#1A1A1F`
- **Reinforcement/success green:** `#4E9E7A`, `#5BAE8C` (session complete, CTAs)
- **Error/danger:** `rgba(239, 68, 68, …)`, `text-red-400`, `border-red-500/20`
- **Scrollbar thumb:** `rgba(0, 245, 204, 0.35)` / `0.65` on hover

### Gradients in Use

- **Landing hero “Synapse” text:** `bg-gradient-to-r from-teal to-teal-neon` + `drop-shadow-[0_0_25px_rgba(0,200,180,0.4)]`
- **Primary button (refined):** `linear-gradient(135deg, var(--teal) 0%, var(--teal-neon) 100%)`
- **Progress bar (generating):** `bg-gradient-to-r from-teal-400 to-emerald-500`
- **Landing CTA background:** Blur orbs `bg-teal/10 blur-[120px]`, `bg-blue/10 blur-[100px]`

---

## 2. TYPOGRAPHY

- **Font family:** `var(--font-sans)` → **Inter** with system fallbacks.  
  *(Inter is not loaded in `index.html`; recommend adding Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap`.)*

- **Weights in use:**  
  - **Light (300):** `font-light` — hero/sub copy  
  - **Medium (500):** `font-medium` — labels, nav  
  - **Semibold (600):** `font-semibold` — headings, buttons, cards  
  - **Bold (700):** `font-bold` — hero, section titles, CTAs  
  - **Extrabold (800):** `font-extrabold` — hero “Meet Synapse”

- **Scale (Tailwind / usage):**
  - **Hero:** `text-5xl md:text-7xl lg:text-8xl` (tracking-tight)
  - **Section titles:** `text-3xl md:text-5xl`, `text-2xl`, `text-xl`
  - **Card/section headings:** `text-lg font-semibold`, `text-xl font-bold`
  - **Body:** `text-base`, `text-sm`
  - **Small / meta:** `text-xs` (badges, dates, labels)
  - **Micro / mono:** `text-[10px]`, `font-mono text-xs` (status, codes)

- **Tracking:**  
  - `tracking-tight` / `tracking-tighter` on large headlines  
  - `tracking-[0.25em]` on uppercase labels (e.g. “FRONT” on cards)  
  - `tracking-widest` on footer/legal

---

## 3. COMPONENT PATTERNS

### Card (UnifiedCard — Summaries, MCQs, Flashcards)

- **Container:**  
  `rounded-2xl border border-white/10 bg-black/40 p-6 transition-all`  
  Interactive: `cursor-pointer hover:-translate-y-1 hover:border-teal/40`  
  Disabled: `opacity-75 cursor-not-allowed`

- **Title:** `text-lg font-semibold text-white mb-2`
- **Meta/context:** `text-xs text-muted` (meta, contextNote)
- **Progress bar:** `h-2 rounded-full bg-white/10`; fill by status (teal, red-500, gradient when generating)
- **Footer:** `flex justify-between text-xs text-muted mt-4 pt-4 border-t border-white/5`
- **Status badge:** `px-2 py-1 rounded-full border text-[10px]`  
  - Ready/teal: `bg-teal/10 border-teal/30 text-teal`  
  - Failed: `bg-red-500/10 border-red-500/30 text-red-400`

### Panel (global class `.panel`)

```css
.panel {
  backdrop-filter: blur(18px) saturate(160%);
  background: rgba(18, 20, 24, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  transition: border-color .2s ease, transform .2s ease;
}
.panel:hover {
  border-color: rgba(0, 255, 204, 0.15);
  transform: translateY(-3px);
}
```

- **Usage:** `className="panel p-6"`, `panel p-8 max-w-4xl mx-auto rounded-2xl`, etc.
- **Border radius:** Often overridden with `rounded-2xl` (16px) or `rounded-3xl` (24px) in components.

### Buttons

**Base (`.btn`):**  
`padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: 1px solid var(--border-color); display: inline-flex; align-items: center; gap: 8px;`

- **Primary (`.btn-primary`):**  
  Gradient `linear-gradient(135deg, var(--teal) 0%, var(--teal-neon) 100%)`, `border: none`, `color: #000`.  
  Hover: `translateY(-2px)`, `box-shadow: 0 0 18px rgba(0, 245, 204, 0.45)`.

- **Secondary (`.btn-secondary`):**  
  `background: rgba(255, 255, 255, 0.04)`, `border: 1px solid rgba(255, 255, 255, 0.06)`, `backdrop-filter: blur(8px)`.  
  Hover: `background: rgba(255, 255, 255, 0.08)`.

- **Blue (`.btn-blue`):**  
  `background: var(--blue)`, `color: #FFF`, hover glow `var(--blue-dim)`.

- **Danger (`.btn-danger`):**  
  `background: rgba(239, 68, 68, 0.15)`, `border: 1px solid rgba(239, 68, 68, 0.3)`, `color: #fca5a5`.  
  Hover: stronger red background/border, `color: #fee2e2`.

**Landing CTA:**  
Primary: `px-10 py-5 rounded-2xl bg-teal hover:bg-teal-neon text-black font-bold text-xl`, `shadow-[0_0_30px_rgba(0,200,180,0.4)]`, `hover:scale-105`.  
Secondary: `rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xl backdrop-blur-md`.

### Badge / Tag

- **Status (UnifiedCard):**  
  `px-2 py-1 rounded-full border text-[10px]`  
  - Teal: `bg-teal/10 border-teal/30 text-teal`  
  - Red: `bg-red-500/10 border-red-500/30 text-red-400`

- **Admin/file status (e.g. AdminFiles):**  
  `px-2 py-1 text-xs font-medium rounded`  
  - Success: `bg-teal/20 text-teal border border-teal/30`  
  - Warning: `bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`  
  - Error: `bg-red-500/20 text-red-400 border border-red-500/30`  
  - Neutral: `bg-white/10 text-muted border border-white/10`

- **Landing “Beta”:**  
  `text-xs text-muted font-medium px-2 py-0.5 rounded border border-white/10 bg-white/5`

- **Landing “Beta Access” pill:**  
  `inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-teal backdrop-blur-sm` + small teal dot with `animate-ping`.

### Input (`.input-field`)

```css
.input-field {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  font-size: 15px;
  color: var(--text-main);
}
.input-field:focus {
  border-color: var(--teal-neon);
  box-shadow: 0 0 12px rgba(0, 245, 204, 0.25);
  outline: none;
}
```

- **Dropdown (select):** Same class + custom chevron via SVG data URL, `padding-right: 32px`, `appearance: none`.

---

## 4. LAYOUT

- **Max container width:**  
  - **Primary:** `max-w-7xl` (80rem) — dashboard, library, summaries, MCQ, flashcards, admin.  
  - **Content:** `max-w-4xl`, `max-w-3xl`, `max-w-2xl` for readers/forms.  
  - **Modals:** `max-w-md`, `max-w-2xl` (e.g. generate modals `max-w-2xl`).

- **Spacing:**  
  - Page padding: `p-6`, `px-6 py-6`, `px-6 pb-28` on tab pages.  
  - Section: `space-y-8`, `space-y-6`, `gap-4` / `gap-6` / `gap-8`.  
  - Card internal: `p-6`, `p-8`, `px-6 py-4`.

- **Grid:**  
  - `grid grid-cols-1 md:grid-cols-3 gap-8` (landing features).  
  - `grid grid-cols-1 sm:grid-cols-2 gap-4` (e.g. MCQ options layout).  
  - Lists: flex column or single column with gap.

- **Sidebar (dashboard):**  
  - Fixed left: `w-20 bg-void border-r border-white/5 flex flex-col items-center py-6 z-40 h-full fixed left-0 top-0`.  
  - Main content: `flex-1 overflow-y-auto p-6` (or with custom background e.g. planner `#0C0C0E`).  
  - Center content: `max-w-7xl mx-auto` (or other max-w) + horizontal padding.

---

## 5. BACKGROUND & SURFACE STYLE

- **Page background:**  
  `background: var(--bg-void); background-image: var(--landing-gradient);`  
  i.e. `#0D0F12` with `linear-gradient(145deg, #0D0F12 0%, #14181D 100%)`.

- **Landing:**  
  - Same void + gradient; sections use `bg-[#0D0F12]`, footer `border-t border-white/5 bg-[#0D0F12]`.  
  - Feature cards: `bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-teal/20`, optional inner gradient `from-teal/5 to-transparent` on hover.  
  - CTA: large blurred orbs (`bg-teal/10 blur-[120px]`, `bg-blue/10 blur-[100px]`).

- **Glass / panels:**  
  - `backdrop-filter: blur(12px)` to `blur(22px)`, sometimes `saturate(140%)` / `160%`.  
  - Surfaces: `rgba(18, 20, 24, 0.72)`, `rgba(22, 25, 30, 0.70)`, `rgba(10, 12, 15, 0.65)` for overlays.

- **Modal:**  
  - Backdrop: `fixed inset-0 z-50 bg-black/60` or `modal-blur`: `backdrop-filter: blur(22px) saturate(140%); background: rgba(10, 12, 15, 0.65)`.  
  - Panel: `modal-panel` — `background: rgba(22, 25, 30, 0.70); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 18px; padding: 32px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55); animation: synapseFadeIn .35s ease`.  
  - Alternative: `rounded-2xl bg-black border border-white/10 p-6` with `max-w-md` or `max-w-2xl`.  
  - Delete modal: `border border-red-500/20`.

- **Noise texture:** Not used. No explicit noise or grain in CSS.

---

## 6. BORDER & DIVIDER STYLE

- **Colors:**  
  - Default: `var(--border-color)` → `rgba(255, 255, 255, 0.06)`.  
  - In Tailwind: `border-white/5`, `border-white/10`, `border-white/20`.  
  - Focus/active: `border-teal/40`, `border-teal/70`, `border-[#4E9E7A]/20` (learning).  
  - Danger: `border-red-500/20`, `border-red-500/30`.

- **Width:** `1px` everywhere for borders.

- **Border radius:**  
  - **6px:** scrollbar thumb.  
  - **10px:** `.btn`, legacy input.  
  - **12px:** nav items, dropdowns, inputs (12px), small panels.  
  - **14px:** `var(--radius)` for `.panel` base.  
  - **16px:** `rounded-2xl` — cards, modals, feature blocks.  
  - **18px:** `.modal-panel`, upgraded `.panel`.  
  - **24px:** `rounded-3xl` — auth panels, hero cards.  
  - **30px:** scrollbar thumb (premium variant).  
  - **Pill:** `rounded-full` for badges, dots, progress bars.  
  - **Nav accent bar:** `border-radius: 0 4px 4px 0` (left bar).

---

## 7. ANIMATION STYLE

- **Global transition (styles.css):**  
  `transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.20s ease` on `*`.

- **Tailwind:**  
  - `fade-in`: 0.8s ease-out.  
  - `fade-in-up`, `slide-up`: 0.5s–0.8s ease-out, translateY 20px → 0.  
  - `pulse-slow`: 4s cubic-bezier(0.4, 0, 0.6, 1) infinite.

- **Custom keyframes (styles.css):**  
  - **fadeSlide:** opacity 0→1, translateY 8px→0 (0.35s ease) for `main > div`.  
  - **synapseFadeIn:** opacity 0→1, scale 0.96→1 (0.25s cubic-bezier(0.16, 1, 0.3, 1)).  
  - **synapseSlideUp:** opacity 0→1, translateY 10px→0 (0.30s same easing).  
  - **neonPulse:** box-shadow teal glow 0 → 12px → 0 (1.6s ease-in-out infinite).  
  - **fadeInUp:** opacity + translateY 10px→0 (0.4s ease-out).

- **Easing:** `ease`, `ease-out`, `cubic-bezier(0.16, 1, 0.3, 1)` for “premium” modals/cards.  
- **Durations:** 0.2s–0.35s for UI feedback, 0.5s–0.8s for page/hero.

- **Hover:**  
  - Cards: `hover:-translate-y-1` or `translateY(-3px)` / `-4px`.  
  - Buttons: `translateY(-2px)`, `hover:scale-105` on landing CTAs.  
  - Nav: `transform: scale(1.12)` hover, `scale(1.15)` active.

---

## 8. LOGO / BRAND MARK

- **Asset:** `src/assets/synapse-logo.png` (PNG).  
- **Usage:**  
  - **Sidebar:** `<img src={logo} alt="Synapse Logo" className="h-9 w-auto drop-shadow-[0_0_14px_rgba(0,200,180,0.65)]" />`.  
  - **Landing nav:** `h-8 w-auto drop-shadow-[0_0_12px_rgba(0,200,180,0.6)]`.  
  - **Auth (AppLogo):** height via `size` prop (e.g. 32px), same asset.

- **Wordmark:**  
  - Landing: “Synapse” next to logo, `text-xl font-bold tracking-tight`.  
  - Hero: “Synapse” in gradient: `text-transparent bg-clip-text bg-gradient-to-r from-teal to-teal-neon drop-shadow-[0_0_25px_rgba(0,200,180,0.4)]`.

- **Description for repro:**  
  Use the provided PNG; it is the primary mark. No separate icon-only asset is used in app nav. Teal glow drop-shadow is part of the brand (hex equivalent: ~#00C8B4 / #00F5CC at 60–65% opacity for glow). If recreating without the file, assume a compact wordmark or symbol in white/light, often with a soft teal halo.

---

## 9. FEATURE LIST (Logged-in User)

- **Dashboard** (`/dashboard`): Welcome, quick actions (Upload, Library, Tutor, Summaries, MCQs, Flashcards), recent activity (recent summaries/MCQs/flashcards), optional tour card.

- **Library** (`/library`, `/library/:folderSlug`, etc.): Folder/file tree; upload files; open files in file viewer; file cards show icon by type (PDF, book, folder with custom color), rename, move, change category, delete, “done” checkbox; filters by category.

- **File viewer** (`/library/file/:fileId`, optional `/page/:pageNumber`): PDF/image viewer with page or scroll mode; zoom; page nav arrows; sidebar for outline/chat; canvas background `#050609` / `#0f1115`; optional Astra chat in sidebar.

- **Tutor** (`/tutor`, `/tutor/:sessionId`): AI chat (Astra); session list in sidebar; new chat; rename/delete sessions; empty state with suggested prompts.

- **Summaries** (`/summaries`, `/summaries/:summaryId`): Generate summary from library files (context/specialty); list of summary cards (UnifiedCard) with progress/status; open summary viewer: prose content, TOC, full-width reading; share/import code.

- **MCQ** (`/mcq`, `/mcq/:deckId`): Generate MCQ deck from library; list of decks (UnifiedCard); deck view: one question at a time, lettered options (A–E), select → correct/wrong + explanation; “Explain All”; next/previous; results at end; performance mentor panel (longitudinal stats, suggestions).

- **Flashcards** (`/flashcards`, `/flashcards/:deckId`): Generate deck from library; list of decks; deck view: flip cards (question/answer), navigation; review mode; source attribution.

- **OSCE** (`/osce`): OSCE simulation module (route present).

- **Oral Exam** (`/oral`): Oral exam module (route present).

- **Planner** (`/planner`): Calendar/planner; background `#0C0C0E`; scheduling and plan UI.

- **Learning** (`/learning`): Performance/analytics dashboard: learning state (DECLINING / STABLE / IMPROVING), momentum, primary risk concept, risk badges, sparkline, transition timeline; concept breakdown; “Reinforcement” sessions (start calibration, concept-specific practice).  
  - **Reinforcement session** (`/learning/reinforce/:conceptId`, `/learning/reinforce/:conceptId/session/:sessionId`): Timed MCQ-style session; question + options; timer; score at end; AI teaching summary; green accent `#4E9E7A`.

- **Settings** (`/settings`): Profile, Astra preferences, announcements, feedback, change password, logout.

- **Upload / generate flows:** Modals for upload, generate summary, generate MCQ, generate flashcards (file picker, options, progress, then redirect or list update).

---

## 10. NAVIGATION

- **User sidebar (fixed left, icons only):**  
  Dashboard, Library, Tutor, Flashcards, MCQ, Summaries, OSCE, Oral Exam, Planner, Learning.  
  Bottom: Settings.  
  Active: `bg-neutral-800`; dashboard home also gets teal underline accent (`w-8 h-0.5 bg-teal shadow-[0_0_8px_rgba(0,200,180,0.6)]`).  
  Tooltip on hover: `absolute left-14`, `rounded-md bg-black px-3 py-1 text-sm text-white`.

- **Admin sidebar** (when `is_admin`):  
  Home, Users, Content, Files, Notifications, Suggestions; bottom: Settings.

- **Landing:**  
  Nav: logo + “Synapse” + “Beta” badge; “Log In” (text); “Sign Up” (bg-white/10, rounded-lg).  
  Footer: tagline + copyright.

---

## 11. UNIQUE UI PATTERNS

- **UnifiedCard:** One card for Summaries, MCQs, and Flashcards: title, meta, context note, progress bar (idle/generating/finalizing/ready/failed), status pill, date; hover lift and teal border; overflow menu (rename, generate import code, delete); optional share/import modal.

- **Progress bar:** Thin `h-2 rounded-full bg-white/10`; fill color by status (teal when ready, red when failed, gradient when generating); used on list cards and inline status.

- **MCQ options:** Each option is a `.panel`-style block: `p-5 rounded-xl`, letter in `w-9 h-9 rounded-lg border border-white/15`; correct → teal + check icon; wrong → red + X; explanation below in `rounded-xl p-4` with `bg-teal/10 border-teal/30` or red variant.

- **Flashcard card:** Large rounded card `rounded-3xl border border-white/10`, gradient `from-white/5 via-white/[0.03] to-black/40`, teal shadow; label uppercase tracking; question or bullet list answer; click to flip.

- **Library cards:** Icon in colored box (`rounded-xl`, folder color or white/5); title; done checkbox (teal when done); overflow menu (rename, move, change category, delete).

- **Learning/Reinforcement:** Green accent `#4E9E7A` for session state, completion, and CTAs; small “SESSION COMPLETE” pill; mono labels for stats (e.g. “ROLLING ACCURACY”); panel with header bar and bordered content areas.

- **Modals:** Backdrop click to close; inner panel `max-w-md` or `max-w-2xl`, `rounded-2xl`, `bg-black` or glass; primary action teal, secondary ghost, danger red; often `animate-fadeIn` or `animate-fade-in-up`.

- **Loading:** Spinner `rounded-full h-12 w-12 border-b-2 border-teal` or `border-[3px] border-white/10 border-t-[#4E9E7A]`; “Loading…” in `text-muted`.

- **Empty states:** Centered panel or message, muted text, optional icon (e.g. BookOpen, FileText) and CTA.

- **Scrollbar:** Teal tint `rgba(0, 245, 204, 0.35)` (hover 0.65), rounded, optional glow; hidden on landing (`body.landing`).

---

## Quick reference: class combos to copy

- **Page container:** `max-w-7xl mx-auto space-y-8` or `max-w-7xl mx-auto px-6 pb-28`
- **Card (generic):** `rounded-2xl border border-white/10 bg-black/40 p-6 hover:-translate-y-1 hover:border-teal/40 transition-all`
- **Panel:** `panel p-6` or `panel p-8 max-w-4xl mx-auto rounded-2xl`
- **Primary button:** `btn btn-primary` or landing `px-10 py-5 rounded-2xl bg-teal hover:bg-teal-neon text-black font-bold text-xl ...`
- **Secondary button:** `btn btn-secondary`
- **Input:** `input-field` or `w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white`
- **Modal overlay:** `fixed inset-0 z-50 bg-black/60 flex items-center justify-center`
- **Modal content:** `w-full max-w-md rounded-2xl bg-black border border-white/10 p-6`
- **Teal glow text:** `text-transparent bg-clip-text bg-gradient-to-r from-teal to-teal-neon drop-shadow-[0_0_25px_rgba(0,200,180,0.4)]`
- **Muted text:** `text-muted` or `text-sm text-white/50` / `text-gray-400`

Use this snapshot together with `src/styles.css` and `tailwind.config.js` to match Synapse’s visual language in a new landing page or feature.
