# Exhaustive Feature Report — Synapse (for Landing Page Copy)

**Purpose:** Give an AI (or copywriter) everything needed to write landing page copy that makes users feel they *need* this product. Every user-facing capability, interaction, and piece of intelligence is documented with specific UI text, flows, and differentiators.

---

## 1. TUTOR (Astra)

### What the tutor can do
- **Standalone Tutor (`/tutor`):** General medical study chat. Payload sent to backend: `sessionId`, `message`, `mode`, `lastAIMessage`, `lastUserMessage`. **No document or file context is sent** in standalone mode — the backend may use user profile/context if available, but the frontend does not send library files, file IDs, or page numbers.
- **File-viewer–aware Astra:** When the user is in the **File Viewer** (Library → open a file), the sidebar chat is **page-aware**. Each message is sent with:
  - `fileId` (current file)
  - `page` (current page number)
  - `mode: "page"`
  - Optional `image` / `screenshotUrl` (current page image for vision context)
  - `resourceSelection: { scope: "selected", file_ids: [file.id], folder_ids: [], include_books: true }`
  - Message prefix: `[File ${file.title} | Page ${activePage}] ${msg}`
  So **in the file viewer**, Astra can answer about the **specific page** the user is looking at and can receive the page image.
- **Summary-aware Astra:** In the **Summary Viewer**, the user can select text in the summary and ask about it. Payload includes:
  - `summaryId`, `summaryTitle`, `selectionText` (the selected passage), `fileId` (source file if available)
  - `resourceSelection: { scope: "selected", file_ids: [summary.file_id], ... }`
  - Context message: `[Summary: ${title} | Section: ${sectionContext} | File ID: ${file_id}] About this selection: "${selectionText}"`
  So Astra can **cite and reason over the user’s summary and selection**.

### Context awareness
- **Standalone:** No uploaded-document context is sent from the frontend.
- **File Viewer:** Full context for **one file** and **current page** (and optionally the page image).
- **Summary Viewer:** Context is the **summary + selected text** plus optional source file ID.

### Conversation memory
- **Within a session:** Yes. Messages are loaded from `GET /ai/tutor/sessions/:sessionId/messages` and appended to; each new user message is POSTed with the same `sessionId`, and the backend receives `lastAIMessage` and `lastUserMessage` for continuity.
- **Across sessions:** Each chat is a separate **session** (create via `POST /ai/tutor/sessions`, title e.g. "New Chat"). User can have many sessions (tabs), switch between them, rename, delete. **No cross-session memory** is exposed in the UI; each session is independent.

### What makes it different from “just ChatGPT”
- **Your materials first:** In File Viewer and Summary Viewer, Astra is explicitly given **your file, your page, your summary, your selection** — not generic knowledge only.
- **Page-level and selection-level citation:** File Viewer sends the current page (and optionally its image); Summary Viewer sends the exact selected passage so answers can be grounded in **your** content.
- **Sessions tied to your account:** All sessions are persisted and listed; you can return to any conversation.
- **Follow-up questions:** Backend can return `follow_up_question`; the UI shows a **FollowUpPrompt** (“Ask this follow-up”) so the model can suggest the next question to deepen understanding.
- **Auto-rename:** When the session title is still “New Chat”, the frontend can auto-rename the session using the first assistant message (e.g. a short generated title).
- **Astra preferences:** Users can set **language** (Auto, English, Arabic, Turkish), **answer length** (Very short / Short / Balanced / Detailed for tutor; Very short / Short / Balanced for FileViewer), **teaching style** (Direct, Step-by-step, Exam-focused), and optional **study context** (free text, up to 500 chars) so Astra can tailor tone and depth.

### Suggested prompts (empty state)
- **Headline:** “What do you want to study now?”
- **Subline:** “Choose a quick action or type your question below.”
- **Quick actions (buttons):**
  1. **Explain a concept** — “Get a clear explanation” — seed: `"Explain "`
  2. **Exam-focused review** — “Study for your exam” — seed: `"Give me an exam-focused, high-yield review of "`
  3. **Use a file** — “Ask about your files” — seed: `"Using my uploaded file, explain "`
  4. **I'm confused — help me** — “Get guidance” — seed: `"I'm confused about "`
- Clicking a quick action **pre-fills the input** with the seed; user completes the phrase and sends. If no session exists, one is created or reused.

### Source citation from the user’s library
- **In File Viewer:** The backend receives `fileId`, `page`, and optionally the page image; any citation would be backend-driven (e.g. “from page 12 of [filename]”).
- **In Summary Viewer:** The backend receives `summaryId` and `selectionText`; it can cite the summary and, if provided, the source file.
- **Standalone:** No file or summary is sent, so citations would not be from the user’s library unless the backend injects that from elsewhere.

---

## 2. SUMMARIES

### How summaries are generated
- **Entry:** “Generate Summary” (dashboard or Summaries tab) opens **Generate Summary** modal.
- **User inputs:**
  - **Title** (required), e.g. “Cardiology Block Summary”
  - **Source file** (required): pick one file from the library tree (folders expandable; files selectable).
  - **Academic Stage:** 1st Year … 6th Year, Internship, Residency (default 4th Year).
  - **Specialty:** None, General Surgery, Internal Medicine, Pediatrics, OB/GYN, Psychiatry, Emergency, Radiology, Pathology.
  - **Goal:** Exam, Understanding, Revision.
  - **Optional instruction** (max 200 chars), e.g. “Focus on high-yield exam points and common traps.”
- **Payload sent:** `{ title, fileId, academic_stage, specialty, goal, instruction }`. Optional `prepareFile(fileId)` is called before generate.
- **Flow:** `POST /ai/summaries/generate` returns `jobId`; modal closes and the list shows the new summary in **generating** state. Frontend polls `GET /ai/summaries/job/:jobId` for status; when complete, `summaryId` is available and the card becomes clickable.

### What the output looks like
- **Schema (normalized in SummaryViewer):**
  - **sections[]:** Each has `heading` and `content` (prose). Rendered as **collapsible sections** with icons by heading type (e.g. Stethoscope, BookOpen, AlertTriangle).
  - **tables[]:** `headers` and `rows` — rendered as proper HTML tables in a rounded panel.
  - **key_takeaways[]:** Array of strings (filtered empty).
  - **references[]:** `{ text, page }` — displayed as reference list.
- **Context note:** Academic stage, specialty, goal shown as a single line (e.g. “4th_year · internal_medicine · exam”).
- **Source attribution:** `SourceAttribution` component can show source file title and page numbers and link to `/library/file/:fileId/page/:pageNumber`.

### Length and detail
- Not fixed in the frontend; backend controls length/detail. The **goal** (Exam / Understanding / Revision) and **instruction** field are the main levers the user has to influence depth and focus.

### Customization
- **Depth/focus:** Via **Goal** (Exam, Understanding, Revision) and **Optional instruction** (200 chars).
- **Specialty and stage:** Via **Academic Stage** and **Specialty** dropdowns.

### Summary viewer experience
- **Layout:** Main area = scrollable prose (max-width container); optional **side panel** for **Astra chat** (summary-aware, selection-aware).
- **Reading:** `prose prose-invert`; sections are collapsible; tables in bordered panels; key takeaways and references at the end.
- **Selection → Astra:** User selects text in the summary → “Ask Astra” (or similar) sends that selection as `selectionText` with summary context so Astra can answer about “this part.”
- **Chat in viewer:** Same session pattern; messages include summary + selection context.

### Share / import
- **Share:** “Generate Import Code” (or “Generate Import Code” in card overflow). Calls `POST /ai/summaries/:id/share` → returns `share_code` or `code` (e.g. `SYN-XXXXX`). User can copy the code.
- **Import:** User can enter a code (e.g. `SYN-XXXXX`); `POST /ai/summaries/import` with `{ code }` → backend returns `{ success, summary }`. Imported summary appears in the list like any other.

---

## 3. MCQ (Multiple Choice Questions)

### How MCQs are generated
- **Entry:** “Generate MCQs” from dashboard or MCQ tab → **Generate MCQ** modal (or “Create deck” flow).
- **Source:** User selects **one or more files** from the library (tree picker). Optional **folder** filter to scope to a folder.
- **Other inputs:** Deck title, number of questions (if exposed), difficulty/tag (if any) — see GenerateMCQModal for exact fields.
- **Flow:** Backend generates a **deck**; frontend polls until the deck is ready, then user can **Start** or **Resume** the deck.

### Question format
- **Single best answer.** Question text plus up to **5 options** (A–E). UI enforces “Select the single best answer” when the question text contains “most,” “best,” “primary,” or “main.”
- **Clinical vignettes:** Supported by content; no separate “vignette” type in the UI — same question/options layout.
- **No multi-select** in the current UI.

### Explanation system
- After the user **selects an option**, the backend returns correctness and **explanations** per option (or for correct/wrong).
- **Per-option explanation:** Shown in a small panel under each option after answer: “Why this is correct” (teal) or “Why this is wrong” (red). Text is stripped of echoed option phrasing.
- **Explain All:** Button **“Explain All”** appears after the user has answered and before they click **Next**. It sets `explainAll: true` in answer state so that **all options** show their explanations at once (not only correct/wrong). So the user can read every explanation before moving on.

### Results screen (deck complete)
- **Headline:** “Deck complete” (subtext: “We’ll style this and add actions next.”).
- **Hero score:** Large panel: “Score” → “X / Y” (correct / total) and “Z% correct.”
- **Supporting stats:** “Total time” (e.g. MM:SS), “Avg / question” (time per question).
- **Performance Mentor:** Rendered below (see next).
- **Actions:**
  - **Review Mistakes** — re-enter deck in review mode, **wrong** only.
  - **Review All** — re-enter deck in review mode, **all** questions.
  - **Retake Mistakes** — retake only wrong questions (disabled until backend sets `progress?.status === "completed"`).
  - **Restart Deck** — start deck from scratch (resets progress).
  - **Back to decks** — return to MCQ list.

### Performance Mentor panel
- **Purpose:** “Chess.com-style” performance analysis after a deck.
- **This-deck analysis:** Score, correct/total, time; severity badges (Note / Warning / Critical); “What this suggests” (insights); “Next attempt focus” (suggestions).
- **Longitudinal Performance (cross-deck):**
  - **Total Answers** (all-time).
  - **Global Accuracy** (all decks).
  - **7-Day Change** (e.g. +5% or -12%) if backend provides `analytics.seven_day_improvement_delta`.
  - **Weakest File** — file title + accuracy % (if backend returns `weakest_file`).
  - **Weakest Page** — file title + page number + accuracy % (if backend returns `weakest_page`).
  - **Contextual message** — e.g. when the current deck’s file is historically weak, a warning with severity (low/med/high) and suggested focus.

### Longitudinal tracking
- **useUserPerformanceOverview** fetches cross-deck stats and feeds **MCQPerformanceMentor**. So the mentor can show **global accuracy**, **7-day delta**, **weakest file/page**, and contextual advice. Tracking is **across multiple MCQ sessions/decks**, not just the current one.

### Other UI details
- **Source attribution:** Each question can show `SourceAttribution` (file title + page numbers) and link to the file viewer.
- **“Astra” button:** Next to the question for future “ask Astra about this question” (currently a button, behavior may be wired later).
- **Timer:** Elapsed time shown in header (e.g. Clock icon + MM:SS).
- **Progress bar:** “Question X of Y” and a thin progress bar (teal fill).

---

## 4. FLASHCARDS

### How flashcards are generated
- **Entry:** “Generate Flashcards” from dashboard or Flashcards tab → **Generate Flashcards** modal.
- **Source:** User selects **one or more files** from the library (multi-select in tree).
- **Options:**
  - **Title** (deck name).
  - **Mode:** **Turbo Recall** (“Fast recall, minimal redundancy”), **High Yield** (“Keeps only the highest exam points”), **Deep Mastery** (“Full concepts with strong explanations”).
  - **Include refs** (toggle): include references/sources on cards (default true).
- **Flow:** Backend creates a deck and sets `generating: true`. Frontend polls deck status; when `generating` is false, cards are fetched and the user can study.

### Flip interaction
- **Card:** Large rounded card (rounded-3xl), gradient background, teal shadow. **Front:** Label “QUESTION” (uppercase, tracking) + question text (centered). **Back:** Label “ANSWER” + answer as **bullets** (each line prefixed with a teal bullet). Click anywhere on the card to **flip** (toggle state).
- **Helper text:** “Click to flip. Use arrows to move between cards.”

### Spaced repetition
- **Grading UI:** In **DeckView** (study mode), when the card is **flipped**, three buttons appear: **Correct**, **Not sure**, **Incorrect**. `onGrade(cardId, result)` is called with `"correct" | "not_sure" | "incorrect"`.
- **Current frontend behavior:** `handleGrade` only **logs** the grade and **advances to the next card** (or finishes). There is **no frontend API call** to submit the grade; if spaced repetition exists, it would be backend-driven (e.g. if the app sent grades via another path). So from the **user’s perspective**: they can grade each card; the UI does not show a “next review” schedule or algorithm.

### Review mode vs normal mode
- **DeckView (normal/study):** One card at a time; flip; **Correct / Not sure / Incorrect**; Previous / Next (or Finish). Shows deck title and mode (Turbo Recall / High Yield / Deep Mastery).
- **ReviewScreen (review mode):** Accessed from deck list as a separate entry (e.g. “Review” vs “Study”). **No grading** — only flip + **left/right arrows** to move through the deck in order. Progress: “Card X / Y”. At the end, “Review complete!” and redirect back. So **review mode** = linear pass through all cards with no grading; **study mode** = grading and advance.

### Source attribution
- **Yes.** Each card shows **SourceAttribution** (bottom-right of card): file title and page numbers; click can navigate to ` /library/file/:fileId/page/:pageNumber`. So the user sees **which document and which page(s)** the card came from.

---

## 5. LEARNING / ANALYTICS

### Learning state (DECLINING / STABLE / IMPROVING)
- **Source:** `GET /api/learning/state` (and optionally `GET /api/learning/history`). Data includes `overall.state` (e.g. `DECLINING`, `STABLE`, `IMPROVING`, `INSUFFICIENT_DATA`).
- **How it’s calculated:** Backend logic; frontend only displays it. **getMicrocopy()** uses `overall.state`, `momentum`, `chronic_risk`, `days_in_state` to choose headlines and urgency.

### Momentum
- **Data:** `overall.momentum` or `momentum` — can be an object with `.dot` or a number. Frontend shows it as a **percentage delta** (e.g. “+5%” or “-12%”) in the State Signal block.
- **Meaning:** Represents recent trend in performance (e.g. accuracy change). Used for urgency and framing (e.g. “Accuracy dropped X% in Y days across multiple concepts”).

### Primary risk concept
- **Fields:** `primary_risk.concept_name`, `primary_risk.accuracy`, `primary_risk.attempts`, `primary_risk.risk_level`, `primary_risk.risk_reasons` (array or string), plus `chronic_risk` (boolean).
- **UI:** “PRIMARY RISK” section: concept name, accuracy %, attempts count, **risk level badge**, **risk reasons** as badges (e.g. “Low accuracy trend,” “Performance fluctuating,” “Frequent rushed errors,” “Extended solve time”). If `chronic_risk` is true, a **“CHRONIC”** badge is shown.
- **Severity statements:** e.g. “This concept is actively limiting your performance.” (HIGH_RISK), “This concept shows instability and needs reinforcement.” (MODERATE_RISK), “Minor inconsistency detected.” (LOW_RISK).

### Sparkline
- **Data:** `session_accuracy[]` — array of accuracy values (e.g. last N sessions).
- **UI:** Mini chart (sparkline) in the State Signal block to show trend at a glance.

### Transition timeline
- **Data:** `apiHistory` from `GET /api/learning/history` (or `data.transition` / `data.transition_history`). Array of past states.
- **UI:** **TransitionTimeline** — horizontal dot timeline showing how state changed over time (e.g. STABLE → DECLINING → IMPROVING).

### Concept breakdown
- **Data:** `concept_breakdown[]` — each item: `concept_id`, `concept_name`, `accuracy`, `trend`, `attempts`, `facet`.
- **UI:** **Concepts** tab: list of concepts with accuracy bar, trend, attempts, facet badge. Rows are expandable; expanded section is intended to show **question evidence** (e.g. sample questions and attempt counts). *Audit note: question evidence is currently hardcoded mock data in the frontend; real data would come from something like `/api/analytics/concepts/:conceptId/questions`.*

### Reinforcement session (step by step)
- **Entry:** From Learning page: prescription CTA (e.g. “Start 10-minute calibration session” or “Start X-Minute Focus Session”) or navigation to `/learning/reinforce/:conceptId` (and optionally `.../session/:sessionId`).
- **Prep screen:** If no `sessionId`, backend creates a **reinforcement session** (duration, e.g. 10 minutes; questions tied to the concept). User may see a “Reinforcement Plan” panel (from `POST /api/learning/reinforcement-plan`) and a button to **start** the session.
- **In-session:** **ReinforcementSession** component:
  - **Header:** “Reinforcement Session,” concept badge (e.g. primary concept name), “X / Y” (current question index), **countdown timer** (MM:SS).
  - **Question:** One MCQ at a time; options; user selects and submits → feedback (correct/wrong) then **Next**.
  - **Persistence:** Answers are sent to `POST /api/learning/mcq/answer`; session can be resumed (e.g. on refresh) by loading `GET /api/learning/reinforcement-session/:sessionId`.
- **End of session:** “SESSION COMPLETE” panel: score (X/Y correct, Z%), **AI teaching summary** (personalized, generated after completion), and outcome data. Green accent (#4E9E7A) throughout.

### Calibration
- **UI text:** “Start 10-minute calibration session” (or similar) and “Complete practice sessions to unlock trajectory analysis.” Shown when the system needs more data (e.g. “X more sessions needed”).
- **Behavior:** The **calibration CTA** on the Learning page was wired to a TODO (e.g. “Navigate to MCQ practice”); the **prescription CTA** that starts a **reinforcement session** is wired to `navigate(/learning/reinforce/:conceptId)` when prescription type is REINFORCE and target is a concept. So “calibration” is the idea of doing an initial set of sessions so the learning state can be computed; the actual action may be “start reinforcement” or future “start calibration” flow.

---

## 6. PLANNER

### What the user can do
- **Calendar:** Month view; navigate with ChevronLeft / ChevronRight. Days show **events** and **periods** (e.g. rotation/block/semester/subject with start/end and optional exam date).
- **Events:** Create/edit/delete events. **Event types:** Lecture, Exam, Period Start, Period End, Study Session, Note, Deadline. Each has a color. **Key date types** (for key dates): Exam, Deadline, Clinical Skills, Oral Exam, Project, Other.
- **Periods:** Create/edit/delete **periods** (date range + optional name, specialty, exam_date). Used for “active period” (e.g. current rotation) and for exam countdown.
- **Library link:** **Period–file tags:** Associate library files with periods (`getPeriodFileTags(fileId)`, `createPeriodFileTag`, `deletePeriodFileTag`). So the planner can know “which files belong to this block/rotation.”
- **Exam countdown:** If a period has `exam_date` and it’s within 30 days, the UI can show “Exam in X days.”

### AI vs manual
- Events and periods are **user-created** (or from API); no “AI-generated schedule” is visible in the frontend. The **Learning** page can consume **planner context** (e.g. `examMode`, `daysUntilExam`, `activePeriod`, `upcomingFileEvents`) to show “Exam in X days” and “sessions prioritized for [specialty]” — so the **intelligence** is: Learning uses planner data to tailor messaging and urgency, not to auto-create the calendar.

### Connection to uploaded materials
- **Period–file tags** link files to periods. **Upcoming file events** (e.g. “lecture on file X”) can be shown on the Learning page. So the planner is **connected** to the library and to learning (e.g. “upcoming lectures” and exam countdown).

### Calendar UI
- Month grid; days; events per day; periods spanning dates; key dates (exam, deadline, etc.). Side panels for adding/editing events and periods (e.g. slide-out panels). Background for the planner route is `#0C0C0E`.

---

## 7. LIBRARY

### File management experience
- **Tree view:** Folders and files in a hierarchy. Folders can have **custom colors** (e.g. yellow default). Expand/collapse folders.
- **Upload:** “Upload” or drag-and-drop opens **LibraryUploadModal**. User selects files (or drops); chooses **category** (e.g. Lecture) and optionally **folder**; can compress images/PDFs (client-side). Max **5 files** per upload, **25MB** per file. Accepted types: `.pdf, .doc, .docx, .ppt, .pptx, .txt, .md, .jpg, .jpeg, .png, .gif, .webp`.
- **After upload:** Files appear in the list. Backend may process (e.g. extract text, pages); frontend may show “processing” or “ready” — **no step-by-step pipeline UI** (e.g. “Step 1: Extracting text…”). If a summary/MCQ/flashcard generation is triggered and the file isn’t ready, user may see “Preparing content” or “FILE_NOT_READY.”
- **File actions (per file):** Open, Rename, Move to folder, Change category (files only), Delete. **Done** checkbox to mark “done” (teal check when done).
- **Categories:** e.g. Lecture, Book, etc.; **Change category** in the file menu. Library filters can filter by category (e.g. “All” or category-specific).

### File types supported
- **Upload accept:** PDF, DOC, DOCX, PPT, PPTX, TXT, MD, JPG, JPEG, PNG, GIF, WEBP. Backend may support a subset for processing (e.g. PDF and images for viewer and AI).

### File viewer
- **Route:** `/library/file/:fileId` and `/library/file/:fileId/page/:pageNumber`.
- **Modes:** **Page mode** (one page at a time; prev/next arrows) and **Scroll mode** (vertical scroll of all pages).
- **Content:** PDFs rendered via **PDF.js** (or backend-rendered page images); images shown directly. Canvas background `#050609` / `#0f1115`; rounded content area with border.
- **Zoom:** Zoom control; pan if needed (e.g. overflow-x-auto when zoomed).
- **Right sidebar:** Can be toggled; contains **Astra chat** for this file. Chat is **page-aware** (current page + optional page image sent with each message). Session can be bound to the file (e.g. `synapse_file_session_${file.id}` in localStorage).
- So **yes:** User can open a file and ask Astra questions about it **at the same time** (sidebar chat with page context).

---

## 8. OSCE & ORAL EXAM

### OSCE
- **Route:** `/osce`. **Component:** `OSCEModule` = **Placeholder**: “OSCE Module Coming Soon.” No functional content.

### Oral Exam
- **Route:** `/oral`. **Component:** Custom placeholder panel:
  - Badge: “In Development”
  - Title: “Oral Exam Mode — In Development”
  - Copy: “We're actively designing Oral Exam Mode to reflect real examiner behavior — stepwise questioning, follow-ups, and pressure-based evaluation.” “This mode is being tested internally and refined based on real exam patterns.”
- So **placeholders** only; no live OSCE or Oral Exam experience yet. Settings copy mentions “Oral Exam Mode” and “Practice structured oral-style questions with adaptive follow-ups” as coming later.

---

## 9. SETTINGS & PROFILE

### What users can customize
- **Profile:** Field of study, year, university, country, primary goals (from onboarding); name/email from auth.
- **Astra preferences** (see below).
- **Announcements** (read-only).
- **Feedback** (submit suggestions).
- **Change password** (modal).
- **Logout.**

### Astra preferences
- **Panel:** “Astra – Answer Preferences” (Brain icon).
- **Options:**
  - **Language:** Auto (default), English, Arabic, Turkish.
  - **Tutor Answer Length:** Very short, Short, Balanced, Detailed.
  - **FileViewer Answer Length:** Very short, Short, Balanced.
  - **Teaching Style:** Direct, Step-by-step, Exam-focused.
  - **Study context (optional):** Free text, max 500 chars; placeholder: “Tell Astra anything relevant about your current studies (e.g. clerkship, exam prep, level). This is used as background context only.”
- Stored in **Supabase profiles.astra_preferences** (with localStorage fallback). Unsaved changes trigger a **beforeunload** warning.

### Announcements and feedback
- **Announcements:** Fetched from settings API; displayed in **AnnouncementsPanel** with title, body, date. Left border accent (teal).
- **Feedback:** **FeedbackBox** — “Suggestions & Feedback”; “Tell us what feels off, missing, or confusing. We read everything.” Textarea “Write your suggestion here…”, button “Send feedback.” Success: “Thanks — your feedback was sent.”

---

## 10. OVERALL SYSTEM INTELLIGENCE

### Data Synapse uses (from the frontend’s perspective)
- **Tutor:** Session messages, file/page when in File Viewer, summary + selection when in Summary Viewer.
- **Summaries:** Generation params (file, stage, specialty, goal, instruction); share/import codes.
- **MCQ:** Decks, attempts, answers, timing; **user performance overview** (totals, accuracy, 7-day delta, weakest file/page) for cross-deck mentor.
- **Flashcards:** Decks, cards, optional grading (correct/not_sure/incorrect) — backend may store for SRS.
- **Learning:** State, momentum, primary risk, concept breakdown, session accuracy, history, reinforcement sessions and answers.
- **Planner:** Events, periods, exam dates, period–file tags, upcoming file events.
- **Library:** Files, folders, categories, processing state.
- **Profile/onboarding:** Field of study, year, university, country, primary goals.

### Cross-feature intelligence
- **Learning ↔ Planner:** Learning page receives `plannerContext` (exam mode, days until exam, active period, upcoming file events) and shows “Exam in X days” and “sessions prioritized for [specialty].”
- **Learning → Reinforcement:** Primary risk concept drives “Start X-Minute Focus Session” and navigation to `/learning/reinforce/:conceptId`.
- **MCQ → Performance Mentor:** Cross-deck stats (weakest file/page, 7-day change) inform the mentor on the results screen.
- **File Viewer → Astra:** Page and optional image sent so Astra can answer in context of the current page.
- **Summary Viewer → Astra:** Summary + selection sent so Astra can cite and explain the selected part.

### What’s impressive but easy to miss
- **One place for “your” content:** File viewer + summary viewer + MCQ + flashcards all tie back to **your library**. Astra (in those contexts) and source attribution consistently point to **your** files and pages.
- **Learning state is more than a score:** DECLINING/STABLE/IMPROVING + momentum + primary risk + prescription give a **narrative** (“This concept is limiting you” + “Start a focus session”) rather than a single number.
- **Reinforcement session is concept-targeted:** Sessions are built for a **specific concept** and persisted so you can resume; plus AI teaching summary at the end.
- **Performance mentor uses all your MCQ history:** Not just the deck you finished — weakest file/page and 7-day trend come from **all** attempts.

### What a power user discovers after 30 days
- **Multiple tutor sessions** (tabs) for different topics; rename/delete and return to old threads.
- **Summary selection → Astra** for deep dives on one section without retyping.
- **File viewer + Astra** while reading: ask about the exact page.
- **Review Mistakes / Retake Mistakes** and **Performance Mentor** to focus on weak spots.
- **Flashcard source attribution** to jump back to the source page from a card.
- **Planner exam date** and **Learning** “Exam in X days” and prioritized messaging.
- **Astra preferences** (length, style, study context) to make answers match their level and exam focus.

---

## 11. ANYTHING ELSE

### Easter eggs / hidden flows
- **Demo mode:** Optional demo overlay and API interception for tours (e.g. MCQ explain-all button, file viewer, Astra chat container) with `data-demo` attributes.
- **Previous Topics panel:** Tutor has a “History” button that opens a panel of past sessions (open tabs vs closed); user can re-open or delete/rename from there.

### Partially visible or in development
- **OSCE / Oral Exam:** Placeholders only.
- **Calibration CTA:** Button text exists (“Start 10-minute calibration session”) but original handler was TODO; prescription CTA is wired to reinforcement.
- **Concept drill-down evidence:** Concepts tab expand shows **mock** question list; real API for concept questions not wired in the audit.
- **“Astra” button on MCQ question:** Present in UI; may be for future “ask Astra about this question.”

### Onboarding / tour
- **Onboarding flow (post-signup):** Steps: Account type → Country → University → Year or specialty → **Primary goal** (multi-select: Pass Exams, Study Summaries, Flashcards, Clinical Cases, OSCE Prep, Question Bank, Research Help) → **Resource preferences** (e.g. types of materials) → **Onboarding complete** (thank-you + redirect).
- **Dashboard tour:** Optional **DashboardTourCard** (“Take a quick tour”); copy and steps can highlight Upload, Library, Tutor, Summaries, MCQs, Flashcards. Demo overlay can guide through Library → file → Astra chat and MCQ flow.

### UI text worth reusing on a landing page
- “What do you want to study now?”
- “Explain a concept” / “Exam-focused review” / “Use a file” / “I'm confused — help me”
- “Your performance is stable. Controlled progression is appropriate.” / “Your performance is currently unstable. Immediate reinforcement of high-risk concepts is recommended.”
- “This concept is actively limiting your performance.”
- “Start X-Minute Focus Session” / “Complete practice sessions to unlock trajectory analysis”
- “Deck complete” / “Score” / “Review Mistakes” / “Review All” / “Retake Mistakes”
- “Click to flip. Use arrows to move between cards.”
- “Tell us what feels off, missing, or confusing. We read everything.”
- “Tell Astra anything relevant about your current studies (e.g. clerkship, exam prep, level).”
- “We're actively designing Oral Exam Mode to reflect real examiner behavior — stepwise questioning, follow-ups, and pressure-based evaluation.”

---

**End of report.** Use this together with **DESIGN_SYSTEM_SNAPSHOT.md** for visuals and **LEARNING_PAGE_WIRING_AUDIT.md** for learning/analytics implementation details.
