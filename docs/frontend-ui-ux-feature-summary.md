# Synapse Frontend UI/UX Feature Summary

**Document Purpose:** Pre-implementation audit for guided tour feature  
**Date:** 2025  
**Scope:** Frontend codebase only

---

## Backend Feature Summary

**Status:** ⚠️ **Not Analyzed**

**Note:** This document focuses on the frontend codebase only. Backend analysis requires access to the backend repository and is not included here.

**Backend Integration Points (from frontend perspective):**
- API endpoints called by frontend (documented in frontend API modules)
- Supabase database tables accessed (`profiles`, `notifications`)
- Authentication handled via Supabase Auth
- File storage via Supabase Storage (backend-managed)

**For complete backend audit:** Analyze backend codebase separately.

---

## Frontend Feature Summary

---

## 1. Onboarding Flow

### 1.1 Completion Logic

**Trigger:**
- Onboarding is triggered when `profile.field_of_study` OR `profile.stage` is missing
- Check occurs in `App.jsx` → `fetchProfile()` function (lines 347-354)
- Condition: `!profileData || !profileData.field_of_study || !profileData.stage`

**Completion Steps:**
1. User completes 5-step onboarding form:
   - Step 1: Country selection
   - Step 2: Field of study and year/specialty
   - Step 3: University
   - Step 4: Primary goals (multi-select)
   - Step 5: Resource preferences (multi-select)
2. Final submit calls `POST /onboarding` with payload:
   - `field_of_study`
   - `student_year`
   - `university`
   - `country`
   - `language: "en"`
3. On success, shows `OnboardingComplete` component
4. User clicks "Enter Dashboard" button
5. `onComplete()` callback fires:
   - Calls `fetchProfile()` to reload profile
   - Sets `authScreen` to `null`
   - Clears `tempUserData`

**Completion Detection:**
- **Globally detectable:** Yes, via `profile` state in `App.jsx`
- **Check method:** `profile?.field_of_study && profile?.stage` (both must exist)
- **State location:** `App.jsx` → `const [profile, setProfile] = useState(null)`
- **Access:** Available to all components via props or context (currently passed as props to `SettingsPage`)

### 1.2 Final Route After Onboarding

**Route:** `/tutor` (default route)

**Implementation:**
- Root route `/` redirects to `/tutor` (line 640 in `App.jsx`)
- Catch-all route `*` also redirects to `/tutor` (line 694)
- No explicit redirect after onboarding completion
- User lands on Tutor page after clicking "Enter Dashboard"

**Note:** There is no dedicated "Dashboard" screen. Tutor (`/tutor`) serves as the default landing page.

---

## 2. Core Screens

### 2.1 Dashboard

**Status:** ❌ **Does not exist**

**Implementation:**
- No dedicated dashboard component
- Root route `/` redirects to `/tutor`
- Tutor page effectively serves as home/dashboard

**Alternative:** Use Tutor screen as dashboard equivalent for tour purposes.

---

### 2.2 Library

**Route:** `/library`, `/library/:fileId`, `/library/:fileId/page/:pageNumber`

**Key UI Components:**
- `LibraryPage` (main container)
- `LibraryFilters` (category filter buttons: All, Lectures, Notes, Research, Other)
- `LibraryGrid` (file/folder grid display)
- `LibraryCard` (individual file/folder card)
- `FileViewer` (rendered when `fileId` in URL)
- Modals:
  - `LibraryUploadModal` (file upload)
  - `CreateFolderModal` (folder creation)
  - `RenameModal` (rename item)
  - `MoveToFolderModal` (move to folder)
  - `ChangeCategoryModal` (change category)

**User Actions:**
- Upload files (drag-and-drop or click)
- Create folders
- Open files (click file → navigates to `/library/:fileId`)
- Navigate pages (URL updates to `/library/:fileId/page/:pageNumber`)
- Rename items (overflow menu → Rename)
- Delete items (overflow menu → Delete)
- Move items to folders (overflow menu → Move)
- Change category (overflow menu → Change Category)
- Filter by category (All, Lectures, Notes, Research, Other)
- Navigate folder hierarchy (breadcrumbs)

**Stability:** ✅ **Stable**

**Notes:**
- File viewer is full-screen overlay (not separate route component)
- File viewer includes chat sidebar and generation action buttons
- Files accessible immediately after upload (no blocking)

---

### 2.3 File Viewer

**Route:** `/library/:fileId`, `/library/:fileId/page/:pageNumber`

**Key UI Components:**
- `FileViewer` (main component, rendered within `LibraryPage`)
- `PdfJsPage` (PDF page renderer)
- `MessageBubble` (chat message display)
- Generation modals:
  - `GenerateSummaryModal`
  - `GenerateMCQModal`
  - `GenerateFlashcardsModal`

**User Actions:**
- Navigate pages (Previous/Next buttons, page input, keyboard shortcuts)
- Chat with Astra (file-specific tutor chat)
- Select text on pages (shows "Ask Astra" bubble)
- Generate Summary (button opens modal)
- Generate MCQ (button opens modal)
- Generate Flashcards (button opens modal)
- View generation status (buttons show "Ready" or "Generating...")
- Navigate back to Library (Back button)

**Stability:** ✅ **Stable**

**Notes:**
- Full-screen layout (hides sidebar)
- Chat sidebar on right side
- Page navigation updates URL
- Session ID stored in `localStorage` for file-specific chats

---

### 2.4 Tutor (Astra)

**Route:** `/tutor`

**Key UI Components:**
- `TutorPage` (main container)
- `ChatSidebar` (session list on left)
- `ChatWindow` (chat interface on right)
- `MessageBubble` (message display)

**User Actions:**
- Create new chat session (button in sidebar)
- Select chat session (click session in sidebar)
- Send messages (input field, Enter or Send button)
- Delete session (overflow menu → Delete)
- Rename session (overflow menu → Rename)
- View message history (loaded on session select)
- Stream responses (real-time display)

**Stability:** ✅ **Stable**

**Notes:**
- Default landing page (root route redirects here)
- No auto-selection of sessions (sidebar starts empty)
- Sessions loaded on mount
- Messages fetched on session select

---

### 2.5 Summaries

**Route:** `/summaries`, `/summaries/:summaryId`

**Key UI Components:**
- `SummariesTab` (list view)
- `SummaryCard` (individual summary card, wraps `UnifiedCard`)
- `SummaryViewer` (detail view, route-level component)
- `GenerateSummaryModal` (generation modal)
- Import modal (inline in `SummariesTab`)

**User Actions:**
- View summaries list (grid layout)
- Search summaries (search input)
- Sort summaries (newest/oldest dropdown)
- Generate summary (button opens modal)
- Import summary (button opens import modal)
- Open summary (click card → navigates to `/summaries/:summaryId`)
- View summary content (full viewer with sections, tables, key takeaways)
- Chat about summary (chat sidebar in viewer)
- Rename summary (overflow menu → Rename)
- Delete summary (overflow menu → Delete)
- Generate import code (overflow menu → Generate Import Code)
- Copy import code (modal with copy button)

**Stability:** ✅ **Stable**

**Notes:**
- Summary viewer is route-level component (separate route)
- Polls for updates every 15 seconds
- Unified card pattern used for consistent UI

---

### 2.6 MCQs

**Route:** `/mcq`, `/mcq/:deckId` (implied, not explicitly defined in routes)

**Key UI Components:**
- `MCQTab` (list view)
- `UnifiedCard` (MCQ deck card)
- `MCQDeckView` (deck detail view)
- `MCQPlayer` (practice interface)
- `GenerateMCQModal` (generation modal)
- Import modal (inline in `MCQTab`)

**User Actions:**
- View MCQ decks list (grid layout)
- Search decks (search input)
- Sort decks (newest/oldest dropdown)
- Generate MCQ deck (button opens modal)
- Import MCQ deck (button opens import modal)
- Open deck (click card → sets `view` to "deck")
- Practice MCQ (MCQPlayer interface)
- Rename deck (overflow menu → Rename)
- Delete deck (overflow menu → Delete)
- Generate import code (overflow menu → Generate Import Code)

**Stability:** ✅ **Stable**

**Notes:**
- Uses internal state for view switching (`view: "list" | "deck"`)
- Not route-based navigation (state-driven)
- Polls for generating decks every 4 seconds

---

### 2.7 Flashcards

**Route:** `/flashcards` (deck view and review are state-driven, not routes)

**Key UI Components:**
- `FlashcardsTab` (list view)
- `DeckList` (deck grid container)
- `DeckCard` (individual deck card, wraps `UnifiedCard`)
- `DeckView` (deck detail view)
- `ReviewScreen` (spaced repetition interface)
- `GenerateFlashcardsModal` (generation modal)
- Import modal (inline in `DeckList`)

**User Actions:**
- View flashcard decks list (grid layout)
- Search decks (search input)
- Sort decks (newest/name dropdown)
- Generate flashcard deck (button opens modal)
- Import flashcard deck (button opens import modal)
- Open deck (click card → sets `view` to "deck")
- View cards in deck (DeckView interface)
- Start review (button → sets `view` to "review")
- Practice flashcards (ReviewScreen with spaced repetition)
- Rename deck (overflow menu → Rename)
- Delete deck (overflow menu → Delete)
- Generate import code (overflow menu → Generate Import Code)

**Stability:** ✅ **Stable**

**Notes:**
- Uses `FlashcardsModule` wrapper in `App.jsx` for view state
- View switching: `"list" | "deck" | "review"` (state-driven, not routes)
- Not route-based navigation for deck/review views

---

### 2.8 Notifications

**Route:** N/A (header component, not a route)

**Key UI Components:**
- Notification bell icon (header, right side)
- Notification dropdown (absolute positioned)
- Notification items (list in dropdown)

**User Actions:**
- View notifications (click bell icon)
- Click notification (navigates to related content):
  - Summary → `/summaries/:summaryId`
  - MCQ → `/mcq/:deckId` (implied)
  - Flashcard → `/flashcards/:deckId` (implied)
  - File → `/library/:fileId`
- Clear all notifications (button in dropdown header)
- View unread count (badge on bell icon)

**Stability:** ✅ **Stable**

**Notes:**
- Not a standalone screen (header component)
- Polls every 30 seconds while authenticated
- Click-outside-to-close implemented
- Only "completed" notifications are clickable

---

### 2.9 Settings

**Route:** `/settings`

**Key UI Components:**
- `SettingsPage` (main container)
- `AnnouncementsPanel` (left column)
- `FeedbackBox` (right column)
- Account summary (right column, read-only)
- Logout button (bottom, centered)

**User Actions:**
- View announcements (fetched from backend)
- Submit feedback (text input, submit button)
- View account info (name, email, stage - read-only)
- Logout (button signs out via Supabase)

**Stability:** ✅ **Stable**

**Notes:**
- No editable profile fields (read-only display)
- Feedback submission logs to console (v1 implementation)

---

## 3. State Management

### 3.1 Global State Solution

**Solution:** React `useState` hooks in `App.jsx` (no global state management library)

**Global State Variables:**
- `isAuthenticated` (boolean)
- `authScreen` ("landing" | "login" | "signup" | "onboarding" | null)
- `profile` (user profile object from Supabase)
- `notifications` (array of notification objects)
- `tempUserData` (temporary user data during auth flow)

**No Context API:** State passed as props to child components

**No Redux/Zustand:** Pure React state management

### 3.2 Auth/User State Availability

**Availability:** ✅ **Available globally**

**Access Method:**
- `profile` state in `App.jsx`
- Currently passed as prop to `SettingsPage`
- Can be accessed by any component via props or by lifting state

**Profile Structure:**
```javascript
{
  id: string,
  full_name: string,
  email: string,
  field_of_study: string,
  stage: string,
  university: string,
  country: string,
  student_year: string,
  avatar_url: string,
  // ... other fields
}
```

**Onboarding Detection:**
- Check: `profile?.field_of_study && profile?.stage`
- Both must exist to consider onboarding complete

### 3.3 Feature Flags or Guards

**Feature Flags:** ❌ **None implemented**

**Guards:**
- **Auth guard:** `isAuthenticated` check in `App.jsx` (redirects to landing if not authenticated)
- **Onboarding guard:** `profile?.field_of_study && profile?.stage` check (redirects to onboarding if missing)
- **No feature-specific flags:** All features available to all authenticated users

**Route Protection:**
- All routes except `/` (landing) require authentication
- Onboarding required before accessing main app

---

## 4. Navigation & Routing

### 4.1 Route Structure

**Routes Defined:**
```
/ → Redirects to /tutor
/library → LibraryPage
/library/:fileId → LibraryPage (renders FileViewer)
/library/:fileId/page/:pageNumber → LibraryPage (renders FileViewer at page)
/tutor → TutorPage
/summaries → SummariesTab
/summaries/:summaryId → SummaryViewer (route-level component)
/mcq → MCQTab
/flashcards → FlashcardsTab (view state managed internally)
/settings → SettingsPage
/osce → Placeholder component
/oral → Placeholder component
/planner → Placeholder component
/analytics → Placeholder component
* → Redirects to /tutor
```

**Route Implementation:**
- React Router DOM v7.11.0
- Client-side routing (SPA)
- Routes defined in `App.jsx` (lines 639-695)

### 4.2 Deep-Link Support

**Supported Deep Links:**
- ✅ `/library/:fileId` → Opens file viewer
- ✅ `/library/:fileId/page/:pageNumber` → Opens file at specific page
- ✅ `/summaries/:summaryId` → Opens summary viewer
- ❌ `/mcq/:deckId` → Not route-based (state-driven)
- ❌ `/flashcards/:deckId` → Not route-based (state-driven)

**Deep-Link Usage:**
- Notification clicks navigate to deep links
- Browser back/forward works for route-based navigation
- URL updates on navigation (file viewer page changes)

**Limitations:**
- MCQ and Flashcard deck views are state-driven, not routes
- Cannot deep-link to specific MCQ deck or flashcard deck
- Cannot deep-link to flashcard review screen

### 4.3 UI Element Highlighting/Anchoring

**Highlighting Capabilities:**

**✅ Can be highlighted (stable DOM elements):**
- Sidebar navigation items (fixed position, consistent IDs/classes)
- Header elements (logo, notifications bell, profile)
- Main content areas (route-based components)
- Buttons (consistent class names: `btn btn-primary`, `btn btn-secondary`)
- Cards (UnifiedCard pattern with consistent structure)
- Search inputs (consistent across modules)
- Filter buttons (Library filters)

**⚠️ Conditional highlighting (may not exist):**
- Overflow menus (only visible on hover/click)
- Modals (only visible when opened)
- Generation buttons (may be disabled if no files)
- Import buttons (always visible)

**❌ Cannot be reliably highlighted:**
- Dynamic content (file cards, summary cards - depends on user data)
- Empty states (no content to highlight)
- Loading states (elements may not exist)
- Error states (conditional rendering)

**Element Identification:**
- **Classes:** Tailwind utility classes (not semantic IDs)
- **No data attributes:** No `data-tour` or `data-step` attributes
- **Component-based:** Elements identified by component structure

**Recommendation for Tour:**
- Use CSS selectors based on component structure
- Add `data-tour` attributes during tour implementation
- Handle empty states gracefully (skip steps if no content)

---

## 5. UI Constraints

### 5.1 What Can Be Highlighted in a Tour

**✅ Safe to Highlight:**

1. **Sidebar Navigation**
   - Fixed position, always visible
   - Consistent structure across all pages
   - Icons and labels stable

2. **Header Elements**
   - Logo (top-left)
   - Notifications bell (top-right)
   - Profile avatar (top-right)
   - Fixed position, always visible

3. **Module-Specific UI Patterns**
   - Search bars (consistent across modules)
   - Sort dropdowns (consistent structure)
   - "Generate" buttons (consistent placement)
   - "Import" buttons (consistent placement)

4. **Card Actions**
   - Overflow menu (⋮) button (consistent placement)
   - Card click areas (consistent structure)

**⚠️ Conditionally Highlightable:**

1. **Modals**
   - Only highlightable when opened
   - Must trigger modal open before highlighting
   - Backdrop click closes modal (may interfere with tour)

2. **Dynamic Content**
   - File cards (only if user has files)
   - Summary cards (only if user has summaries)
   - MCQ/Flashcard decks (only if user has decks)

3. **Generation Buttons**
   - May be disabled if no files uploaded
   - Must ensure files exist before highlighting

### 5.2 Modals, Drawers, and Overlays

**Modals (Portal-based):**

1. **Generation Modals** (all use `createPortal`):
   - `GenerateSummaryModal`
   - `GenerateMCQModal`
   - `GenerateFlashcardsModal`
   - All render to `document.body`
   - Backdrop click closes modal
   - ESC key closes modal (some implementations)

2. **Library Modals**:
   - `LibraryUploadModal`
   - `CreateFolderModal`
   - `RenameModal`
   - `MoveToFolderModal`
   - `ChangeCategoryModal`
   - All use fixed overlay pattern
   - Backdrop click closes modal

3. **Import Modals**:
   - Summaries import modal (inline in `SummariesTab`)
   - MCQ import modal (inline in `MCQTab`)
   - Flashcards import modal (inline in `DeckList`)
   - All use `createPortal` to `document.body`
   - Backdrop click closes modal

4. **Export Code Modal**:
   - In `UnifiedCard` component
   - Uses `createPortal` to `document.body`
   - Backdrop click closes modal

5. **Legal Modal**:
   - `LegalModal` component
   - Terms/Privacy content
   - ESC key closes modal
   - Backdrop click closes modal

**Drawers:** ❌ **None**

**Overlays:**
- Notification dropdown (absolute positioned, not portal)
- Overflow menus (absolute positioned, not portal)

**Tour Considerations:**
- Modals block interaction with underlying content
- Must close modals before continuing tour
- Portal-based modals render outside component tree (may need special handling)

### 5.3 Lazy-Loaded Components

**Lazy Loading:** ❌ **None implemented**

**All Components:**
- Eagerly loaded on route navigation
- No `React.lazy()` or code splitting
- Single bundle (no route-based code splitting)

**Dynamic Imports:** ❌ **None**

**Tour Impact:**
- No need to wait for lazy-loaded components
- All components available immediately on route navigation

### 5.4 Pages Unsafe for Guided Walkthroughs

**❌ Unsafe Pages:**

1. **File Viewer (`/library/:fileId`)**
   - **Reason:** Requires specific file ID
   - **Issue:** May not exist for new users
   - **Workaround:** Skip or use mock/demo file

2. **Summary Viewer (`/summaries/:summaryId`)**
   - **Reason:** Requires specific summary ID
   - **Issue:** May not exist for new users
   - **Workaround:** Skip or use mock/demo summary

3. **MCQ Deck View (state-driven)**
   - **Reason:** Requires deck selection
   - **Issue:** May not exist for new users
   - **Workaround:** Skip or ensure deck exists

4. **Flashcard Deck View (state-driven)**
   - **Reason:** Requires deck selection
   - **Issue:** May not exist for new users
   - **Workaround:** Skip or ensure deck exists

5. **Flashcard Review Screen (state-driven)**
   - **Reason:** Requires deck selection and review start
   - **Issue:** Complex state transitions
   - **Workaround:** Skip or ensure deck exists

**⚠️ Partially Safe Pages:**

1. **Library (`/library`)**
   - **Safe if:** User has files
   - **Unsafe if:** Empty state (no files)
   - **Workaround:** Show upload step first, or skip empty state

2. **Summaries (`/summaries`)**
   - **Safe if:** User has summaries OR can generate
   - **Unsafe if:** Empty state AND no files to generate from
   - **Workaround:** Show generation step first

3. **MCQ (`/mcq`)**
   - **Safe if:** User has decks OR can generate
   - **Unsafe if:** Empty state AND no files to generate from
   - **Workaround:** Show generation step first

4. **Flashcards (`/flashcards`)**
   - **Safe if:** User has decks OR can generate
   - **Unsafe if:** Empty state AND no files to generate from
   - **Workaround:** Show generation step first

**✅ Safe Pages:**

1. **Tutor (`/tutor`)**
   - Always safe (no dependencies)
   - Can create session, send message
   - Empty state is acceptable

2. **Settings (`/settings`)**
   - Always safe (no dependencies)
   - Read-only display
   - Always has content (announcements, feedback form)

---

## 6. Additional Tour Implementation Notes

### 6.1 Recommended Tour Flow

**Suggested Order:**
1. Tutor (default landing, always safe)
2. Library (upload file first if empty)
3. File Viewer (if file exists)
4. Summaries (show generation if empty)
5. MCQs (show generation if empty)
6. Flashcards (show generation if empty)
7. Settings (always safe)
8. Notifications (header element)

**Skip Conditions:**
- Skip File Viewer if no files uploaded
- Skip Summary/MCQ/Flashcard viewers if no items exist
- Skip generation modals if no files available

### 6.2 Element Targeting Strategy

**Current State:**
- No `data-tour` attributes
- No semantic IDs on tour-relevant elements
- Relies on CSS class selectors

**Recommended Approach:**
- Add `data-tour="step-N"` attributes during tour implementation
- Use stable selectors (component structure, not dynamic content)
- Handle conditional rendering gracefully

### 6.3 State Management for Tour

**Tour State:**
- No existing tour state management
- No tour completion tracking
- No tour preferences/settings

**Recommendation:**
- Store tour completion in `localStorage`
- Check `localStorage.getItem("synapse_tour_completed")` before showing tour
- Mark complete after final step

---

## Summary

**Onboarding:**
- ✅ Completion detectable globally via `profile.field_of_study && profile.stage`
- ✅ Final route: `/tutor` (default redirect)

**Core Screens:**
- ✅ 8 main screens (Tutor, Library, File Viewer, Summaries, MCQs, Flashcards, Notifications, Settings)
- ✅ All stable except placeholder modules (OSCE, Oral, Planner, Analytics)

**State Management:**
- ✅ Global state in `App.jsx` (React useState)
- ✅ Auth/user state available globally
- ❌ No feature flags

**Navigation:**
- ✅ Route-based for most screens
- ⚠️ State-driven for MCQ/Flashcard deck views
- ✅ Deep-link support for files and summaries

**UI Constraints:**
- ✅ Sidebar and header elements safe to highlight
- ⚠️ Modals require special handling
- ❌ Dynamic content may not exist for new users
- ⚠️ Some pages unsafe without user data

