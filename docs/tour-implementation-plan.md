# Synapse Guided Tour — Implementation Plan

**Document Purpose:** Pre-implementation planning for guided tour feature  
**Date:** January 2026  
**Status:** Planning — Not Implemented  
**Scope:** Frontend only

---

## 1. TOUR STRATEGY (HIGH LEVEL)

### 1.1 Approach: **Hybrid (Contextual + Linear)**

**Rationale:**
- Medical students are task-oriented and learn best when features are relevant to their current goal
- Pure linear tours feel like marketing popups and interrupt workflow
- Pure contextual tours miss the mental model (Library → Generate → Practice → Tutor)
- Hybrid allows teaching the model while respecting user intent

**Structure:**
- **Entry Tour (Linear):** Short 3-4 step walkthrough after onboarding completion
- **Contextual Hints:** Tooltips appear when user reaches a feature for the first time
- **Progressive Disclosure:** Advanced features only explained when user demonstrates readiness

### 1.2 Trigger Strategy: **Skippable, Resume-able, Manual Restart**

**When Tour Triggers:**
1. **First-time entry:** After onboarding completion, before first meaningful action
2. **Manual trigger:** "Take a 2-minute tour" button on Dashboard (already exists)
3. **Contextual hints:** First-time feature access (one-time only)

**Skippability:**
- ✅ Always skippable (ESC key, "Skip tour" button)
- ✅ Can resume later from Dashboard
- ✅ Never auto-triggers after first completion

**Persistence:**
- Backend: `profile.tour_completed` boolean flag
- Frontend: `localStorage.synapse_tour_progress` for resume state
- Both required for reliability

**Why This Strategy:**
- Medical exam workflows are time-sensitive; users must be able to skip
- Resume-ability respects users who get interrupted
- Manual restart allows re-learning after time away

---

## 2. TOUR ENTRY POINTS

### 2.1 Primary Entry: Post-Onboarding

**Trigger:** User completes onboarding → clicks "Enter Dashboard" → lands on `/dashboard`

**User State:**
- Just finished onboarding
- No files uploaded
- No content generated
- Dashboard shows empty states

**Problem at This Moment:**
- User doesn't know where to start
- Mental model unclear (what is Library? What is Tutor?)
- Overwhelmed by sidebar options

**What Tour Should Clarify:**
- The workflow: Upload → Generate → Practice → Ask
- Where to start (Library first)
- What each major section does

**Tour Type:** Linear entry tour (3-4 steps)

---

### 2.2 Secondary Entry: Manual Dashboard Trigger

**Trigger:** User clicks "Take a 2-minute tour" button on Dashboard

**User State:**
- May have already used the app
- May have files/content
- Wants to learn more or refresh knowledge

**Problem at This Moment:**
- User is curious or lost
- Wants structured learning

**What Tour Should Clarify:**
- Full workflow overview
- Advanced features they may have missed
- Unique value propositions

**Tour Type:** Full linear tour (6-8 steps)

---

### 2.3 Contextual Entry: First-Time Feature Access

**Trigger:** User performs action for the first time:
- First file upload
- First MCQ generation
- First Tutor interaction with file context
- First MCQ resume

**User State:**
- Actively trying to use a feature
- May have skipped entry tour

**Problem at This Moment:**
- Feature may not work as expected
- User may not understand unique capabilities

**What Tour Should Clarify:**
- The specific feature's unique value
- How it differs from generic tools (ChatGPT, etc.)

**Tour Type:** Single contextual tooltip (non-blocking)

---

## 3. TOUR STEPS (CONTENT PLAN)

### 3.1 Entry Tour (Post-Onboarding) — 3 Steps

**Step 1: Library Introduction**
- **Feature:** Library sidebar item + upload button
- **Learn:** "Your files are the foundation. Upload lectures, notes, or slides here."
- **UI Type:** Overlay with focus lock on Library sidebar item
- **Interaction:** User must click Library (or tour auto-navigates)
- **Duration:** ~15 seconds

**Step 2: Generation Overview**
- **Feature:** Summaries/MCQs/Flashcards tabs in sidebar
- **Learn:** "Generate study materials from your files. AI creates summaries, practice questions, and flashcards."
- **UI Type:** Tooltip pointing to sidebar tabs
- **Interaction:** Read-only (no click required)
- **Duration:** ~20 seconds

**Step 3: Tutor Introduction**
- **Feature:** Tutor sidebar item
- **Learn:** "Astra is your AI tutor. Ask questions about your files, or get general help."
- **UI Type:** Tooltip pointing to Tutor sidebar item
- **Interaction:** Read-only
- **Duration:** ~15 seconds

**Total Duration:** ~50 seconds (under 1 minute)

---

### 3.2 Full Tour (Manual Trigger) — 7 Steps

**Step 1: Dashboard Overview**
- **Feature:** Dashboard page
- **Learn:** "This is your home. Quick actions, recent activity, and your tour entry point."
- **UI Type:** Inline highlight (subtle glow on Dashboard card)
- **Interaction:** Read-only
- **Duration:** ~10 seconds

**Step 2: Library Upload**
- **Feature:** Library page + upload button
- **Learn:** "Upload your first file. Drag and drop or click to browse. Files are accessible immediately."
- **UI Type:** Overlay with focus lock on upload button
- **Interaction:** User can optionally upload (tour continues either way)
- **Duration:** ~20 seconds

**Step 3: File Viewer Context**
- **Feature:** File viewer (if file exists) or Library card
- **Learn:** "Click any file to view it. You can chat with Astra about specific pages."
- **UI Type:** Tooltip on file card or viewer
- **Interaction:** Read-only (or user clicks file if available)
- **Duration:** ~15 seconds

**Step 4: Generate Summary**
- **Feature:** Summaries tab + Generate button
- **Learn:** "Generate AI summaries from your files. Select files, set parameters, and get structured summaries."
- **UI Type:** Tooltip on Summaries tab
- **Interaction:** Read-only
- **Duration:** ~15 seconds

**Step 5: Generate MCQ**
- **Feature:** MCQs tab
- **Learn:** "Create practice question decks. Resume anytime, review mistakes, and track progress."
- **UI Type:** Tooltip on MCQs tab
- **Interaction:** Read-only
- **Duration:** ~15 seconds

**Step 6: Tutor File-Awareness (UNIQUE VALUE)**
- **Feature:** Tutor page + file context selector
- **Learn:** "Astra can see your files. Ask questions about specific pages, and get context-aware answers."
- **UI Type:** Overlay highlighting file selector in Tutor
- **Interaction:** Read-only (or user can try it)
- **Duration:** ~20 seconds

**Step 7: MCQ Resume Feature (UNIQUE VALUE)**
- **Feature:** MCQs tab → Open deck → Resume modal
- **Learn:** "MCQ decks remember your progress. Resume where you left off, review mistakes, or retake wrong answers."
- **UI Type:** Tooltip (if deck exists) or modal explanation
- **Interaction:** Read-only
- **Duration:** ~20 seconds

**Total Duration:** ~2 minutes

---

### 3.3 Contextual Hints (First-Time Features) — Single Tooltips

**Hint 1: First File Upload**
- **Trigger:** User opens upload modal for first time
- **Message:** "Files are accessible immediately. Processing happens in the background."
- **UI Type:** Small tooltip near upload button
- **Interaction:** Non-blocking, auto-dismisses after 5 seconds or on action

**Hint 2: First MCQ Generation**
- **Trigger:** User opens Generate MCQ modal for first time
- **Message:** "MCQ decks save your progress. You can resume anytime and review mistakes."
- **UI Type:** Small tooltip near Generate button
- **Interaction:** Non-blocking, auto-dismisses

**Hint 3: First File-Aware Tutor Question**
- **Trigger:** User selects a file in Tutor and asks first question
- **Message:** "Astra can see your file. Ask about specific pages, diagrams, or concepts."
- **UI Type:** Small tooltip near chat input
- **Interaction:** Non-blocking, auto-dismisses

**Hint 4: First MCQ Resume**
- **Trigger:** User opens MCQ deck with existing progress
- **Message:** "You have progress on this deck. Continue, start over, or review mistakes."
- **UI Type:** Tooltip on entry modal
- **Interaction:** Non-blocking, appears once

---

## 4. UNIQUE VALUE MOMENTS (CRITICAL)

### 4.1 File-Aware Tutoring (vs ChatGPT/Gemini)

**What Makes It Unique:**
- Astra can see and reference specific pages, diagrams, and text from uploaded files
- Answers are contextual to the user's actual study materials
- Not just generic AI chat — it's a tutor that "reads" your files

**How Tour Showcases This:**
- **Step 6 of Full Tour:** Highlights file selector in Tutor
- **Contextual Hint 3:** Appears when user first uses file context
- **Demo:** Show example question like "Explain the diagram on page 5" with file selected

**Why This Matters:**
- This is the #1 differentiator from generic AI tools
- Medical students need context-specific help, not generic answers
- Must be emphasized early and clearly

---

### 4.2 MCQ Progress Persistence (vs Generic Quiz Apps)

**What Makes It Unique:**
- MCQ decks remember progress across sessions
- Resume from last question
- Review mistakes only
- Retake wrong answers
- Progress tracking (questions answered, correct/incorrect)

**How Tour Showcases This:**
- **Step 5 of Full Tour:** Mentions resume capability
- **Step 7 of Full Tour:** Deep dive into resume/review features
- **Contextual Hint 4:** Appears when user opens deck with progress

**Why This Matters:**
- Medical students study in sessions; progress persistence is critical
- Review mistakes feature is unique to Synapse
- Shows Synapse understands medical exam workflows

---

### 4.3 File-Aware Generation (vs Generic AI)

**What Makes It Unique:**
- Summaries, MCQs, and Flashcards are generated from user's actual files
- Not generic content — tailored to their materials
- Can generate from multiple files
- Respects academic stage and field of study

**How Tour Showcases This:**
- **Step 4 of Full Tour:** Emphasizes "from your files"
- **Step 5 of Full Tour:** Shows file selection in generation
- **Contextual Hints 1-2:** Mention file-based generation

**Why This Matters:**
- Users may think Synapse is just another AI tool
- Must clarify that generation is file-specific, not generic

---

### 4.4 Academic Stage Adaptation (Future)

**What Makes It Unique:**
- Tutor and generation adapt to user's academic stage (pre-clinical, clinical, residency)
- Content difficulty and depth match their level
- Personalized to their field of study

**How Tour Showcases This:**
- **Not in initial tour** (feature may not be fully implemented)
- **Future addition:** Mention in onboarding completion or settings

**Why This Matters:**
- Shows Synapse is built for medical education, not generic learning
- Personalization is a key differentiator

---

## 5. TECHNICAL APPROACH (FRONTEND ONLY, NO CODE)

### 5.1 Library Choice: **Custom-Built System**

**Rationale:**
- Medical workflows require precise control (no interrupting exams)
- Need route-aware, state-aware tour system
- Existing libraries (react-joyride, intro.js) are too generic and hard to customize
- Custom system allows medical-specific safety rules

**Alternative Considered:** `react-joyride`
- **Pros:** Battle-tested, accessible
- **Cons:** Hard to customize for medical workflows, doesn't handle route changes well, feels "marketing-y"

**Decision:** Custom-built for control and medical workflow respect

---

### 5.2 Component Architecture

**Core Components:**
1. **`TourProvider`** (Context)
   - Manages tour state (active, current step, progress)
   - Handles persistence (localStorage + backend sync)
   - Provides tour control functions (start, stop, skip, next)

2. **`TourOverlay`** (Portal-based)
   - Renders tour UI (tooltips, highlights, modals)
   - Handles focus lock and backdrop
   - Manages z-index and positioning

3. **`TourStep`** (Wrapper)
   - Wraps components that need tour highlighting
   - Provides refs for positioning
   - Handles step-specific logic

4. **`TourManager`** (Logic)
   - Defines tour steps (JSON config)
   - Handles step transitions
   - Manages route changes during tour

---

### 5.3 Step Attachment Strategy

**Method: `data-tour` attributes + refs**

**Why:**
- Non-invasive (doesn't require component changes)
- Works with existing components
- Easy to add/remove steps
- Accessible (can use ARIA attributes)

**Implementation Pattern:**
```javascript
// In component:
<div data-tour="library-upload" ref={uploadRef}>
  <UploadButton />
</div>

// In tour config:
{
  id: "library-upload",
  selector: "[data-tour='library-upload']",
  message: "Upload your first file...",
  position: "bottom",
  highlight: true
}
```

**Alternative:** Direct refs (more invasive, requires component changes)

---

### 5.4 Route Change Handling

**Problem:** Tour steps span multiple routes (Dashboard → Library → Tutor)

**Solution:**
- Tour Manager listens to route changes
- Pauses tour during navigation
- Resumes on target route if step requires it
- Shows "Navigating..." indicator during route change

**Implementation:**
- Use React Router's `useLocation` hook
- Check if current route matches step's required route
- Auto-navigate if step requires route change (with user confirmation)

---

### 5.5 Conditional Rendering Handling

**Problem:** Some components render conditionally (modals, file viewer, etc.)

**Solution:**
- Tour steps can wait for element to appear
- Poll for element existence (max 5 seconds)
- Skip step if element never appears (with fallback message)
- Mark step as "conditional" in config

**Example:**
```javascript
{
  id: "file-viewer",
  selector: "[data-tour='file-viewer']",
  waitFor: true, // Wait for element to appear
  timeout: 5000,
  fallback: "Open a file to see this feature"
}
```

---

### 5.6 Mobile vs Desktop

**Strategy:** Desktop-first, mobile simplified

**Desktop:**
- Full tour with all steps
- Overlays, tooltips, focus locks
- Full feature showcase

**Mobile:**
- Simplified tour (3-4 key steps)
- No overlays (use modals instead)
- Touch-friendly tooltips
- Skip complex features (file viewer, etc.)

**Detection:**
- Use `window.innerWidth` or CSS media queries
- Different tour config for mobile
- Auto-detect and serve appropriate tour

---

### 5.7 State Persistence

**Strategy: Dual Persistence (Frontend + Backend)**

**Frontend (`localStorage`):**
- `synapse_tour_progress`: Current step index
- `synapse_tour_completed`: Boolean (all tours)
- `synapse_tour_contextual_hints`: Object of shown hints
- **Why:** Fast, works offline, immediate

**Backend (`profile.tour_completed`):**
- Boolean flag: Has user completed entry tour?
- **Why:** Reliable, survives device changes, analytics

**Sync Strategy:**
- On tour start: Check backend flag
- On tour completion: Update both localStorage and backend
- On resume: Use localStorage for step, backend for completion status

**API Endpoint Needed:**
- `PATCH /profile` (update `tour_completed` flag)
- Or include in existing profile update endpoint

---

## 6. UX SAFETY RULES (NON-NEGOTIABLE)

### 6.1 Never Interrupt Active Workflows

**Rules:**
- ❌ Never show tour during active MCQ session (user is answering questions)
- ❌ Never show tour during file upload (wait until complete)
- ❌ Never show tour during generation (wait until complete)
- ❌ Never show tour during Tutor chat (wait until message sent/received)

**Implementation:**
- Check component state before showing step
- Tour Manager queries active states before proceeding
- Pause tour if user enters protected workflow

**Protected Workflows:**
- MCQ: `MCQDeckView` with `finished === false`
- File Upload: `LibraryUploadModal` open
- Generation: Any modal with `generating === true`
- Tutor: Active chat session (messages in flight)

---

### 6.2 Always Allow Skip

**Rules:**
- ✅ Every step must have "Skip tour" button
- ✅ ESC key always closes tour
- ✅ Clicking outside (backdrop) closes tour (with confirmation)
- ✅ "Remind me later" option (saves progress, can resume)

**Implementation:**
- Skip button visible on every step
- ESC key listener in TourOverlay
- Backdrop click handler with confirmation modal

---

### 6.3 Never Repeat Once Completed

**Rules:**
- ✅ Entry tour shows once (unless user manually restarts)
- ✅ Contextual hints show once per feature
- ✅ Full tour can be restarted manually (Dashboard button)
- ✅ Completion persists across devices (backend flag)

**Implementation:**
- Check `profile.tour_completed` before auto-triggering
- Check `localStorage.synapse_tour_contextual_hints` for contextual hints
- Manual restart clears flags and starts fresh

---

### 6.4 Never Block Core Actions

**Rules:**
- ✅ User can always close tour and perform action
- ✅ Tour doesn't prevent file upload, generation, or chat
- ✅ Tour can be dismissed mid-step
- ✅ No "you must complete tour" gates

**Implementation:**
- Tour overlay doesn't block underlying actions (except focus lock on highlighted element)
- User can click "Skip" and perform action immediately
- No forced completion

---

### 6.5 Respect Medical Exam Context

**Rules:**
- ❌ Never interrupt during timed practice (MCQ timer running)
- ❌ Never interrupt during review mode (user is studying)
- ❌ Never interrupt during file viewing (user is reading)
- ✅ Only show tour when user is in "exploration" mode (Dashboard, empty Library, etc.)

**Implementation:**
- Check for active timers, review modes, focused reading states
- Tour only triggers in "safe" contexts (Dashboard, empty states, sidebar navigation)

---

## 7. OPEN QUESTIONS & RISKS

### 7.1 UX Risks

**Risk 1: Tour Feels Like Marketing Popup**
- **Mitigation:** Keep it short (under 2 minutes), contextual, skippable
- **Decision Needed:** Should tour be more "educational" (teach concepts) or "functional" (show features)?

**Risk 2: Tour Interrupts User Flow**
- **Mitigation:** Only trigger in safe contexts, always skippable
- **Decision Needed:** Should tour be mandatory for first-time users, or always optional?

**Risk 3: Tour Doesn't Cover Advanced Features**
- **Mitigation:** Contextual hints for advanced features
- **Decision Needed:** Should there be a "Advanced Features" tour separate from entry tour?

**Risk 4: Tour Becomes Outdated as Features Change**
- **Mitigation:** Tour config in JSON (easy to update)
- **Decision Needed:** Who maintains tour content? Product? Engineering?

---

### 7.2 Technical Risks

**Risk 1: Route Changes Break Tour**
- **Mitigation:** Tour Manager handles route changes, pauses/resumes
- **Decision Needed:** Should tour auto-navigate, or require user to navigate?

**Risk 2: Conditional Rendering Causes Tour to Fail**
- **Mitigation:** Wait-for-element logic, fallback messages
- **Decision Needed:** Should tour skip steps if elements don't exist, or wait indefinitely?

**Risk 3: Mobile Experience Poor**
- **Mitigation:** Simplified mobile tour, touch-friendly UI
- **Decision Needed:** Should mobile tour be same as desktop, or completely different?

**Risk 4: Performance Impact**
- **Mitigation:** Lazy load tour components, minimal re-renders
- **Decision Needed:** Should tour be code-split, or included in main bundle?

---

### 7.3 Edge Cases

**Edge Case 1: User Completes Onboarding but Immediately Logs Out**
- **Solution:** Tour triggers on next login (if not completed)

**Edge Case 2: User Skips Tour but Wants to See It Later**
- **Solution:** Manual trigger on Dashboard (already exists)

**Edge Case 3: User Has Files but Never Generated Content**
- **Solution:** Tour adapts — show generation steps even if files exist

**Edge Case 4: User on Mobile with Small Screen**
- **Solution:** Simplified tour, larger touch targets, modal-based instead of tooltips

**Edge Case 5: User Has Slow Internet (Tour Assets Load Slowly)**
- **Solution:** Tour assets minimal (text only, no images), inline styles

**Edge Case 6: User Uses Keyboard Navigation (Accessibility)**
- **Solution:** Tour must be fully keyboard accessible (Tab, Enter, ESC)

---

### 7.4 Product Decisions Needed

**Decision 1: Tour Completion Requirement**
- **Question:** Should users be required to complete tour before using app?
- **Options:**
  - A) Optional (current plan)
  - B) Mandatory for first-time users
  - C) Mandatory but can skip after 30 seconds

**Decision 2: Tour Content Tone**
- **Question:** Should tour be formal/educational or casual/friendly?
- **Options:**
  - A) Professional medical tone
  - B) Friendly but respectful
  - C) Minimal (just facts)

**Decision 3: Tour Length**
- **Question:** What's the maximum acceptable tour length?
- **Options:**
  - A) Under 1 minute (entry tour only)
  - B) Under 2 minutes (full tour)
  - C) As long as needed (user can skip)

**Decision 4: Contextual Hints Frequency**
- **Question:** How many contextual hints is too many?
- **Options:**
  - A) 2-3 hints max
  - B) 4-5 hints (current plan)
  - C) Unlimited (show for every first-time feature)

**Decision 5: Tour Analytics**
- **Question:** Should we track tour completion rates?
- **Options:**
  - A) Yes, track completion, skip rates, step drop-off
  - B) No tracking (privacy-first)
  - C) Anonymous aggregate only

---

## 8. IMPLEMENTATION PHASES (RECOMMENDED)

### Phase 1: MVP (Entry Tour Only)
- Post-onboarding 3-step tour
- Custom tour system (basic)
- Skip functionality
- localStorage persistence
- **Timeline:** 1-2 weeks

### Phase 2: Full Tour
- 7-step manual tour
- Route change handling
- Backend persistence
- **Timeline:** 1 week

### Phase 3: Contextual Hints
- First-time feature tooltips
- Conditional rendering handling
- Mobile support
- **Timeline:** 1 week

### Phase 4: Polish
- Accessibility improvements
- Analytics (if approved)
- Content refinement
- **Timeline:** 1 week

**Total Estimated Timeline:** 4-5 weeks

---

## 9. SUCCESS METRICS (FUTURE)

**Note:** Metrics require product decision on analytics (see 7.4, Decision 5)

**If Analytics Approved:**
- Tour completion rate (target: >60%)
- Skip rate (target: <30%)
- Step drop-off points (identify confusing steps)
- Time to first meaningful action (should decrease)
- Support ticket reduction (fewer "how do I..." questions)

**If No Analytics:**
- Qualitative feedback from users
- Support ticket analysis
- User interviews

---

## 10. NEXT STEPS

1. **Review this plan** with product/founder
2. **Answer open questions** (Section 7.4)
3. **Approve tour content** (tone, length, steps)
4. **Approve technical approach** (custom vs library)
5. **Create detailed step content** (exact copy for each step)
6. **Design tour UI** (tooltip style, overlay design)
7. **Implement Phase 1** (MVP entry tour)

---

**Document Status:** Ready for Review  
**Last Updated:** January 2026  
**Owner:** Frontend Engineering + Product

