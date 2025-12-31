# Synapse Frontend Blueprint
**Official Code-Accurate Documentation**  
**Version:** 1.0  
**Date:** January 2026  
**Status:** Pre-Launch Freeze

---

## EXECUTIVE SUMMARY

The Synapse frontend is a React-based Single Page Application (SPA) built with Vite, React Router, and Tailwind CSS. It provides a medical education platform with file management, AI tutoring (Astra), and content generation tools (MCQs, Flashcards, Summaries).

**Architecture:** Client-side routing, state-driven navigation for auth, component-based UI, direct API integration (no state management library).

**Key Technologies:**
- React 19.2.0
- React Router DOM 7.11.0
- Vite 7.2.4
- Tailwind CSS 3.4.10
- Supabase Auth (client-side)
- PDF.js for PDF rendering
- react-pdf for PDF display

---

## PHASE 1 — APPLICATION STRUCTURE

### 1.1 Entry Point

**File:** `src/main.jsx`

**Structure:**
- Wraps app in `<BrowserRouter>` (React Router)
- Configures PDF.js worker (CDN)
- Renders `<App />` component

**Key Setup:**
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

**No global state management library** (Redux, Zustand, etc.)

---

### 1.2 Global State Management

**Pattern:** Local component state + React Context (implicit via component tree)

**Auth State:**
- Managed in `App.jsx` (`SynapseOS` component)
- State variables:
  - `isAuthenticated` (boolean)
  - `authScreen` ("landing" | "login" | "signup" | "onboarding" | null)
  - `profile` (user profile object from Supabase)
  - `tempUserData` (temporary user metadata during login flow)

**Session Management:**
- Supabase auth session stored in `localStorage`
- Access token synced to `localStorage.getItem("access_token")`
- Token retrieved via `supabase.auth.getSession()`

**Notifications State:**
- Managed in `App.jsx`
- Fetched from `/notifications` endpoint
- Normalized from snake_case to camelCase

**No global state store** — all state is component-local or passed via props

---

### 1.3 Authentication Flow

**Hybrid Approach:** State-driven navigation (not React Router routes)

**Auth Screens (State-Driven):**
- `authScreen === "landing"` → `<LandingPage />`
- `authScreen === "signup"` → `<SignUp />`
- `authScreen === "login"` → `<Login />`
- `authScreen === "onboarding"` → `<OnboardingFlow />`
- `isAuthenticated === false` → Shows auth screens
- `isAuthenticated === true` → Shows main app

**Auth Callback Route (React Router):**
- `/auth/callback` → `<AuthCallback />` (handles OAuth redirects)

**Session Sync:**
- `useEffect` in `App.jsx` listens to `supabase.auth.onAuthStateChange`
- On session change: updates `isAuthenticated`, fetches profile, syncs token

**Profile Check:**
- If profile missing `field_of_study` or `stage` → redirects to onboarding
- Otherwise → shows main app

---

### 1.4 Screen Navigation

**Main App (React Router):**
- Routes defined in `App.jsx` (lines 554-609)
- All routes require authentication (guarded by `isAuthenticated` check)

**Auth Flow (State-Driven):**
- No React Router routes for signup/login
- Navigation via `setAuthScreen()` state updates

**URL Structure:**
- `/` → redirects to `/tutor`
- `/library` → Library page
- `/library/:fileId` → FileViewer (file detail)
- `/library/:fileId/page/:pageNumber` → FileViewer (specific page)
- `/tutor` → Tutor (Astra chat)
- `/flashcards` → Flashcards module
- `/mcq` → MCQ module
- `/summaries` → Summaries module
- `/osce`, `/oral`, `/planner`, `/analytics` → Placeholder modules
- `/settings` → Settings page
- `*` → catch-all redirects to `/tutor`

**Deep Linking:**
- Library file viewer supports deep links via URL params
- Refresh-safe (Vercel rewrite rule configured in `vercel.json`)

---

## PHASE 2 — ROUTE & SCREEN MAP

### 2.1 Authentication Screens

#### Landing Page
- **File:** `src/components/LandingPage.jsx`
- **Route:** State-driven (`authScreen === "landing"`)
- **Purpose:** Marketing/landing page with hero, features, CTA
- **Dependencies:** None (static content)
- **Navigation:** Buttons trigger `onLogin()` / `onSignup()` callbacks

#### Sign Up
- **File:** `src/components/auth/SignUp.jsx`
- **Route:** State-driven (`authScreen === "signup"`)
- **Purpose:** User registration form
- **Flow:**
  1. User enters: full name, email, password, confirm password
  2. Submits → `POST /auth/signup`
  3. On success → `POST /auth/request-otp`
  4. Shows `<VerifyOtp />` component
- **Legal Acceptance:** Passive text with clickable Terms/Privacy links (opens modal)
- **Dependencies:** `LegalModal`, `VerifyOtp`, `AppLogo`

#### Login
- **File:** `src/components/auth/Login.jsx`
- **Route:** State-driven (`authScreen === "login"`)
- **Purpose:** User login form
- **Flow:**
  1. User enters: email, password
  2. Submits → `supabase.auth.signInWithPassword()`
  3. On success → calls `onSuccess()` with user metadata
  4. Parent (`App.jsx`) calls `fetchProfile()`
- **Dependencies:** Supabase client, `AppLogo`

#### Verify OTP
- **File:** `src/components/auth/VerifyOtp.jsx`
- **Route:** State-driven (shown after signup)
- **Purpose:** Email verification via 6-digit OTP code
- **Flow:**
  1. User enters 6-digit code
  2. Submits → `POST /auth/verify-otp`
  3. On success → `POST /auth/login` (auto-login)
  4. Saves token to `localStorage`
  5. Calls `onVerified()` → triggers profile fetch
- **Legal Acceptance:** Same passive text as SignUp
- **Dependencies:** `LegalModal`, `AppLogo`

#### Onboarding Flow
- **File:** `src/components/onboarding/OnboardingFlow.jsx`
- **Route:** State-driven (`authScreen === "onboarding"`)
- **Purpose:** Collect user profile data (field of study, country, university, year, goals, resources)
- **Steps:**
  1. Account Type
  2. Country
  3. University
  4. Year/Specialty
  5. Primary Goal
  6. Resource Preferences
  7. Complete
- **Submission:** `POST /onboarding` with profile data
- **Dependencies:** Supabase auth (for user ID), multiple step components

#### Auth Callback
- **File:** `src/components/auth/AuthCallback.jsx`
- **Route:** React Router (`/auth/callback`)
- **Purpose:** Handles OAuth redirects (if implemented)
- **Dependencies:** Supabase auth

---

### 2.2 Main Application Screens

#### Library Page
- **File:** `src/modules/Library/LibraryPage.jsx`
- **Route:** `/library`, `/library/:fileId`, `/library/:fileId/page/:pageNumber`
- **Purpose:** File/folder management, viewing, organization
- **Features:**
  - Grid/list view of files and folders
  - Category filters (All, Lecture, Notes, Exams, Book)
  - Upload modal
  - Create folder modal
  - File actions: rename, delete, move, change category
  - Conditional polling (only when files are processing)
  - Breadcrumb navigation
- **State:**
  - `items` (files/folders array)
  - `activeFilter` (category filter)
  - `currentFolder` (active folder context)
  - `breadcrumbs` (navigation path)
- **Dependencies:** `apiLibrary.js`, multiple modal components, `FileViewer`

#### File Viewer
- **File:** `src/modules/Library/FileViewer.jsx`
- **Route:** `/library/:fileId` or `/library/:fileId/page/:pageNumber`
- **Purpose:** Display PDF pages as PNG images + Astra chat sidebar + generation tools
- **Features:**
  - Page navigation (prev/next, jump to page)
  - PNG rendering (from backend `/library/render/:fileId/:page`)
  - PDF.js fallback (if PNG missing)
  - Astra chat sidebar (file + page context)
  - Generation modals (Summaries, MCQs, Flashcards)
  - Page-aware context passing to Astra
- **State:**
  - `activePage` (current page number, synced with URL)
  - `chatMessages` (Astra conversation)
  - `fileSessionId` (Astra session for this file)
  - `renderedImageUrl` (current page PNG)
- **Dependencies:** `apiLibrary.js`, `apiTutor.js`, `PdfJsPage`, generation modals

#### Tutor (Astra Chat)
- **File:** `src/modules/Tutor/TutorPage.jsx`
- **Route:** `/tutor`
- **Purpose:** Standalone AI tutor chat interface
- **Features:**
  - Session sidebar (list, create, delete, rename)
  - Chat window (message history, typing animation)
  - File upload (not fully implemented — `uploadFile` is dummy)
  - No file/page context (global chat)
- **State:**
  - `sessions` (chat sessions array)
  - `activeSessionId` (selected session)
- **Dependencies:** `apiTutor.js`, `ChatSidebar`, `ChatWindow`

#### Summaries
- **File:** `src/modules/summaries/SummariesTab.jsx`
- **Route:** `/summaries`
- **Purpose:** AI-generated summary management
- **Features:**
  - List view (grid of summary cards)
  - Search and sort
  - Generate modal (file selection, academic stage, goal)
  - Summary viewer (full content, "Ask Astra" from selection)
  - Polling for generating summaries (4s interval)
  - Import code UI (not fully functional)
- **State:**
  - `summaries` (array of summaries)
  - `view` ("list" | "viewer")
  - `summaryId` (selected summary)
- **Dependencies:** `apiSummaries.js`, `GenerateSummaryModal`, `SummaryViewer`, `SummaryCard`

#### MCQ
- **File:** `src/modules/mcq/MCQTab.jsx`
- **Route:** `/mcq`
- **Purpose:** Multiple-choice question deck management
- **Features:**
  - Deck list (search, sort)
  - Generate modal (file selection, difficulty, question count)
  - Deck view (question list)
  - MCQ player (question/answer interface)
  - Polling for generating decks (4s interval)
- **State:**
  - `decks` (MCQ deck array)
  - `view` ("list" | "deck" | "player")
  - `deckId` (selected deck)
- **Dependencies:** `apiMCQ.js`, `GenerateMCQModal`, `MCQDeckView`, `MCQPlayer`

#### Flashcards
- **File:** `src/modules/flashcards/FlashcardsTab.jsx` (wrapper)
- **Route:** `/flashcards`
- **Purpose:** Flashcard deck management and review
- **Features:**
  - Deck list (search, sort)
  - Generate modal (file selection, card count)
  - Deck view (card list)
  - Review screen (spaced repetition interface)
  - Import deck UI (not fully functional)
- **State:**
  - Managed in `FlashcardsModule` wrapper (`App.jsx`)
  - `view` ("list" | "deck" | "review")
  - `deckId` (selected deck)
- **Dependencies:** `apiFlashcards.js`, `GenerateFlashcardsModal`, `DeckView`, `ReviewScreen`

#### Settings
- **File:** `src/modules/settings/SettingsPage.jsx`
- **Route:** `/settings`
- **Purpose:** User settings, announcements, and feedback
- **Features:**
  - Announcements panel (fetches from backend, displays title/body/date)
  - Feedback box (sends feedback to backend, logs to console in v1)
  - Account summary (displays name, email, stage - read-only)
  - Logout button (signs out via Supabase, clears token)
- **Dependencies:** Profile data from `App.jsx`, `settings.api.js`

#### Placeholder Modules
- **Files:** Defined inline in `App.jsx` (lines 47-61)
- **Routes:** `/osce`, `/oral`, `/planner`, `/analytics`
- **Purpose:** Show "Coming Soon" placeholder
- **Implementation:** `<Placeholder label="..." />` component

---

### 2.3 Modals and Overlays

#### Legal Modal
- **File:** `src/components/LegalModal.jsx`
- **Purpose:** Display Terms & Conditions or Privacy Policy
- **Usage:** Opened from SignUp/VerifyOtp acceptance text
- **Features:** Scrollable content, ESC to close, click-outside to close
- **Dependencies:** `TermsContent.jsx`, `PrivacyContent.jsx`

#### Library Modals
- **Upload:** `LibraryUploadModal.jsx` — File upload with compression
- **Create Folder:** `CreateFolderModal.jsx` — Folder creation with color picker
- **Rename:** `RenameModal.jsx` — Item rename
- **Move:** `MoveToFolderModal.jsx` — Move item to folder
- **Change Category:** `ChangeCategoryModal.jsx` — Change file category

#### Generation Modals
- **Generate Summary:** `GenerateSummaryModal.jsx` — File selection, academic stage, goal
- **Generate MCQ:** `GenerateMCQModal.jsx` — File selection, difficulty, question count
- **Generate Flashcards:** `GenerateFlashcardsModal.jsx` — File selection, card count

#### Other Modals
- **Popup Dialog:** `PopupDialog.jsx` — Generic confirmation dialog (used in Flashcards)

---

## PHASE 3 — CORE FEATURE BREAKDOWN

### 3.1 Library UI

#### Upload Flow
- **Component:** `LibraryUploadModal.jsx`
- **Process:**
  1. User selects file(s)
  2. Frontend compresses PDFs (if > 5MB) via `compressPdf.js`
  3. Uploads to backend via `POST /library/upload`
  4. Backend returns file metadata
  5. Modal closes, library refreshes
- **Error Handling:**
  - File size limits (handled by backend, frontend shows error)
  - Unsupported file types (backend validation)
  - Compression failures (fallback to original)
- **Dependencies:** `apiLibrary.js`, `fileCompression.js`

#### File/Folder Display
- **Component:** `LibraryGrid.jsx` (renders `LibraryCard.jsx`)
- **Layout:** Grid of cards (responsive)
- **Card Content:**
  - Icon (folder vs file type)
  - Title
  - Category badge (Lecture, Notes, Exams, Book)
  - Date (updated_at)
  - Actions menu (rename, delete, move, change category)
- **Filtering:** Category filter (`LibraryFilters.jsx`)
- **No "Processing" indicator** (removed per requirements)

#### Status Indicators
- **Removed:** "Processing / Ready" badge (per requirements)
- **Backend State:** `render_state` exists but not displayed in UI
- **File Readiness:** Used internally for generation gating (`fileReadiness.js`)

#### Error Handling
- **Upload Errors:** Mapped via `uploadErrorMessages.js`
- **API Errors:** Caught in try/catch, shown via `alert()` or console.error
- **No global error boundary** (errors bubble to console)

---

### 3.2 File Viewer

#### Page Rendering
- **Primary:** PNG images from backend (`/library/render/:fileId/:page`)
- **Fallback:** PDF.js rendering (if PNG missing or fails)
- **Component:** `PdfJsPage.jsx` (PDF.js wrapper)
- **Caching:** `pdfCache.js` (in-memory PDF document cache)

#### Page Awareness
- **URL Sync:** `activePage` synced with `/library/:fileId/page/:pageNumber`
- **Navigation:** Prev/next buttons, page input, URL updates
- **State:** `activePage` (number), `totalPages` (from PDF.js or backend)

#### Context Passed to Astra
- **File ID:** `fileId` (UUID string)
- **Page Number:** `page` (positive integer)
- **Image:** `pageImageForTutor` (base64 or URL) — **NOT IMPLEMENTED** (code references it but doesn't set it)
- **Payload:** `{ fileId, page, message, sessionId, resourceSelection }`
- **Endpoint:** `POST /ai/tutor/chat`

#### Performance Considerations
- **PNG Caching:** `renderedImageUrlsRef` (Map of `${fileId}:${page}` → URL)
- **Render Attempt Tracking:** `renderAttemptedRef` (Set to prevent duplicate renders)
- **Image Load Failure Tracking:** `imageLoadFailedRef` (Set to skip failed pages)
- **PDF Document Caching:** `getPdfDoc()` caches PDF.js document objects

---

### 3.3 Astra Chat UI

#### Message Structure
- **Format:** `{ id, role: "user" | "assistant", content: string, createdAt: ISO string }`
- **Storage:** Backend (`/ai/tutor/sessions/:id/messages`)
- **Loading:** `getSessionMessages()` fetches on session select

#### Context Injection
- **FileViewer Context:**
  - `fileId` (required)
  - `page` (required)
  - `resourceSelection` (optional, defaults to "all")
- **Summary Context:**
  - `summaryId` (required)
  - `selectionText` (optional, for "Ask Astra" from selection)
  - `structuredPayload` (includes `role`, `type`, `source`, `createdAt`)
- **Standalone Tutor:** No file/page context (global chat)

#### Streaming Behavior
- **NOT STREAMING:** Backend returns complete response
- **Typing Animation:** Frontend simulates typing via `typeAssistantMessage()` (15ms per character)
- **Fallback:** `checkForResponseInDB()` polls DB if response missing (max 2 retries)

#### Limitations
- **File Upload:** `uploadFile()` is dummy function (returns null, logs warning)
- **Image Context:** `pageImageForTutor` not set in FileViewer (code references it but doesn't populate)
- **Error Handling:** Backend errors shown via `alert()` (no graceful degradation)

---

### 3.4 Generators UI

#### Common Pattern
All generators (MCQ, Flashcards, Summaries) follow similar pattern:
1. **Modal:** File selection + generation parameters
2. **Submission:** `POST /ai/{resource}/generate`
3. **Response:** Returns `{ jobId, ... }`
4. **Placeholder:** Frontend adds "generating" placeholder to list
5. **Polling:** Frontend polls job status every 4s
6. **Completion:** Replaces placeholder with completed resource

#### MCQ Generation
- **Modal:** `GenerateMCQModal.jsx`
- **Parameters:** File(s), difficulty, question count
- **Endpoint:** `POST /ai/mcq/generate`
- **Polling:** `GET /ai/mcq/job/:jobId`
- **Output:** MCQ deck (questions + answers)

#### Flashcards Generation
- **Modal:** `GenerateFlashcardsModal.jsx`
- **Parameters:** File(s), card count
- **Endpoint:** `POST /flashcards/decks` (creates deck directly, no separate job endpoint)
- **Polling:** No generation polling - deck created synchronously (returns deck immediately)
- **Deck List Polling:** `DeckList.jsx` polls deck list every 4s (for updates, not generation status)
- **Output:** Flashcard deck (front/back pairs)
- **Note:** Unlike MCQ/Summaries, flashcards generation is synchronous (no job polling pattern). Deck list refreshes via interval polling.

#### Summaries Generation
- **Modal:** `GenerateSummaryModal.jsx`
- **Parameters:** File, academic stage, goal
- **Endpoint:** `POST /ai/summaries/generate`
- **Polling:** `GET /ai/summaries/job/:jobId`
- **Output:** Summary (structured sections)

#### Processing UI
- **Generating Placeholder:** Shows in list with "Generating..." text
- **Polling:** 4-second intervals (MCQ, Summaries)
- **Completion:** Placeholder replaced with fetched resource
- **Failure:** Placeholder removed, error shown

#### File Readiness Gating
- **Check:** `isFileReady(file)` (checks `ingestion_status === "ready"`)
- **UI:** Generate button disabled if file not ready
- **Progress:** Shows "Preparing slides (X / Y)" if rendering
- **Polling:** `useFileReadiness()` hook polls file metadata every 4s

---

### 3.5 Legal UX

#### Terms & Privacy Acceptance
- **Location:** SignUp.jsx (line 179-197), VerifyOtp.jsx (line 160-178)
- **Text:** "By signing up, you agree to our Terms and Privacy Policy"
- **Links:** Clickable "Terms" and "Privacy Policy" buttons
- **Behavior:** Opens `LegalModal` (no navigation)

#### Modal Implementation
- **Component:** `LegalModal.jsx`
- **Content:** `TermsContent.jsx`, `PrivacyContent.jsx` (placeholder text)
- **Features:** Scrollable, ESC to close, click-outside to close
- **No Enforcement:** Passive acceptance (no checkbox, no blocking)

---

## PHASE 4 — STATE & DATA FLOW

### 4.1 Local vs Shared State

#### Local State (Component-Level)
- **Library:** `items`, `activeFilter`, `currentFolder` (LibraryPage)
- **FileViewer:** `activePage`, `chatMessages`, `fileSessionId` (FileViewer)
- **Tutor:** `sessions`, `activeSessionId` (TutorPage)
- **Summaries:** `summaries`, `view`, `summaryId` (SummariesTab)
- **MCQ:** `decks`, `view`, `deckId` (MCQTab)
- **Flashcards:** `decks`, `view`, `deckId` (FlashcardsModule)

#### Shared State (App-Level)
- **Auth:** `isAuthenticated`, `authScreen`, `profile` (App.jsx)
- **Notifications:** `notifications` (App.jsx)

#### No Global Store
- No Redux, Zustand, or Context API for shared state
- State passed via props or managed in parent components

---

### 4.2 API Interaction Patterns

#### Authentication
- **Supabase:** `supabase.auth.signInWithPassword()`, `supabase.auth.getSession()`
- **Custom Endpoints:** `POST /auth/signup`, `POST /auth/verify-otp`, `POST /auth/login`
- **Token Storage:** `localStorage.getItem("access_token")`

#### API Calls
- **Pattern:** Direct `fetch()` calls with auth headers
- **Base URL:** `import.meta.env.VITE_API_URL`
- **Headers:** `Authorization: Bearer ${token}`
- **Error Handling:** Try/catch, `alert()` or console.error

#### API Modules
- **Library:** `apiLibrary.js` — file/folder CRUD
- **Tutor:** `apiTutor.js` — sessions, messages
- **Summaries:** `apiSummaries.js` — summary CRUD, generation
- **MCQ:** `apiMCQ.js` — deck CRUD, generation
- **Flashcards:** `apiFlashcards.js` — deck CRUD, generation

---

### 4.3 Error States & Retries

#### Error Handling
- **Pattern:** Try/catch blocks, error messages via `alert()`
- **No Global Error Boundary:** Errors bubble to console
- **API Errors:** Parsed from response JSON, shown to user

#### Retries
- **File Polling:** Automatic (4s interval until ready)
- **Generation Polling:** Automatic (4s interval until complete)
- **Astra Response:** Fallback DB check (max 2 retries)
- **No Exponential Backoff:** Fixed intervals

---

### 4.4 Loading & Disabled States

#### Loading States
- **Pattern:** `isLoading` boolean state
- **UI:** Spinner or "Loading..." text
- **No Skeleton Loaders:** Simple text/spinner

#### Disabled States
- **Generate Buttons:** Disabled if file not ready
- **Form Buttons:** Disabled during submission
- **Generating Resources:** Cards not clickable (disabled state)

---

## PHASE 5 — FRONTEND BLUEPRINT OUTPUT

### 5.1 Frontend System Overview

**What the Frontend DOES Today:**

1. **Authentication & Onboarding**
   - Email/password signup with OTP verification
   - Login via Supabase
   - Multi-step onboarding flow
   - Session persistence

2. **File Management**
   - Upload files (PDF, PPT, images)
   - Organize into folders
   - Category tagging (Lecture, Notes, Exams, Book)
   - View files as PNG images or PDF.js fallback
   - File actions (rename, delete, move, change category)

3. **AI Tutoring (Astra)**
   - Standalone chat interface (sessions)
   - File + page-aware chat (from FileViewer)
   - Summary-aware chat (from SummaryViewer)
   - Message history persistence
   - Typing animation (simulated)

4. **Content Generation**
   - Generate summaries (from files)
   - Generate MCQ decks (from files)
   - Generate flashcard decks (from files)
   - Polling for generation completion
   - View generated content

5. **Content Viewing**
   - Summary viewer (structured sections, "Ask Astra" from selection)
   - MCQ player (question/answer interface)
   - Flashcard review (spaced repetition UI)

6. **Notifications**
   - Bell icon in header
   - Dropdown with notification list
   - "Clear all" functionality
   - Relative time formatting

7. **Legal Compliance**
   - Terms & Privacy modal (passive acceptance)

**What the Frontend DOES NOT Do:**
- No file editing
- No collaborative features
- No real-time updates (polling only)
- No offline support
- No PWA features
- No file sharing
- No export functionality (except summary import codes — UI only)

---

### 5.2 User Flows (End-to-End)

#### Flow 1: New User Signup → Dashboard
1. **Landing Page:** User clicks "Sign Up"
2. **Sign Up:** Enters name, email, password → submits
3. **OTP Verification:** Enters 6-digit code → verifies
4. **Auto-Login:** Token saved, profile fetched
5. **Onboarding:** If profile incomplete → multi-step form
6. **Dashboard:** Redirected to `/tutor` (default route)

#### Flow 2: Upload → View File → Ask Astra → Generate MCQs
1. **Library:** User clicks "Upload" → selects file → uploads
2. **File Processing:** Frontend polls until `ingestion_status === "ready"`
3. **File Viewer:** User clicks file → opens `/library/:fileId`
4. **Page Navigation:** User navigates to specific page
5. **Astra Chat:** User asks question → Astra responds with page context
6. **Generate MCQ:** User clicks "Generate MCQ" → selects parameters → submits
7. **Polling:** Frontend polls job status → shows completed deck

#### Flow 3: Exam Prep Flow
1. **Library:** User uploads lecture slides
2. **Generate Summary:** User generates summary from file
3. **View Summary:** User reads summary sections
4. **Ask Astra:** User selects text → "Ask Astra" → gets explanation
5. **Generate Flashcards:** User generates flashcards from same file
6. **Review:** User reviews flashcards in spaced repetition interface
7. **Generate MCQ:** User generates MCQ deck for practice

---

### 5.3 What Is Production-Ready

#### Fully Implemented & Stable:
1. **Authentication Flow**
   - Signup, login, OTP verification
   - Session persistence
   - Profile fetching

2. **File Upload & Management**
   - Upload with compression
   - Folder creation
   - File actions (rename, delete, move, category)
   - Category filtering

3. **File Viewer**
   - PNG rendering (primary)
   - PDF.js fallback
   - Page navigation
   - URL deep linking

4. **Astra Chat (Standalone)**
   - Session management
   - Message history
   - Typing animation

5. **Summaries**
   - Generation flow
   - List view
   - Summary viewer
   - "Ask Astra" from selection

6. **MCQ**
   - Generation flow
   - Deck view
   - Question player

7. **Flashcards**
   - Generation flow
   - Deck view
   - Review interface

8. **Notifications**
   - Fetch from backend
   - Display in dropdown
   - Clear all functionality

9. **Legal Modal**
   - Terms/Privacy display
   - Modal interactions

---

### 5.4 What Is Beta / Fragile

#### Works But Relies on Assumptions:
1. **File Processing Status**
   - Frontend assumes `render_state` always exists in API responses
   - Falls back to "Processing" if missing (logs error)
   - Terminal state detection relies on exact string matches

2. **Generation Polling**
   - Fixed 4s intervals (no exponential backoff)
   - No timeout (could poll indefinitely if backend fails)
   - Placeholder deduplication logic (could create duplicates)

3. **Astra Chat (FileViewer)**
   - `pageImageForTutor` referenced but never set (image context missing)
   - Hard assertion: `fileId` and `page` required (throws error if missing)
   - No graceful degradation if backend returns error

4. **File Readiness Gating**
   - Polling every 4s (could be aggressive for large files)
   - No timeout (could poll indefinitely)
   - UI shows "Preparing slides (X / Y)" but doesn't handle partial failures

5. **Library Polling**
   - Conditional polling (only when files processing)
   - Uses refs to prevent infinite loops (complex logic)
   - Could miss updates if refs get out of sync

6. **Error Handling**
   - Most errors shown via `alert()` (poor UX)
   - No retry logic for failed API calls
   - No error recovery strategies

7. **Mobile/Tablet**
   - Not tested (desktop-first design)
   - Fixed sidebar width (80px) could be problematic
   - Modal sizing may not be responsive

---

### 5.5 What Is NOT Implemented

#### Commonly Assumed Features That Don't Exist:

1. **File Editing**
   - No annotation tools
   - No highlighting
   - No notes on pages

2. **File Sharing**
   - No share links
   - No collaboration features
   - Import codes exist (UI only, backend not connected)

3. **Export Functionality**
   - No PDF export
   - No summary export
   - No deck export

4. **Search**
   - Library has category filters (not full-text search)
   - Summaries/MCQ/Flashcards have title search (not content search)

5. **Real-Time Updates**
   - No WebSocket connections
   - Polling only (4s intervals)

6. **Offline Support**
   - No service workers
   - No cached data
   - No offline mode

7. **File Versioning**
   - No version history
   - No restore functionality

8. **Analytics/Progress Tracking**
   - Analytics module is placeholder
   - No progress tracking for study materials

9. **Settings Functionality**
   - Settings page includes: announcements (fetched from backend), feedback box (logs to console in v1, not persisted), account summary (read-only), logout
   - Feedback API (`sendFeedback`) is placeholder (logs to console, returns success)
   - Announcements API (`fetchAnnouncements`) returns static data (structured like real data)

10. **File Upload in Tutor**
    - `uploadFile()` is dummy function (returns null)

11. **Image Context in Astra**
    - `pageImageForTutor` never set (code references it but doesn't populate)

---

### 5.6 Frontend Freeze List

#### Files/Components That Should NOT Be Touched Before Launch:

1. **Auth Flow**
   - `src/components/auth/SignUp.jsx` — Signup logic
   - `src/components/auth/Login.jsx` — Login logic
   - `src/components/auth/VerifyOtp.jsx` — OTP verification
   - `src/App.jsx` (lines 121-399) — Auth state management

2. **File Processing Logic**
   - `src/modules/Library/utils/fileReadiness.js` — Terminal state detection
   - `src/modules/Library/LibraryPage.jsx` (lines 93-130) — Polling logic

3. **Astra Chat Payload**
   - `src/modules/Tutor/apiTutor.js` (lines 132-213) — FileViewer chat payload
   - `src/modules/Library/FileViewer.jsx` (lines 200-250) — Context passing

4. **Generation Polling**
   - `src/modules/summaries/SummariesTab.jsx` (lines 53-98) — Summary polling
   - `src/modules/mcq/MCQTab.jsx` (lines 44-51) — MCQ polling

5. **Legal Acceptance**
   - `src/components/LegalModal.jsx` — Modal implementation
   - `src/components/auth/SignUp.jsx` (lines 179-197) — Acceptance text

#### Areas Safe for Post-Launch Iteration:

1. **UI/UX Improvements**
   - Modal styling
   - Loading states
   - Error messages (replace `alert()` with toast notifications)

2. **Performance Optimizations**
   - Image lazy loading
   - Virtual scrolling for long lists
   - Debouncing search inputs

3. **Mobile Responsiveness**
   - Sidebar collapse on mobile
   - Modal sizing adjustments
   - Touch gesture support

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

---

### 5.7 Launch Risk Assessment (Frontend)

#### Top UX Risks Under Real Users:

1. **File Processing Confusion**
   - **Risk:** Users don't understand why files aren't ready
   - **Impact:** High (blocks core functionality)
   - **Mitigation:** Clear messaging, progress indicators

2. **Generation Failures**
   - **Risk:** Silent failures or unclear error messages
   - **Impact:** High (frustration, support tickets)
   - **Mitigation:** Better error handling, retry logic

3. **Astra Chat Errors**
   - **Risk:** Chat fails without clear feedback
   - **Impact:** Medium (core feature)
   - **Mitigation:** Error messages, fallback responses

4. **Mobile Experience**
   - **Risk:** Poor mobile UX (not tested)
   - **Impact:** Medium (if mobile users expected)
   - **Mitigation:** Mobile testing, responsive fixes

5. **Polling Performance**
   - **Risk:** Excessive API calls under load
   - **Impact:** Medium (backend load, rate limiting)
   - **Mitigation:** Exponential backoff, reduce polling frequency

6. **State Synchronization**
   - **Risk:** UI out of sync with backend (polling gaps)
   - **Impact:** Low (temporary, self-correcting)
   - **Mitigation:** Real-time updates (future)

#### Mobile/Tablet Risks:

1. **Fixed Sidebar (80px)**
   - Takes significant screen space on mobile
   - No collapse functionality

2. **Modal Sizing**
   - May overflow on small screens
   - No touch-optimized interactions

3. **File Viewer**
   - PNG images may be too large for mobile
   - No pinch-to-zoom
   - Page navigation may be difficult

4. **Touch Targets**
   - Buttons may be too small
   - No swipe gestures

#### What Could Realistically Break:

1. **Backend API Changes**
   - Response format changes → frontend breaks
   - Endpoint deprecation → 404 errors
   - Auth token expiration → silent failures

2. **Browser Compatibility**
   - React 19.2.0 (very new) → potential browser issues
   - PDF.js worker → CDN dependency
   - localStorage → privacy mode restrictions

3. **Network Issues**
   - Slow connections → polling creates backlog
   - Intermittent failures → state inconsistencies
   - CORS errors → blocked requests

4. **State Management**
   - Complex polling logic → race conditions
   - Ref synchronization → missed updates
   - Memory leaks → performance degradation

5. **Error Handling Gaps**
   - Unhandled promise rejections → crashes
   - Missing error boundaries → white screen
   - API timeout → infinite loading

---

## APPENDIX A — FILE STRUCTURE

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Root component, routing, auth
├── styles.css                  # Global styles
├── index.css                   # Tailwind base
├── assets/                      # Static assets
│   ├── synapse-logo.png
│   └── favicon.png
├── components/                  # Reusable components
│   ├── auth/                   # Auth screens
│   ├── onboarding/             # Onboarding flow
│   ├── legal/                  # Terms/Privacy content
│   ├── AppLogo.jsx
│   ├── LegalModal.jsx
│   ├── PopupDialog.jsx
│   └── SidebarItem.jsx
├── modules/                     # Feature modules
│   ├── Library/                # File management
│   ├── Tutor/                  # Astra chat
│   ├── summaries/              # Summaries
│   ├── mcq/                    # MCQ decks
│   ├── flashcards/             # Flashcard decks
│   └── settings/               # Settings
└── lib/                        # Utilities
    ├── supabaseClient.js
    ├── api.js
    └── fileCompression.js
```

---

## APPENDIX B — KEY DEPENDENCIES

### Production Dependencies:
- `react` 19.2.0
- `react-dom` 19.2.0
- `react-router-dom` 7.11.0
- `@supabase/supabase-js` 2.84.0
- `react-pdf` 10.2.0
- `pdfjs-dist` 5.4.394
- `lucide-react` 0.554.0 (icons)
- `react-markdown` 10.1.0
- `katex` 0.16.25 (math rendering)

### Build Tools:
- `vite` 7.2.4
- `tailwindcss` 3.4.10
- `@vitejs/plugin-react` 5.1.1

---

## APPENDIX C — ENVIRONMENT VARIABLES

Required:
- `VITE_API_URL` — Backend API base URL
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key

---

## DOCUMENT STATUS

**Last Updated:** January 2026  
**Next Review:** Post-Launch  
**Maintainer:** Frontend Team

**Change Log:**
- v1.0: Initial blueprint (pre-launch freeze)

---

**END OF BLUEPRINT**

