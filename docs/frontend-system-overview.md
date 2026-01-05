# Synapse Frontend System Overview

**Document Version:** 1.0  
**Last Updated:** 2025  
**Purpose:** Technical overview for accelerator/investor review

---

## 1. Frontend Architecture

### 1.1 Technology Stack

- **Framework:** React 19.2.0 (functional components with hooks)
- **Build Tool:** Vite 7.2.4
- **Routing:** React Router DOM 7.11.0 (client-side routing)
- **Styling:** Tailwind CSS 3.4.10 (utility-first CSS framework)
- **Authentication:** Supabase Auth (@supabase/supabase-js 2.84.0)
- **HTTP Client:** Axios 1.13.2 (with custom interceptor)
- **PDF Rendering:** pdfjs-dist 5.4.394, react-pdf 10.2.0
- **Math Rendering:** KaTeX 0.16.25 (with react-markdown, remark-math, rehype-katex)
- **Icons:** lucide-react 0.554.0, react-icons 5.5.0

### 1.2 Project Structure

```
src/
├── App.jsx                    # Root component, routing, auth state
├── main.jsx                   # React entry point
├── components/                # Shared UI components
│   ├── auth/                 # Authentication components
│   ├── onboarding/           # Onboarding flow components
│   ├── ErrorBoundary.jsx     # React error boundary
│   └── UnifiedCard.jsx       # Reusable card component
├── modules/                  # Feature modules
│   ├── Library/             # File management
│   ├── Tutor/               # AI chat interface
│   ├── summaries/           # Summary generation & viewing
│   ├── mcq/                 # MCQ deck management
│   ├── flashcards/          # Flashcard deck management
│   └── settings/            # User settings
├── lib/                     # Core utilities
│   ├── api.js               # Axios instance with auth interceptor
│   ├── supabaseClient.js    # Supabase client configuration
│   └── fileCompression.js    # File compression utilities
└── styles.css               # Global styles
```

### 1.3 Routing Model

- **Client-side routing:** All routes handled by React Router
- **Route structure:**
  - `/` → Redirects to `/tutor`
  - `/library` → Library file grid
  - `/library/:fileId` → File viewer with page navigation
  - `/library/:fileId/page/:pageNumber` → File viewer at specific page
  - `/tutor` → AI tutor chat interface
  - `/summaries` → Summaries list
  - `/summaries/:summaryId` → Summary viewer (route-level component)
  - `/mcq` → MCQ decks list
  - `/flashcards` → Flashcard decks list
  - `/flashcards/:deckId` → Flashcard deck view
  - `/settings` → Settings page
  - Placeholder routes: `/osce`, `/oral`, `/planner`, `/analytics`
- **Route protection:** Authentication check in `App.jsx` via Supabase session
- **Deep linking:** Supported for files, summaries, MCQ decks, flashcard decks via notification clicks

### 1.4 Component Architecture

- **Functional components:** All components use React hooks (no class components except ErrorBoundary)
- **Component composition:** Modular feature-based structure
- **Shared components:** `UnifiedCard` used across Summaries, MCQ, Flashcards for consistent UI
- **Error boundaries:** `ErrorBoundary` wraps main route content to catch render-time crashes

---

## 2. Core User Flows

### 2.1 Authentication & Onboarding

**Flow:**
1. **Landing page** → User sees marketing content
2. **Sign up / Login** → Supabase email/password authentication
3. **OTP verification** → Email OTP required for signup
4. **Onboarding flow** → Multi-step form collecting:
   - Account type (student/professional)
   - Country
   - University
   - Year of study or specialty
   - Primary goals (multi-select)
   - Resource preferences
5. **Profile creation** → Data saved to Supabase `profiles` table
6. **Session persistence** → Access token stored in `localStorage`, auto-refresh enabled

**Implementation:**
- Auth state managed in `App.jsx` via `supabase.auth.onAuthStateChange()`
- Onboarding data collected via controlled form components
- Profile completeness check: `field_of_study` and `stage` must exist to skip onboarding

### 2.2 Library & File Management

**Flow:**
1. **File upload** → Drag-and-drop or click to upload (PDF, PPT, images)
2. **File processing** → Backend renders pages and performs OCR
3. **Status polling** → Frontend polls every 4 seconds until `render_state.status === "completed"` and `render_state.ocr_status === "completed"`
4. **File viewing** → Click file to open `FileViewer` component
5. **Page navigation** → URL-based page navigation (`/library/:fileId/page/:pageNumber`)
6. **Folder organization** → Create folders, move files, rename items

**Implementation:**
- Files stored in Supabase Storage, metadata in `library_items` table
- File readiness determined by `render_state` object from backend
- Polling stops when all files reach terminal states (`completed`, `partial`, `failed`)
- File viewer uses PDF.js to render pages as PNG images

### 2.3 AI Interaction (Tutor)

**Flow:**
1. **Session management** → User creates/selects chat sessions
2. **Message sending** → User types question, sends to `POST /ai/tutor/chat`
3. **Streaming response** → Backend streams response, frontend displays incrementally
4. **Message persistence** → Messages stored in backend, loaded on session select
5. **Context awareness** → Tutor can reference current file/page if opened from FileViewer

**Implementation:**
- Sessions stored in backend, loaded on mount
- Messages fetched via `GET /ai/tutor/sessions/:sessionId/messages`
- Session ID stored in `localStorage` for file-specific chats
- Chat UI uses `MessageBubble` component for rendering

### 2.4 Learning Modules

#### Summaries
1. **Generation** → User selects file, clicks "Generate Summary", modal collects parameters
2. **Backend processing** → `POST /ai/summaries/generate` triggers async generation
3. **Notification** → Backend creates notification when complete
4. **Viewing** → Click summary card opens `SummaryViewer` with full content
5. **Chat integration** → Summary viewer includes chat sidebar for Q&A

#### MCQ Decks
1. **Generation** → User selects file, clicks "Generate MCQ", modal collects parameters
2. **Backend processing** → `POST /ai/mcq/generate` triggers async generation
3. **Notification** → Backend creates notification when complete
4. **Viewing** → Click deck opens `MCQPlayer` for practice
5. **Sharing** → Generate import code via `POST /ai/mcq/:id/share`

#### Flashcard Decks
1. **Generation** → User selects file, clicks "Generate Flashcards", modal collects parameters
2. **Backend processing** → `POST /ai/flashcards/generate` triggers async generation
3. **Notification** → Backend creates notification when complete
4. **Viewing** → Click deck opens `DeckView`, then `ReviewScreen` for spaced repetition
5. **Sharing** → Generate import code via `POST /ai/flashcards/:id/share`

### 2.5 Import/Export Flow

**Export (Generate Import Code):**
1. User clicks "Generate Import Code" in overflow menu
2. Frontend calls `POST /ai/{module}/:id/share` (Summaries, MCQ, Flashcards)
3. Backend returns `{ share_code: "SYN-XXXXX" }` or `{ code: "SYN-XXXXX" }`
4. Modal displays code with copy-to-clipboard button

**Import:**
1. User clicks "Import" button in module tab
2. Modal opens with code input field
3. Frontend validates format: `/^SYN-[A-Z0-9]{5}$/i` (9 characters total)
4. User pastes code, clicks "Import"
5. Frontend calls `POST /ai/{module}/import` with `{ code }`
6. Backend validates and creates item, frontend refreshes list
7. Error messages sanitized via `sanitizeErrorMessage()` utility

---

## 3. State Management Strategy

### 3.1 Local State (Component-Level)

**Pattern:** React `useState` hooks for component-specific state

**Examples:**
- `FileViewer`: `activePage`, `chatMessages`, `chatInput`, `isChatTyping`
- `SummaryViewer`: `summary`, `loading`, `error`, `messages`, `sessionId`
- `TutorPage`: `sessions`, `activeSessionId`, `isLoadingSessions`
- `LibraryPage`: `items`, `activeFilter`, `currentFolder`, `selectedFile`

**State lifecycle:**
- Initialized on component mount
- Updated via user interactions or API responses
- Cleared on component unmount (no persistence unless explicitly stored)

### 3.2 Global State (App-Level)

**Pattern:** State lifted to `App.jsx` for cross-component sharing

**Global state:**
- `isAuthenticated` → Auth status
- `profile` → User profile data from Supabase
- `notifications` → Notification list (fetched from Supabase, polled every 30 seconds)

**State synchronization:**
- Auth state synced via `supabase.auth.onAuthStateChange()`
- Profile fetched on auth change
- Notifications polled while authenticated

### 3.3 Server-Driven State

**Pattern:** Backend is source of truth, frontend fetches on mount and polls for updates

**Polling strategies:**
- **File processing:** 4-second interval until terminal states reached
- **Notifications:** 30-second interval while authenticated
- **Generation status:** 4-second interval in `FileViewer` for related summaries/MCQ/flashcards

**Data fetching:**
- Initial load on component mount (`useEffect` with empty dependency array)
- Refetch on route params change (`useEffect` with params in dependencies)
- Manual refresh via user actions (delete, rename, import)

### 3.4 Persistent State

**Pattern:** `localStorage` for client-side persistence

**Stored data:**
- `access_token` → Supabase auth token (synced from session)
- `synapse_file_session_{fileId}` → File-specific tutor session IDs
- Supabase auth session (handled by Supabase client, stored in `localStorage`)

**No global state management library:** No Redux, Zustand, or Context API for global state (except React Router context)

---

## 4. Integration Points with Backend APIs

### 4.1 API Client Configuration

**Base setup:**
- Axios instance in `src/lib/api.js`
- Base URL: `import.meta.env.VITE_API_URL`
- Auth interceptor: Attaches `Authorization: Bearer ${token}` from `localStorage`
- Token source: `localStorage.getItem("access_token")` (synced from Supabase session)

### 4.2 API Module Structure

**Module-based organization:**
- `src/modules/summaries/apiSummaries.js` → Summary CRUD, generation, sharing
- `src/modules/mcq/apiMCQ.js` → MCQ deck CRUD, generation, sharing
- `src/modules/flashcards/apiFlashcards.js` → Flashcard deck CRUD, generation, sharing
- `src/modules/Tutor/apiTutor.js` → Session management, message sending
- `src/modules/Library/apiLibrary.js` → File/folder CRUD, upload
- `src/modules/settings/settings.api.js` → Settings management

**API function patterns:**
- Async functions returning `res.data`
- Error handling via try/catch in calling components
- Consistent error format: `err.response?.data?.error || err.response?.data?.message || err.message`

### 4.3 Key API Endpoints Used

**Authentication:**
- Supabase Auth (client-side): `supabase.auth.signInWithPassword()`, `supabase.auth.getUser()`
- Custom endpoints: `POST /auth/signup`, `POST /auth/verify-otp`, `POST /auth/login` (not currently used, Supabase handles auth)

**File Management:**
- `GET /library/items` → List files/folders
- `POST /library/upload` → Upload file
- `GET /library/items/:id` → Get file metadata
- `DELETE /library/items/:id` → Delete file/folder
- `PATCH /library/items/:id` → Update file/folder (rename, move, category)

**AI Generation:**
- `POST /ai/summaries/generate` → Generate summary
- `POST /ai/mcq/generate` → Generate MCQ deck
- `POST /ai/flashcards/generate` → Generate flashcard deck

**Sharing:**
- `POST /ai/summaries/:id/share` → Generate import code for summary
- `POST /ai/mcq/:id/share` → Generate import code for MCQ deck
- `POST /ai/flashcards/:id/share` → Generate import code for flashcard deck

**Import:**
- `POST /ai/summaries/import` → Import summary by code
- `POST /ai/mcq/import` → Import MCQ deck by code
- `POST /ai/flashcards/import` → Import flashcard deck by code

**Tutor:**
- `GET /ai/tutor/sessions` → List chat sessions
- `POST /ai/tutor/sessions` → Create new session
- `POST /ai/tutor/chat` → Send message (returns streaming response)
- `GET /ai/tutor/sessions/:sessionId/messages` → Get session messages

**Notifications:**
- Supabase Realtime: `supabase.from("notifications").select()` (polled every 30 seconds, not realtime subscription)

### 4.4 Supabase Integration

**Direct Supabase usage:**
- **Auth:** `supabase.auth` for authentication
- **Database:** `supabase.from("notifications").select()` for notifications
- **Storage:** File uploads via Supabase Storage (handled by backend, frontend calls backend API)

**Supabase client config:**
- Session persistence: `persistSession: true`
- Storage: `localStorage`
- Auto-refresh: `autoRefreshToken: true`

---

## 5. Handling of Async States, Loading, Errors, and Edge Cases

### 5.1 Loading States

**Pattern:** Boolean state variables (`isLoading`, `isGenerating`, `isTyping`)

**UI indicators:**
- Spinner icons or "Loading..." text
- Disabled buttons during operations
- Skeleton loaders: Not used (simple text/spinner only)

**Examples:**
- `FileViewer`: `isChatTyping`, `isChatLoading`
- `SummaryViewer`: `loading`, `isTyping`, `isLoading`
- `LibraryPage`: `isLoading`, `isLoadingFile`
- `TutorPage`: `isLoadingSessions`

### 5.2 Error Handling

**Pattern:** Try/catch blocks with user-facing error messages

**Error display:**
- Inline error messages in modals/forms
- Error messages in chat (for Tutor/Astra failures)
- Console logging for debugging
- Error boundary for render-time crashes

**Error sources:**
- API errors: `err.response?.data?.error || err.response?.data?.message || err.message`
- Network errors: Caught and displayed generically
- Validation errors: Frontend validation before API calls

**Error sanitization:**
- `sanitizeErrorMessage()` utility removes SQL patterns, technical details
- User-friendly messages for common errors (duplicate, not found, permission)

### 5.3 Polling & Retries

**Polling intervals:**
- File processing: 4 seconds (until terminal states)
- Notifications: 30 seconds (while authenticated)
- Generation status: 4 seconds (in FileViewer for related items)

**Retry logic:**
- No exponential backoff (fixed intervals)
- Polling stops when terminal states reached
- No manual retry buttons (automatic polling only)

**Terminal states:**
- File render: `status === "completed"` AND `ocr_status === "completed"`
- Generation: Determined by notification or backend status field

### 5.4 Edge Cases Handled

**Null/undefined data:**
- `normalizeSummary()` function in `SummaryViewer` ensures all nested fields are arrays/objects
- Optional chaining (`?.`) used throughout for nested property access
- Render guards: `if (!summary) return <LoadingState />` before property access

**Missing data:**
- Default values for missing fields (e.g., `title ?? "Untitled summary"`)
- Empty arrays for missing collections (e.g., `sections: Array.isArray(raw.sections) ? raw.sections : []`)

**Route mismatches:**
- `useParams()` values validated before use
- Early returns if required params missing
- Error boundary catches render crashes

**Session management:**
- Session ID stored in `localStorage` for file-specific chats
- Session ID validated before API calls
- Fallback to null if session not found

**File readiness:**
- `isFileReady()` utility checks `render_state` terminal states
- Files accessible immediately after upload (no blocking)
- Progress bars removed from Library (processing non-blocking)

---

## 6. File Viewing and Interaction Logic

### 6.1 PDF Rendering

**Technology:** PDF.js (pdfjs-dist) via react-pdf wrapper

**Rendering approach:**
- Pages rendered as PNG images (not native PDF rendering)
- `PdfJsPage` component handles individual page rendering
- PDF document cached in `pdfCache.js` to avoid re-fetching

**Page navigation:**
- URL-based: `/library/:fileId/page/:pageNumber`
- State sync: `activePage` synced with URL params
- Navigation: Previous/Next buttons, page input, keyboard shortcuts

**Performance:**
- Pages loaded on-demand (not all at once)
- Caching prevents re-rendering same page
- Image compression for large PDFs

### 6.2 Context Awareness

**File context in Tutor:**
- When opened from FileViewer, tutor chat includes file ID and page number
- `POST /ai/tutor/chat` includes `file_id` and `page_number` in payload
- Tutor can reference current file content in responses

**Summary context:**
- Summary viewer includes chat sidebar
- Chat messages sent with summary ID for context
- `POST /ai/tutor/chat` includes `summary_id` when chatting from summary

### 6.3 Interactive Features

**Text selection:**
- User can select text on rendered pages
- Selection bubble appears with "Ask Astra" button
- Selected text sent to tutor chat with page context

**Page navigation:**
- Previous/Next buttons
- Page number input
- Keyboard shortcuts (arrow keys, page up/down)
- URL updates on navigation (browser back/forward works)

**Chat integration:**
- FileViewer includes chat sidebar
- Messages persisted to backend
- Streaming responses displayed incrementally
- Message history loaded on mount

### 6.4 Generation Actions

**From FileViewer:**
- "Generate Summary" button opens modal
- "Generate MCQ" button opens modal
- "Generate Flashcards" button opens modal
- Modals collect parameters (academic stage, specialty, goal)
- Generation triggered via API, status polled until complete

**Status tracking:**
- `FileViewer` polls for related summaries/MCQ/flashcards every 4 seconds
- Status displayed in action buttons (e.g., "Summary Ready" vs "Generating...")
- Navigation to generated items when ready

---

## 7. Deployment Environment and Runtime Assumptions

### 7.1 Build Configuration

**Build tool:** Vite
- Development server: `npm run dev`
- Production build: `npm run build` (outputs to `dist/`)
- Preview: `npm run preview`

**Environment variables:**
- `VITE_API_URL` → Backend API base URL
- `VITE_SUPABASE_URL` → Supabase project URL
- `VITE_SUPABASE_ANON_KEY` → Supabase anonymous key

**Runtime assumptions:**
- Environment variables must be set at build time
- No runtime environment detection (all config via env vars)

### 7.2 Deployment

**Platform:** Vercel (based on `vercel.json`)

**Deployment config:**
- `vercel.json` includes SPA rewrite rule (all routes → `/index.html`)
- Client-side routing requires server-side rewrite for deep links

**Static assets:**
- Built files in `dist/` directory
- Assets hashed for cache busting
- No server-side rendering (pure SPA)

### 7.3 Browser Requirements

**Assumptions:**
- Modern browser with ES6+ support
- LocalStorage API available
- Fetch API or Axios polyfill (Axios handles this)
- PDF.js requires WebAssembly support (modern browsers)

**No polyfills:** Assumes modern browser environment

### 7.4 Network Assumptions

**CORS:**
- Backend must allow frontend origin
- Credentials: `withCredentials: false` in Axios config

**API availability:**
- Backend API must be accessible at `VITE_API_URL`
- Supabase must be accessible at `VITE_SUPABASE_URL`
- No offline mode (requires network for all operations)

### 7.5 Security Considerations

**Token storage:**
- Access tokens stored in `localStorage` (vulnerable to XSS)
- Tokens synced from Supabase session
- No token refresh logic in frontend (Supabase handles this)

**API authentication:**
- All API requests include `Authorization: Bearer ${token}` header
- Token retrieved from `localStorage` on each request
- No token expiration handling (assumes Supabase auto-refresh works)

**Input validation:**
- Frontend validates import codes (regex: `/^SYN-[A-Z0-9]{5}$/i`)
- Backend validation is source of truth (frontend validation is UX only)

---

## 8. Additional Technical Details

### 8.1 Code Organization Patterns

**Module structure:**
- Each feature module contains:
  - API functions (`api*.js`)
  - UI components (`.jsx` files)
  - Utilities (if needed, in `utils/` subdirectory)

**Component naming:**
- PascalCase for components
- Descriptive names (e.g., `SummaryViewer`, `FileViewer`, `MCQPlayer`)

**File naming:**
- Components: PascalCase (e.g., `SummaryViewer.jsx`)
- Utilities: camelCase (e.g., `fileReadiness.js`)
- API modules: camelCase (e.g., `apiSummaries.js`)

### 8.2 Styling Approach

**Tailwind CSS:**
- Utility-first classes
- Custom color palette: `teal`, `muted`, `void` (defined in `tailwind.config.js`)
- Dark theme by default (no theme switching)

**Component styling:**
- Inline Tailwind classes (no CSS modules or styled-components)
- Reusable button classes: `btn btn-primary`, `btn btn-secondary`
- Consistent spacing via Tailwind utilities

### 8.3 Performance Considerations

**Optimizations:**
- PDF page caching to avoid re-rendering
- Polling intervals optimized (4s for processing, 30s for notifications)
- Conditional polling (stops when terminal states reached)

**No optimizations:**
- No code splitting (single bundle)
- No lazy loading of routes
- No memoization of expensive computations (React.memo, useMemo not used)

### 8.4 Testing & Quality

**Linting:**
- ESLint configured (eslint.config.js)
- React hooks rules enforced

**No testing framework:** No unit tests, integration tests, or E2E tests currently

**Error tracking:**
- Console logging for errors
- Error boundary for render crashes
- No external error tracking service (Sentry, etc.)

---

## 9. Known Limitations & Constraints

### 9.1 State Management

- No global state management library (Redux, Zustand, etc.)
- State lifted to `App.jsx` when needed across components
- No Context API for shared state (except React Router)

### 9.2 Real-time Features

- Notifications polled (not realtime subscription)
- No WebSocket connections
- Chat messages loaded on session select (not realtime)

### 9.3 Offline Support

- No offline mode
- No service workers
- All operations require network connection

### 9.4 Browser Compatibility

- Assumes modern browser (no IE11 support)
- No polyfills for older browsers
- WebAssembly required for PDF.js

---

## Conclusion

The Synapse frontend is a React-based single-page application with client-side routing, Supabase authentication, and modular feature architecture. State management is component-local with server-driven data fetching and polling. The application handles file viewing, AI-powered content generation, and interactive learning modules with consistent error handling and loading states.

**Key strengths:**
- Modular, feature-based architecture
- Consistent UI patterns via shared components
- Robust error handling and edge case management
- URL-based navigation for deep linking

**Areas for future enhancement:**
- Global state management for complex state
- Real-time subscriptions for notifications
- Code splitting and lazy loading for performance
- Comprehensive testing suite

