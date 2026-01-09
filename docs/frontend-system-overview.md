---
Title: Synapse Frontend System Overview
Version: v1.0 (Current Production State)
Status: Factual Architecture Documentation
Last Updated: January 2026
---

# Synapse Frontend System Overview

## Executive Summary

This document provides a factual snapshot of the Synapse frontend architecture as it exists in production. It describes how users navigate the application, how state is managed, how data flows through the UI, and how the frontend communicates with backend services.

**Scope:** This document describes ONLY what is currently implemented and available to users. It does not include planned features, experimental code, or deprecated functionality.

---

## 1. Application Structure

### 1.1 Technology Stack

- **Framework:** React 18+ (functional components with hooks)
- **Routing:** React Router DOM v7.11.0 (client-side SPA)
- **State Management:** Component-local state + React Context (no global store)
- **Authentication:** Supabase Auth (email/password + OAuth callbacks)
- **API Communication:** RESTful API calls via `fetch` with Supabase token
- **Styling:** CSS modules + Tailwind CSS classes
- **Build Tool:** Vite

### 1.2 Application Entry Point

**File:** `src/main.jsx` → `src/App.jsx`

**Root Component:** `App()` wraps `SynapseOS` with `DemoProvider`

**Initial Flow:**
1. App checks Supabase session on mount
2. If authenticated → fetch profile → check onboarding status
3. If not authenticated → show landing page
4. If profile incomplete → show onboarding flow
5. If profile complete → show main application

### 1.3 Layout Structure

```
┌─────────────────────────────────────────┐
│  Header (Notifications + Profile)      │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Main Content Area           │
│ (Fixed)  │  (Routes)                    │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Sidebar:**
- Fixed left sidebar (80px width)
- Navigation icons: Dashboard, Library, Tutor, Flashcards, MCQ, Summaries, OSCE, Oral Exam, Planner, Analytics, Settings
- Always visible when authenticated

**Header:**
- Fixed top bar (64px height)
- Left: "Synapse Beta" branding
- Right: Notifications bell + Profile avatar/name

**Main Content:**
- Scrollable content area (flex-1)
- Routes render within this area
- Modals render as overlays

---

## 2. Routing & Navigation

### 2.1 Route Structure

**Root Route:**
- `/` → Redirects to `/dashboard`

**Authentication Routes:**
- `/auth/callback` → OAuth callback handler (special case, renders before main app)

**Main Application Routes:**
- `/dashboard` → Dashboard page (home)
- `/library` → Library file grid
- `/library/:fileId` → FileViewer (file detail view)
- `/library/:fileId/page/:pageNumber` → FileViewer (specific page)
- `/tutor` → Standalone Tutor/Astra chat page
- `/summaries` → Summaries list
- `/summaries/:summaryId` → Summary viewer
- `/mcq` → MCQ decks list
- `/mcq/:deckId` → MCQ deck viewer (route-based)
- `/flashcards` → Flashcards decks list
- `/flashcards/:deckId` → Flashcard deck viewer (route-based)
- `/settings` → Settings page
- `/osce`, `/oral`, `/planner`, `/analytics` → Placeholder pages ("Coming Soon")

**Route Protection:**
- All routes except `/auth/callback` require authentication
- Unauthenticated users → redirected to landing page
- Incomplete profile → redirected to onboarding

### 2.2 Navigation Patterns

**Sidebar Navigation:**
- Click sidebar icon → `navigate()` to route
- Active route highlighted with accent color
- URL updates immediately

**Deep Linking:**
- ✅ Supported: Library files, Summaries, MCQ decks, Flashcard decks
- ✅ Notification clicks navigate to deep links
- ✅ Browser back/forward works for route-based navigation
- ✅ URL updates on page navigation (FileViewer page changes)

**State-Driven Navigation:**
- Auth screens (landing, signup, login, onboarding) use component state, not routes
- Modal state managed in `App.jsx` (centralized modal state)

---

## 3. Core Modules

### 3.1 Library Module

**Route:** `/library`, `/library/:fileId`, `/library/:fileId/page/:pageNumber`

**Components:**
- `LibraryPage.jsx` - Main container (handles routing, file selection)
- `LibraryGrid.jsx` - File grid display
- `LibraryCard.jsx` - Individual file card
- `LibraryFilters.jsx` - Filter by category/type
- `FileViewer.jsx` - Full-screen file viewer (rendered within LibraryPage)
- `LibraryUploadModal.jsx` - File upload interface

**State Management:**
- `items` - Array of library items (files + folders)
- `currentFolder` - Currently selected folder (null = root)
- `activeFilter` - Current filter ("All", "PDFs", "Images", etc.)
- `selectedFile` - Currently open file (for FileViewer)
- Local state only, no global store

**Key Features:**
- Folder navigation (breadcrumbs)
- File filtering by type
- File upload with folder selection
- File operations (rename, move, delete, change category)
- Polling for processing files (30s interval while files are rendering)

**API Calls:**
- `getLibraryItems(filter, folderId)` - Fetch files/folders
- `getItemById(fileId)` - Fetch single file with page contents
- `deleteItem(id)` - Delete file/folder
- `moveItem(id, targetFolderId)` - Move to folder
- `performLibraryAction(action, params)` - Generic action handler

**File Processing States:**
- Files polled every 30s while `render_state.status !== "completed"` OR `ocr_status !== "completed"`
- Terminal states: both must be "completed" for file to be considered ready

---

### 3.2 FileViewer Module

**Route:** `/library/:fileId` (rendered within LibraryPage)

**Components:**
- `FileViewer.jsx` - Main viewer component
- `PdfJsPage.jsx` - PDF.js page renderer (fallback)
- `DemoAstraChat.jsx` - Demo-only chat (isolated from backend)
- Generation modals: `GenerateSummaryModal`, `GenerateMCQModal`, `GenerateFlashcardsModal`

**State Management:**
- `activePage` - Current page number (synced with URL)
- `totalPages` - PDF page count (from PDF.js)
- `fileSessionId` - Tutor session ID (stored in localStorage per file)
- `chatMessages` - Chat message array (local state)
- `renderedImageUrl` - Cached rendered page image URL
- `relatedSummary/MCQ/Flashcard` - Generation status tracking

**Key Features:**
- Page navigation (Previous/Next, page input, keyboard shortcuts)
- Page rendering priority:
  1. Rendered PNG URL (from backend)
  2. `image_url` from `page_contents` (backend-provided)
  3. PDF.js fallback (client-side rendering from `signed_url`)
- File-specific Astra chat (session per file)
- Text selection → "Ask Astra" bubble
- Quick actions bar: Generate Summary, Generate MCQ, Generate Flashcards
- Generation status polling (checks for completed summaries/MCQs/flashcards)

**Astra Chat Integration:**
- Session ID stored in `localStorage`: `synapse_file_session_${file.id}`
- Messages fetched on mount if session exists
- Chat sends `fileId` + `page` number to backend
- Backend receives page image for vision context

**API Calls:**
- `getItemById(fileId)` - Fetch file with page contents
- `sendMessageToTutor({ sessionId, message, fileId, page })` - Send chat message
- `createNewSession(title)` - Create new tutor session
- `getSessionMessages(sessionId)` - Load chat history
- `apiSummaries.getAllSummaries()` - Check for related summary
- `apiMCQ.getMCQDecks()` - Check for related MCQ
- `getFlashcardDecksByFile(fileId)` - Check for related flashcards

---

### 3.3 Tutor/Astra Module

**Route:** `/tutor`

**Components:**
- `TutorPage.jsx` - Main container
- `ChatSidebar.jsx` - Session list (left panel)
- `ChatWindow.jsx` - Chat interface (right panel)
- `MessageBubble.jsx` - Message display component

**State Management:**
- `sessions` - Array of tutor sessions
- `selectedSessionId` - Currently active session
- `messages` - Messages for selected session
- `isTyping` - Loading state for AI response
- All state is component-local

**Key Features:**
- Standalone chat interface (no file context)
- Session management (create, select, delete, rename)
- Message history loaded on session select
- Streaming responses (real-time display)
- No auto-selection of sessions (sidebar starts empty)

**API Calls:**
- `getAllSessions()` - Fetch user's sessions
- `createNewSession(title)` - Create new session
- `getSessionMessages(sessionId)` - Load messages for session
- `sendMessageToTutor({ sessionId, message })` - Send message (no fileId/page)
- `deleteSession(sessionId)` - Delete session
- `renameSession(sessionId, newTitle)` - Rename session

**Differences from FileViewer Chat:**
- FileViewer chat: file-specific, includes `fileId` + `page` in payload
- TutorPage chat: standalone, no file context

---

### 3.4 Summaries Module

**Route:** `/summaries`, `/summaries/:summaryId`

**Components:**
- `SummariesTab.jsx` - Summary list view
- `SummaryCard.jsx` - Individual summary card
- `SummaryViewer.jsx` - Summary detail view (rendered when `summaryId` in URL)
- `GenerateSummaryModal.jsx` - Generation modal
- `DemoSummaryChat.jsx` - Demo-only chat (isolated from backend)

**State Management:**
- `summaries` - Array of summaries (fetched on mount)
- `selectedSummary` - Currently viewed summary (from URL param)
- `messages` - Chat messages for summary (local state)
- `currentSessionId` - Tutor session ID for summary chat

**Key Features:**
- Summary list with cards (title, file name, created date)
- Summary viewer with structured sections
- Text highlighting → "Ask Astra" bubble
- Summary-specific Astra chat (context-aware)
- Deep linking via notification clicks

**Astra Chat Integration:**
- Selection-based: User highlights text → clicks "Ask Astra" → sends selection + summary context
- Summary-aware: Backend receives `summaryId` + `selectionText`
- Session per summary (stored in component state)

**API Calls:**
- `getAllSummaries()` - Fetch all summaries
- `getSummary(summaryId)` - Fetch single summary
- `sendSummaryMessageToTutor({ sessionId, message, summaryId, selectionText })` - Send summary chat
- `createNewSession(title)` - Create summary chat session

---

### 3.5 MCQ Module

**Route:** `/mcq`, `/mcq/:deckId`

**Components:**
- `MCQTab.jsx` - MCQ decks list
- `MCQDeckView.jsx` - MCQ exam interface
- `MCQEntryModal.jsx` - Resume/restart modal
- `GenerateMCQModal.jsx` - Generation modal

**State Management:**
- `questions` - Array of questions (fetched on deck open)
- `index` - Current question index
- `answers` - Object keyed by question ID: `{ [questionId]: { selectedLetter, isCorrect, correctLetter, ... } }`
- `progress` - Backend progress object (`status`, `last_question_index`, etc.)
- `finished` - Boolean (all questions answered)
- `reviewMode` - Boolean (reviewing completed exam)
- `elapsed` - Time spent on current question

**Progress Resumption:**
1. On deck open: Call `/ai/mcq/decks/:id/start`
2. Backend returns `progress` object:
   - `status: "in_progress" | "completed" | null`
   - `last_question_index: number` (last answered question)
3. If progress exists → show entry modal (Continue/Retake Mistakes/Restart)
4. If user continues → resume at `last_question_index + 1`
5. Load existing answers from `questions[].user_answer` (backend-provided)
6. Restore answer state: `answers[questionId] = { selectedLetter, isCorrect, ... }`

**Key Features:**
- Question-by-question navigation (Previous/Next)
- Answer selection → immediate feedback (red/green)
- "Explain All" button → expands explanations for all options
- Timer per question (tracks time spent)
- Review mode: Review all questions or only mistakes
- Optimistic UI: Answer state updated immediately, backend sync in background

**API Calls:**
- `getMCQDecks()` - Fetch all MCQ decks
- `getMCQQuestions(deckId)` - Fetch questions for deck
- `startMCQDeck(deckId)` - Initialize or get progress
- `answerMCQQuestion(deckId, questionId, optionLetter)` - Submit answer
- `resetMCQDeck(deckId)` - Reset progress
- `retakeWrongMCQ(deckId)` - Retake only wrong answers

**Answer State Structure:**
```javascript
answers[questionId] = {
  selectedText: string,
  selectedLetter: string,
  isCorrect: boolean,
  correctLetter: string,
  explanationSelected: string,
  timeSpent: number,
  explainAll: boolean
}
```

---

### 3.6 Flashcards Module

**Route:** `/flashcards`, `/flashcards/:deckId`

**Components:**
- `FlashcardsTab.jsx` - Flashcard decks list
- `DeckView.jsx` - Deck viewer (card list)
- `CardViewer.jsx` - Individual card viewer
- `ReviewScreen.jsx` - Review mode (spaced repetition)
- `GenerateFlashcardsModal.jsx` - Generation modal

**State Management:**
- `decks` - Array of flashcard decks
- `cards` - Array of cards for current deck
- `index` - Current card index
- `view` - View state: "list" | "deck" | "review"
- `deckId` - Currently selected deck ID

**Progress Resumption:**
- Flashcards do NOT have progress resumption
- Each deck is a collection of cards
- Review mode tracks card familiarity but doesn't persist across sessions
- User always starts from first card

**Key Features:**
- Deck list with cards count
- Card viewer (front/back flip)
- Review mode (spaced repetition algorithm)
- Generation status polling (3s interval while `deck.generating === true`)

**API Calls:**
- `getDecks()` - Fetch all flashcard decks
- `getDeck(deckId)` - Fetch single deck
- `getDeckCards(deckId)` - Fetch cards for deck
- `getFlashcardDecksByFile(fileId)` - Get decks for a file

---

### 3.7 Demo Tour Module

**Route:** Integrated into all routes (overlay system)

**Components:**
- `DemoContext.jsx` - Demo state provider (React Context)
- `DemoOverlay.jsx` - Overlay + script engine
- `demoScript.js` - Step definitions
- `demoApiAdapter.js` - API interception router
- `demoApiRuntime.js` - Runtime interception flag
- `demoData/` - Static demo data (files, MCQs, summaries, etc.)

**State Management:**
- `isDemo` - Boolean (demo active)
- `currentStep` - Number (current step 1-13)
- `allowedInteractions` - Object (phase: "strict" | "semi-guided")
- Completion flag: `localStorage.synapse_demo_completed`

**Entry Points:**
1. Post-onboarding: Auto-offer (skippable, never auto-repeats)
2. Manual CTA: "See how Synapse works" (dashboard)

**Exit Points:**
1. Primary CTA: "Upload your first file" → exits → navigates to `/library`
2. Backdrop click → exits → navigates to `/dashboard`
3. ESC key → exits → navigates to `/dashboard`

**Key Features:**
- Frontend-only (no backend calls, no DB writes)
- API interception: All API calls short-circuited when `isDemo === true`
- Static demo data: Files, MCQs, summaries, flashcards, notifications
- Step-based script engine: 13 steps with highlights, overlay text, scripted actions
- Interaction locking: Phase 1 (strict) vs Phase 2 (semi-guided)
- Zero residue: All demo state cleared on exit

**Demo Flow:**
1. File conversion proof (Library → FileViewer)
2. Image-only page demonstration
3. Astra vision moment (instant image explanation)
4. Quick actions (Summaries navigation)
5. Summary viewer overview
6. Highlight → Ask Astra (Summaries)
7. Flashcards overview
8. MCQ deck overview
9. MCQ question display
10. MCQ wrong answer selection
11. MCQ Explain All available
12. MCQ Explain All expanded
13. Final CTA

**API Interception:**
- Library: `getLibraryItems()`, `getItemById()`
- Tutor: `sendMessageToTutor()`, `sendSummaryMessageToTutor()`
- MCQ: `getMCQDecks()`, `getMCQQuestions()`, `startMCQDeck()`, etc.
- Summaries: `getAllSummaries()`, `getSummary()`
- Flashcards: `getDecks()`, `getDeck()`
- Notifications: `fetchNotifications()`

---

## 4. State Management Patterns

### 4.1 Component-Local State

**Pattern:** `useState` hooks in components

**Usage:**
- UI state (modals, dropdowns, inputs)
- Loading states
- Form data
- Component-specific data (e.g., `activePage` in FileViewer)

**Examples:**
- `LibraryPage`: `items`, `currentFolder`, `activeFilter`
- `FileViewer`: `activePage`, `chatMessages`, `fileSessionId`
- `MCQDeckView`: `questions`, `index`, `answers`, `progress`

### 4.2 React Context

**Pattern:** `createContext` + `Provider` + `useContext`

**Usage:**
- Demo mode state (`DemoContext`)
- No other global contexts currently

**Demo Context API:**
```javascript
const { isDemo, currentStep, nextStep, exitDemo, startDemo } = useDemo();
```

### 4.3 localStorage Persistence

**Pattern:** Direct `localStorage` access (no abstraction layer)

**Usage:**
- Auth token: `localStorage.access_token` (synced from Supabase session)
- File session IDs: `localStorage.synapse_file_session_${fileId}`
- Demo completion: `localStorage.synapse_demo_completed`

**No Persistence For:**
- MCQ progress (backend-only)
- Flashcard review state (ephemeral)
- Chat messages (backend-only)
- UI preferences (not implemented)

### 4.4 Server-Driven State

**Pattern:** Fetch on mount, poll for updates

**Usage:**
- Library items (polled while processing)
- Generation status (polled while generating)
- Notifications (polled every 30s)
- MCQ progress (fetched on deck open)

**No Optimistic Updates For:**
- File uploads (wait for backend confirmation)
- Generation requests (wait for backend job creation)
- MCQ answers (optimistic UI, but backend sync required)

---

## 5. User Flows

### 5.1 Authentication & Onboarding

**Flow:**
1. Landing page → User clicks "Sign Up" or "Log In"
2. Sign up → Email/password → OTP verification → Profile creation
3. Log in → Email/password → Session established
4. Profile check → If missing `field_of_study` or `stage` → Onboarding
5. Onboarding → Multi-step form:
   - Account type (student/professional)
   - Country
   - University
   - Year of study or specialty
   - Primary goals (multi-select)
   - Resource preferences
6. Profile saved → Main app access granted

**State-Driven (Not Routes):**
- Landing, Sign Up, Log In, Onboarding use component state
- Only `/auth/callback` is a route (OAuth redirects)

### 5.2 File Upload & Viewing

**Flow:**
1. User navigates to `/library`
2. Clicks "Upload" → `LibraryUploadModal` opens
3. Selects file + folder → Upload starts
4. File appears in library immediately (optimistic)
5. File processing happens in background (polling every 30s)
6. User clicks file card → `FileViewer` opens
7. FileViewer loads file data + page contents
8. User navigates pages → URL updates: `/library/:fileId/page/:pageNumber`
9. User can chat with Astra (file-specific session)
10. User can generate Summary/MCQ/Flashcards (modals)

**Key Behaviors:**
- Files accessible immediately after upload (no blocking)
- Page rendering: Backend PNG → `image_url` → PDF.js fallback
- Chat session persists per file (localStorage)
- Generation status polled until complete

### 5.3 Astra Chat (File Context)

**Flow:**
1. User opens file in FileViewer
2. Chat sidebar appears on right
3. First message → New session created → Session ID stored in localStorage
4. Subsequent messages → Existing session used
5. Messages include `fileId` + `page` number
6. Backend receives page image for vision context
7. User can select text → "Ask Astra" bubble appears
8. Selection sent with file context

**Session Management:**
- One session per file: `synapse_file_session_${file.id}`
- Session persists across page refreshes
- Messages loaded on FileViewer mount if session exists

### 5.4 Astra Chat (Summary Context)

**Flow:**
1. User navigates to `/summaries/:summaryId`
2. SummaryViewer renders summary content
3. User highlights text → "Ask Astra" bubble appears
4. User clicks "Ask Astra" → Selection sent with `summaryId`
5. Backend receives summary context + selection
6. Response displayed in chat sidebar

**Session Management:**
- One session per summary (component state, not persisted)
- Session created on first message
- Messages loaded on SummaryViewer mount if session exists

### 5.5 MCQ Exam Flow

**Flow:**
1. User navigates to `/mcq` → Sees deck list
2. User clicks deck → Navigates to `/mcq/:deckId`
3. `MCQDeckView` calls `/start` → Gets progress
4. If progress exists → Entry modal (Continue/Retake Mistakes/Restart)
5. If no progress → Load questions, start at question 0
6. User answers question → Answer state updated immediately (optimistic)
7. Backend sync happens in background
8. User clicks "Next" → Advance to next question
9. On last question → "Next" → Results screen
10. User can review all questions or only mistakes

**Progress Resumption:**
- Backend tracks `last_question_index`
- Frontend resumes at `last_question_index + 1`
- Existing answers loaded from `questions[].user_answer`
- Answer state restored: `answers[questionId] = { selectedLetter, isCorrect, ... }`

### 5.6 Generation Flow (Summary/MCQ/Flashcards)

**Flow:**
1. User opens file in FileViewer
2. Clicks "Generate Summary" (or MCQ/Flashcards)
3. Modal opens → User selects options → Submits
4. Backend job created → Modal closes
5. Frontend polls for status:
   - Summary: Polls `getAllSummaries()` until summary appears
   - MCQ: Polls `getMCQDecks()` until deck appears
   - Flashcards: Polls `getDeck(deckId)` until `generating === false`
6. When complete → Notification appears
7. User clicks notification → Navigates to generated content

**Polling Intervals:**
- Summaries: Polled on FileViewer mount + when generation button clicked
- MCQs: Polled on FileViewer mount + when generation button clicked
- Flashcards: Polled every 3s while `deck.generating === true`

---

## 6. API Communication

### 6.1 API Client Pattern

**Base URL:** `import.meta.env.VITE_API_URL`

**Authentication:**
- Token retrieved from `localStorage.access_token` (synced from Supabase)
- Token included in `Authorization: Bearer ${token}` header
- Token refreshed automatically by Supabase client

**API Modules:**
- `apiLibrary.js` - Library operations
- `apiTutor.js` - Tutor/Astra chat
- `apiMCQ.js` - MCQ operations
- `apiSummaries.js` - Summary operations
- `apiFlashcards.js` - Flashcard operations
- `settings.api.js` - Settings operations

**Error Handling:**
- Network errors logged to console
- User-facing errors shown in UI (toast/alert patterns)
- No global error boundary for API calls (component-level handling)

### 6.2 Demo Mode Interception

**Pattern:** API calls check `isDemo` flag before executing

**Implementation:**
- `demoApiIntercept({ method, url, body })` called at start of API functions
- If `isDemo === true` → Returns static demo data
- If `isDemo === false` → Proceeds with real API call

**Intercepted Endpoints:**
- `GET /library` → Demo file list
- `GET /library/:id` → Demo file with pages
- `POST /ai/tutor/chat` → Canned Astra response
- `GET /ai/mcq/decks` → Demo MCQ deck
- `GET /ai/summaries` → Demo summary
- `GET /flashcards/decks` → Demo flashcard deck
- `GET /notifications` → Demo notification

**Zero Backend Calls:**
- When `isDemo === true`, no `fetch` calls are made
- All data comes from static `demoData/` files
- Network tab shows zero requests during demo

---

## 7. Progress Resumption

### 7.1 MCQ Progress

**Backend-Driven:**
- Progress stored in backend (`mcq_progress` table)
- Frontend fetches progress on deck open: `/ai/mcq/decks/:id/start`
- Progress object: `{ status, last_question_index, ... }`

**Resumption Logic:**
1. Call `/start` → Get progress
2. If `status === "in_progress"` → Show entry modal
3. User clicks "Continue" → Resume at `last_question_index + 1`
4. Load existing answers from `questions[].user_answer`
5. Restore answer state: `answers[questionId] = { ... }`

**No Local Persistence:**
- Progress NOT stored in localStorage
- Progress NOT stored in component state across refreshes
- Always fetched from backend on deck open

### 7.2 Flashcard Progress

**No Progress Resumption:**
- Flashcards do NOT have progress tracking
- Each deck is a collection of cards
- User always starts from first card
- Review mode tracks familiarity but doesn't persist

### 7.3 File Processing Progress

**Polling-Based:**
- Files polled every 30s while processing
- Terminal states: `render_state.status === "completed"` AND `ocr_status === "completed"`
- Polling stops when both are "completed"

**No Resume:**
- File processing is backend job
- Frontend only polls for completion
- No "resume" concept (job runs to completion)

---

## 8. Stable vs Evolving

### 8.1 Stable (Production-Ready)

**Core Modules:**
- ✅ Library (file upload, viewing, management)
- ✅ FileViewer (page rendering, chat, generation)
- ✅ Tutor/Astra (standalone chat, file context chat, summary context chat)
- ✅ Summaries (list, viewer, generation)
- ✅ MCQs (list, exam, progress resumption)
- ✅ Flashcards (list, viewer, review mode)
- ✅ Demo Tour (13-step interactive demo)
- ✅ Onboarding (multi-step profile collection)
- ✅ Notifications (polling, deep linking)

**Architecture:**
- ✅ Routing structure (React Router)
- ✅ State management patterns (component-local + Context)
- ✅ API communication (RESTful + Supabase)
- ✅ Authentication flow (Supabase Auth)

### 8.2 Evolving (In Development)

**Placeholder Modules:**
- ⚠️ OSCE (`/osce` - "Coming Soon")
- ⚠️ Oral Exam (`/oral` - "In Development")
- ⚠️ Planner (`/planner` - "Coming Soon")
- ⚠️ Analytics (`/analytics` - "Coming Soon")

**Features:**
- ⚠️ Settings page (basic structure, limited functionality)
- ⚠️ Dashboard (recent activity, stats preview - basic implementation)

**Not Included:**
- ❌ Image crop features
- ❌ Future tutor redesigns
- ❌ Oral exam UI (only placeholder exists)

---

## 9. Key UX Assumptions

### 9.1 Navigation

- Users navigate primarily via sidebar icons
- Deep linking used for notifications and sharing
- Browser back/forward works for route-based navigation
- FileViewer page navigation updates URL (refresh-safe)

### 9.2 State Persistence

- Auth sessions persist across refreshes (Supabase)
- File chat sessions persist (localStorage)
- MCQ progress persists (backend)
- No UI preferences persistence (not implemented)

### 9.3 Performance

- Files accessible immediately after upload (optimistic)
- Page rendering: Backend PNG preferred, PDF.js fallback
- Generation jobs run in background (non-blocking)
- Polling intervals: 30s (files), 3s (flashcards), on-demand (summaries/MCQs)

### 9.4 Error Handling

- Network errors logged to console
- User-facing errors shown in modals/alerts
- No global error boundary (component-level)
- API errors don't crash app (graceful degradation)

---

## 10. Integration Points

### 10.1 Backend API

**Base URL:** `VITE_API_URL` environment variable

**Endpoints:**
- `/library/*` - File operations
- `/ai/tutor/*` - Tutor/Astra chat
- `/ai/mcq/*` - MCQ operations
- `/ai/summaries/*` - Summary operations
- `/flashcards/*` - Flashcard operations

**Authentication:**
- Supabase token in `Authorization` header
- Token refreshed automatically

### 10.2 Supabase

**Services Used:**
- Auth (email/password, OAuth)
- Database (profiles, notifications)
- Storage (file uploads, signed URLs)

**Client:**
- `src/lib/supabaseClient.js` - Singleton client instance

### 10.3 Demo Mode

**Isolation:**
- Frontend-only (no backend integration)
- API interception layer
- Static demo data
- Zero residue on exit

**Integration:**
- `DemoProvider` wraps entire app
- `DemoOverlay` renders on all routes when active
- API modules check `isDemo` flag

---

## Conclusion

This document provides a factual snapshot of the Synapse frontend architecture as it exists in production. The application is a React-based SPA with component-local state management, React Router for navigation, and Supabase for authentication and data storage. Core modules (Library, FileViewer, Tutor, MCQs, Flashcards, Summaries) are stable and production-ready, while some modules (OSCE, Oral Exam, Planner, Analytics) are placeholders for future development.

The frontend communicates with backend services via RESTful APIs, handles progress resumption for MCQs, and provides an interactive demo tour system that operates entirely in the frontend without backend integration.
