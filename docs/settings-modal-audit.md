---
Title: Settings Modal Audit Report
Version: v1.0 (Current Production State)
Status: Diagnostic Analysis Only
Date: January 2026
---

# Settings Modal Audit Report

## Executive Summary

The Settings page (`/settings`) is a minimal implementation with three functional areas: announcements display, feedback submission (console-only), and account information display (read-only). No editable settings are currently implemented. This report analyzes what exists, what's feasible to add, and what requires backend changes.

---

## 1. Current Settings Modal Snapshot

### 1.1 Component Structure

**Main Component:** `src/modules/settings/SettingsPage.jsx`

**Layout:**
- 2-column grid (responsive, stacks on mobile)
- Left column (2/3 width): Announcements panel
- Right column (1/3 width): Feedback box + Account summary
- Bottom (centered): Logout button

**Child Components:**
- `AnnouncementsPanel.jsx` - Displays announcements
- `FeedbackBox.jsx` - Feedback submission form
- Account summary (inline JSX, no separate component)

### 1.2 Implemented Features

#### ✅ Announcements Panel
**Status:** Fully implemented (UI only)

**Implementation:**
- Fetches announcements via `fetchAnnouncements()` from `settings.api.js`
- Displays list of announcements with title, body, date
- Static data (hardcoded array in `settings.api.js`)

**Data Source:**
```javascript
// settings.api.js - Static data
return [
  {
    id: 1,
    title: "Coming Soon to Synapse",
    body: "• Oral Exam Mode\n...",
    date: "Today"
  }
];
```

**Backend Dependency:** ❌ None (static data)
**Persistence:** ❌ None (hardcoded)
**User-Scoped:** ❌ No (same for all users)

#### ✅ Feedback Box
**Status:** Partially implemented (UI + console logging)

**Implementation:**
- Textarea input for feedback message
- Submit button
- Success message (3s timeout)
- Calls `sendFeedback({ message, user })` from `settings.api.js`

**Data Flow:**
```javascript
// settings.api.js - Console log only
console.log("📩 New Feedback:", { message, user, created_at });
return { success: true };
```

**Backend Dependency:** ❌ None (console.log only)
**Persistence:** ❌ None (not saved anywhere)
**User-Scoped:** ✅ Yes (includes user object in log)

**Note:** Comment in code says "Later you can replace these with Supabase calls"

#### ✅ Account Summary
**Status:** Fully implemented (read-only display)

**Implementation:**
- Displays `profile.full_name` (or "User" fallback)
- Displays `profile.email`
- Displays `profile.stage` (or "—" fallback)
- No edit controls
- No action buttons

**Data Source:**
- `profile` prop passed from `App.jsx`
- Profile fetched from Supabase `profiles` table via `supabase.from("profiles").select("*").eq("id", user.id)`

**Backend Dependency:** ✅ Yes (Supabase `profiles` table)
**Persistence:** ✅ Yes (read from Supabase)
**User-Scoped:** ✅ Yes (user-specific data)

**Profile Fields Available:**
- `id` (string)
- `full_name` (string)
- `email` (string)
- `field_of_study` (string)
- `stage` (string)
- `university` (string)
- `country` (string)
- `student_year` (string)
- `avatar_url` (string)
- Other fields (not fully documented in frontend)

#### ✅ Logout Button
**Status:** Fully implemented (fully wired)

**Implementation:**
- Calls `supabase.auth.signOut()`
- Removes `localStorage.access_token`
- Calls `onLogout()` callback → sets `isAuthenticated(false)` in `App.jsx`
- Fully functional, no issues

**Backend Dependency:** ✅ Yes (Supabase Auth)
**Persistence:** ✅ Yes (session cleared)
**User-Scoped:** ✅ Yes (user-specific action)

---

## 2. Supported vs Unsupported Settings

### 2.1 Account Information

**Current State:**
- ✅ Display: Name, email, stage (read-only)
- ❌ Edit: No edit controls
- ❌ Password change: Not implemented
- ❌ Email change: Not implemented
- ❌ Avatar upload: Not implemented

**Backend Support:**
- ✅ Profile read: `supabase.from("profiles").select()` (exists)
- ❌ Profile update: No `PATCH /profiles/:id` endpoint visible
- ❌ Password change: Would need Supabase Auth API (`supabase.auth.updateUser()`)
- ❌ Email change: Would need Supabase Auth API + verification flow

**Feasibility:**
- **Name edit:** Requires backend API (`PATCH /profiles/:id` or Supabase direct update)
- **Email change:** Requires Supabase Auth API + email verification flow
- **Password change:** Requires Supabase Auth API (`supabase.auth.updateUser({ password })`)
- **Avatar upload:** Requires file upload API + profile update API

**Verdict:** ❌ **Not feasible without backend changes**

### 2.2 Study Preferences

**Current State:**
- ❌ Not implemented
- ❌ No UI controls
- ❌ No backend schema

**Proposed Settings:**
- Astra explanation style (concise vs detailed)
- MCQ difficulty preference
- Flashcard review frequency
- Summary format preference

**Backend Support:**
- ❌ No `user_preferences` table visible
- ❌ No API endpoints for preferences
- ❌ No schema for study preferences

**Feasibility:**
- **Frontend-only:** Could store in `localStorage` (not persisted across devices)
- **Backend-required:** Would need new table + API endpoints

**Verdict:** ❌ **Not feasible without backend changes** (unless frontend-only localStorage, which is not recommended)

### 2.3 Flashcards & MCQs Preferences

**Current State:**
- ❌ Not implemented
- ❌ No UI controls
- ❌ No backend schema

**Proposed Settings:**
- Default flashcard review mode
- MCQ timer preferences
- Auto-advance after answer
- Show explanations by default

**Backend Support:**
- ❌ No preferences table
- ❌ No API endpoints
- ❌ No schema

**Feasibility:**
- **Frontend-only:** Could use `localStorage` (not recommended for multi-device)
- **Backend-required:** Would need new table + API endpoints

**Verdict:** ❌ **Not feasible without backend changes**

### 2.4 Notifications

**Current State:**
- ✅ Notifications system exists (polling, deep linking)
- ❌ No notification preferences UI
- ❌ No notification settings

**Backend Support:**
- ✅ Notifications table exists (`notifications` in Supabase)
- ❌ No `notification_preferences` table visible
- ❌ No API endpoints for notification settings

**Proposed Settings:**
- Email notifications on/off
- Push notifications (if implemented)
- Notification types (summary_completed, mcq_completed, etc.)

**Feasibility:**
- **Frontend-only:** Could store preferences in `localStorage` (not recommended)
- **Backend-required:** Would need new table + API endpoints

**Verdict:** ❌ **Not feasible without backend changes**

### 2.5 Privacy & Data Controls

**Current State:**
- ❌ Not implemented
- ❌ No UI controls
- ❌ No data export functionality
- ❌ No account deletion

**Proposed Settings:**
- Data export (download all user data)
- Account deletion
- Privacy policy acceptance tracking
- Data retention preferences

**Backend Support:**
- ❌ No data export API
- ❌ No account deletion API
- ❌ No privacy settings table

**Feasibility:**
- **Data export:** Requires backend API to aggregate and export user data
- **Account deletion:** Requires backend API + Supabase Auth deletion
- **Privacy settings:** Requires backend schema + API

**Verdict:** ❌ **Not feasible without backend changes**

### 2.6 Appearance (Theme, Language)

**Current State:**
- ❌ Not implemented
- ❌ No theme switcher
- ❌ No language selector
- ❌ Hardcoded dark theme

**Proposed Settings:**
- Theme (light/dark/auto)
- Language (currently hardcoded to "en")

**Backend Support:**
- ❌ No theme preference storage
- ❌ No language preference storage
- ❌ No i18n system implemented

**Feasibility:**
- **Theme (frontend-only):** ✅ **Feasible** - Can use `localStorage` + CSS variables
- **Language (frontend-only):** ✅ **Feasible** - Can use `localStorage` + i18n library (would need i18n implementation)
- **Theme (backend-persisted):** ❌ Requires backend schema + API
- **Language (backend-persisted):** ❌ Requires backend schema + API

**Verdict:**
- **Theme (localStorage):** ✅ **Can be added frontend-only** (low effort)
- **Language (localStorage):** ⚠️ **Can be added frontend-only** (medium effort - requires i18n setup)
- **Backend-persisted:** ❌ **Requires backend changes**

---

## 3. Feasible Additions (Effort Assessment)

### 3.1 Low Effort (Frontend-Only)

#### Theme Switcher
**Effort:** Low (2-4 hours)

**Implementation:**
- Add theme state in `SettingsPage` (or Context)
- Store in `localStorage` (`synapse_theme: "dark" | "light" | "auto"`)
- Apply CSS classes based on theme
- Toggle button in Settings

**Requirements:**
- CSS variables for colors
- Theme toggle component
- `localStorage` read/write

**Limitations:**
- Not persisted across devices
- Not synced with backend
- User must set on each device

**Verdict:** ✅ **Can be added now**

#### Feedback Backend Integration
**Effort:** Low (1-2 hours)

**Implementation:**
- Replace `console.log` with Supabase insert
- Create `feedback` table (or use existing)
- Insert feedback on submit

**Requirements:**
- Supabase `feedback` table (or backend API endpoint)
- Update `sendFeedback()` in `settings.api.js`

**Backend Dependency:** ⚠️ **Requires table creation** (but can be done in Supabase dashboard)

**Verdict:** ✅ **Can be added now** (if table exists or can be created)

### 3.2 Medium Effort (Frontend + Minor Backend)

#### Announcements Backend Integration
**Effort:** Medium (3-5 hours)

**Implementation:**
- Create `announcements` table in Supabase
- Replace static data with `supabase.from("announcements").select()`
- Add admin interface (separate task)

**Requirements:**
- Supabase `announcements` table
- Update `fetchAnnouncements()` in `settings.api.js`

**Backend Dependency:** ⚠️ **Requires table creation** (can be done in Supabase)

**Verdict:** ✅ **Can be added now** (if table can be created)

#### Language Selector (Frontend-Only)
**Effort:** Medium (4-8 hours)

**Implementation:**
- Add i18n library (react-i18next or similar)
- Create translation files
- Store language preference in `localStorage`
- Language selector in Settings

**Requirements:**
- i18n library installation
- Translation files for all UI text
- Language selector component

**Limitations:**
- Not persisted across devices
- Requires translation of all UI text

**Verdict:** ⚠️ **Can be added now** (but requires significant translation work)

### 3.3 High Effort (Requires Backend Changes)

#### Account Information Editing
**Effort:** High (8-16 hours)

**Implementation:**
- Backend: `PATCH /profiles/:id` endpoint
- Frontend: Edit form + validation
- Supabase: Direct update or API endpoint

**Requirements:**
- Backend API endpoint for profile updates
- Form validation
- Error handling
- Success feedback

**Backend Dependency:** ✅ **Requires backend API**

**Verdict:** ❌ **Requires backend changes**

#### Password Change
**Effort:** High (6-12 hours)

**Implementation:**
- Supabase Auth API: `supabase.auth.updateUser({ password })`
- Frontend: Password change form (current + new + confirm)
- Validation: Password strength, match confirmation

**Requirements:**
- Supabase Auth API (already available)
- Form validation
- Error handling

**Backend Dependency:** ⚠️ **Supabase Auth API available** (no backend endpoint needed)

**Verdict:** ✅ **Can be added now** (uses Supabase Auth directly)

#### Email Change
**Effort:** High (8-16 hours)

**Implementation:**
- Supabase Auth API: `supabase.auth.updateUser({ email })`
- Email verification flow (new email must be verified)
- Frontend: Email change form + verification step

**Requirements:**
- Supabase Auth API (already available)
- Email verification flow
- Form validation

**Backend Dependency:** ⚠️ **Supabase Auth API available** (no backend endpoint needed)

**Verdict:** ✅ **Can be added now** (uses Supabase Auth directly, but complex flow)

#### Study Preferences
**Effort:** High (12-24 hours)

**Implementation:**
- Backend: New `user_preferences` table
- Backend: `GET /preferences` and `PATCH /preferences` endpoints
- Frontend: Preferences form + API integration

**Requirements:**
- Backend schema design
- Backend API endpoints
- Frontend form + state management

**Backend Dependency:** ✅ **Requires backend changes**

**Verdict:** ❌ **Requires backend changes**

---

## 4. Blockers / Dependencies

### 4.1 Missing Backend APIs

**Profile Updates:**
- ❌ No `PATCH /profiles/:id` endpoint
- ❌ No direct Supabase update (RLS policies may block)
- ✅ Profile read works (`supabase.from("profiles").select()`)

**Preferences:**
- ❌ No preferences table
- ❌ No preferences API endpoints
- ❌ No schema for user preferences

**Feedback:**
- ❌ No feedback table (or not visible in frontend)
- ❌ No feedback API endpoint
- ✅ Can be added via Supabase table creation

**Announcements:**
- ❌ No announcements table (static data only)
- ❌ No announcements API endpoint
- ✅ Can be added via Supabase table creation

### 4.2 Supabase RLS Policies

**Unknown Status:**
- Row-Level Security (RLS) policies on `profiles` table are not visible in frontend
- May block direct Supabase updates even if attempted
- Would require backend API endpoint for updates

**Recommendation:**
- Assume RLS blocks direct updates
- Use backend API endpoints for all profile updates

### 4.3 Auth Integration

**Available:**
- ✅ `supabase.auth.signOut()` - Works (used in logout)
- ✅ `supabase.auth.updateUser()` - Available (not used yet)
- ✅ `supabase.auth.getUser()` - Works (used in profile fetch)

**Password/Email Change:**
- Can use Supabase Auth API directly
- No backend endpoint required
- But requires proper error handling and UX flow

### 4.4 Technical Debt

**Settings API Module:**
- `settings.api.js` has placeholder comments ("Later you can replace these with Supabase calls")
- Feedback and announcements are not production-ready
- No error handling in current implementations

**State Management:**
- No global state for settings/preferences
- Would need Context or prop drilling for theme/language
- Currently no persistence layer for frontend-only settings

---

## 5. Recommendation for Phase A (What to Leave Untouched)

### 5.1 Safe to Improve Now

**✅ Theme Switcher (Frontend-Only)**
- No backend dependency
- Uses `localStorage`
- Low risk
- Immediate user value

**✅ Feedback Backend Integration**
- If `feedback` table can be created in Supabase
- Replace `console.log` with Supabase insert
- Low risk
- Immediate value

**✅ Announcements Backend Integration**
- If `announcements` table can be created in Supabase
- Replace static data with Supabase query
- Low risk
- Immediate value

**✅ Password Change**
- Uses Supabase Auth API directly
- No backend endpoint required
- Medium risk (requires proper UX flow)
- High user value

### 5.2 Must Wait for Backend

**❌ Account Information Editing (Name, etc.)**
- Requires backend API endpoint
- Requires RLS policy review
- High risk if done incorrectly

**❌ Study Preferences**
- Requires backend schema design
- Requires backend API endpoints
- High effort

**❌ Notification Preferences**
- Requires backend schema
- Requires backend API endpoints
- Medium effort

**❌ Privacy & Data Controls**
- Requires backend APIs for data export/deletion
- Requires legal/compliance review
- High risk

**❌ Email Change**
- Can use Supabase Auth, but complex verification flow
- Medium risk
- Should wait for proper UX design

### 5.3 Not Advisable at This Stage

**❌ Language Selector (Full Implementation)**
- Requires i18n library setup
- Requires translation of all UI text
- High effort for limited value
- Better to wait for proper i18n strategy

**❌ Theme Switcher (Backend-Persisted)**
- Frontend-only version is sufficient
- Backend persistence adds complexity without much value
- Multi-device sync not critical for theme

---

## 6. Final Answer

### What Can Safely Be Improved in Settings Now:

1. **Theme Switcher (Frontend-Only)**
   - Store in `localStorage`
   - No backend dependency
   - Low effort, immediate value

2. **Feedback Backend Integration**
   - Create Supabase `feedback` table
   - Replace `console.log` with Supabase insert
   - Low effort, immediate value

3. **Announcements Backend Integration**
   - Create Supabase `announcements` table
   - Replace static data with Supabase query
   - Low effort, immediate value

4. **Password Change**
   - Use Supabase Auth API directly
   - No backend endpoint required
   - Medium effort, high value

### What Must Wait:

1. **Account Information Editing (Name, Avatar, etc.)**
   - Requires backend API endpoint (`PATCH /profiles/:id`)
   - Requires RLS policy review
   - Cannot be done frontend-only

2. **Study Preferences**
   - Requires backend schema design
   - Requires backend API endpoints
   - Cannot be done frontend-only (unless localStorage, which is not recommended)

3. **Notification Preferences**
   - Requires backend schema
   - Requires backend API endpoints
   - Cannot be done frontend-only

4. **Privacy & Data Controls**
   - Requires backend APIs
   - Requires legal/compliance review
   - High risk if done incorrectly

5. **Email Change**
   - Can technically use Supabase Auth, but complex verification flow
   - Should wait for proper UX design and testing

---

## 7. Current Architecture Notes

### 7.1 State Management

**Settings State:**
- No global settings state
- No Context for settings
- All state is component-local
- No persistence layer (except `localStorage` for auth token)

**Profile State:**
- Managed in `App.jsx` (`const [profile, setProfile] = useState(null)`)
- Passed as prop to `SettingsPage`
- Fetched from Supabase on mount
- Not updated after initial fetch (no refresh mechanism)

### 7.2 API Patterns

**Current Pattern:**
- Direct Supabase calls for reads (`supabase.from("profiles").select()`)
- No API abstraction layer for settings
- `settings.api.js` is minimal (console.log only)

**Recommended Pattern (for new features):**
- Use backend API endpoints for all writes
- Use Supabase directly only for reads (if RLS allows)
- Centralize API calls in `settings.api.js`

### 7.3 Component Structure

**Current:**
- `SettingsPage` is a container component
- Child components are self-contained
- No shared state between components
- Simple prop passing

**Scalability:**
- Current structure can handle additions
- Would benefit from Context for theme/language (if added)
- No refactoring needed for basic additions

---

## Conclusion

The Settings page is a minimal implementation with read-only account display, console-logged feedback, and static announcements. The architecture is simple and can accommodate frontend-only additions (theme, localStorage-based preferences) but requires backend changes for any persistent, user-scoped settings.

**Immediate Opportunities:**
- Theme switcher (frontend-only)
- Feedback backend integration (if table can be created)
- Announcements backend integration (if table can be created)
- Password change (uses Supabase Auth directly)

**Must Wait:**
- Account information editing (requires backend API)
- Study preferences (requires backend schema + API)
- Notification preferences (requires backend schema + API)
- Privacy & data controls (requires backend APIs + legal review)

