# Terms & Privacy Modal Implementation Plan

## PHASE A — DIAGNOSIS

### 1) User Signup / Authentication UI Location

**Routes Involved:**
- **No React Router routes** — Authentication uses local state management in `App.jsx`
- State-driven navigation via `authScreen` state variable:
  - `"landing"` → `LandingPage` component
  - `"signup"` → `SignUp` component
  - `"login"` → `Login` component
  - `"onboarding"` → `OnboardingFlow` component

**Components Involved:**
- **Primary Signup Component:** `src/components/auth/SignUp.jsx`
  - Lines 87-191: Main signup form UI
  - Lines 116-174: Form with email, password, confirm password fields
  - Line 153-173: Submit button
  - Line 176-187: Footer with "Already have an account?" link

- **Routing Logic:** `src/App.jsx`
  - Lines 374-398: Conditional rendering based on `authScreen` state
  - Line 385: SignUp component rendered when `authScreen === "signup"`

**Authentication Method:**
- **Custom UI** (not provider-based OAuth buttons)
- Uses Supabase for backend auth (`supabase.auth.signInWithPassword`)
- Custom signup endpoint: `POST /auth/signup` (line 32 in SignUp.jsx)
- Email/password authentication flow
- Includes OTP verification step (`VerifyOtp` component)

---

### 2) Existing Legal Acceptance Logic

**Result: NONE FOUND**

**Search Results:**
- No `terms`, `privacy`, `legal`, `accept`, `agreement`, or `checkbox` references in auth components
- No legal acceptance checkboxes in `SignUp.jsx`
- No footer notices in `SignUp.jsx` or `Login.jsx`
- No banner components for legal text
- Landing page footer (line 48-50 in `LandingPage.jsx`) only shows copyright, no legal links

**Conclusion:** Zero legal acceptance logic currently exists in the authentication flow.

---

### 3) Existing Modal / Popup / Dialog Components

**Available Components:**

**A) `PopupDialog` Component**
- **File:** `src/components/PopupDialog.jsx`
- **Lines:** 1-73
- **Current Purpose:** Simple confirmation dialogs with OK/Cancel buttons
- **Structure:**
  - Fixed overlay with backdrop (`bg-black/50`)
  - Centered modal card (`bg-void`, rounded-2xl)
  - Title, message, and action buttons
  - Click outside to close
- **Limitations:**
  - Designed for short messages, not scrollable content
  - No close icon (X button) — only action buttons
  - Not suitable for long Terms/Privacy text without modification

**B) Library Modals (Examples)**
- **`RenameModal.jsx`** (`src/modules/Library/RenameModal.jsx`)
  - Lines 40-84: Full-screen overlay pattern
  - Has X close button (line 47-52)
  - ESC key handler (lines 30-37)
  - Click outside to close
  - **Suitable pattern for Terms/Privacy modal**

- **`CreateFolderModal.jsx`** (`src/modules/Library/CreateFolderModal.jsx`)
  - Lines 29-86: Similar overlay pattern
  - Simpler structure, no ESC handler

**C) Other Modals**
- Multiple modal components in `src/modules/` (GenerateSummaryModal, GenerateMCQModal, etc.)
- All follow similar pattern: fixed overlay + centered card

**Recommendation:** 
- **DO NOT reuse `PopupDialog`** — it's too limited for scrollable content
- **DO reuse the modal pattern** from `RenameModal.jsx` as a template
- **Create new reusable component** `LegalModal.jsx` based on RenameModal pattern

---

### 4) Routing for /terms and /privacy

**Result: NO ROUTES EXIST**

**Current Routing Setup:**
- **File:** `src/App.jsx`
- **Lines:** 554-609: React Router Routes definition
- **Routes Defined:**
  - `/` → redirects to `/tutor`
  - `/library`, `/library/:fileId`, `/library/:fileId/page/:pageNumber`
  - `/tutor`, `/flashcards`, `/mcq`, `/summaries`, `/osce`, `/oral`, `/planner`, `/analytics`, `/settings`
  - `*` → catch-all redirects to `/tutor`

**Missing Routes:**
- ❌ No `/terms` route
- ❌ No `/privacy` route

**Conclusion:** Terms and Privacy routes need to be added if we want standalone pages. However, for the modal approach, routes are **NOT required** — content can be inline or imported.

---

## PHASE B — IMPLEMENTATION PLAN

### REQUIREMENTS SUMMARY

- ✅ No checkbox (passive acceptance text only)
- ✅ Text: "By signing up, you agree to our Terms and Privacy Policy"
- ✅ "Terms" and "Privacy Policy" are clickable links
- ✅ Clicking opens floating popup modal (no navigation)
- ✅ Modal contains full scrollable text
- ✅ Subtle X close icon (top-right)
- ✅ Reusable for both Terms and Privacy
- ✅ Does not block signup flow
- ✅ Works on desktop and mobile

---

### STEP-BY-STEP IMPLEMENTATION PLAN

#### **STEP 1: Create Reusable Legal Modal Component**

**File to Create:** `src/components/LegalModal.jsx`

**Purpose:** Reusable modal for displaying Terms or Privacy Policy content

**Structure:**
```jsx
<LegalModal
  open={boolean}
  type="terms" | "privacy"
  onClose={() => void}
/>
```

**Features:**
- Fixed overlay (`fixed inset-0 bg-black/60 backdrop-blur-sm`)
- Centered modal card (max-width: 90vw, max-height: 90vh on mobile)
- X close button (top-right, subtle styling)
- Scrollable content area (max-height with overflow-y-auto)
- ESC key handler (close on Escape)
- Click outside to close (backdrop click)
- Responsive (mobile-friendly padding and sizing)

**Content Strategy:**
- Option A (Recommended): Import static content from separate files
  - `src/components/legal/TermsContent.jsx`
  - `src/components/legal/PrivacyContent.jsx`
- Option B: Inline content in LegalModal with conditional rendering
- Option C: Fetch from routes (NOT recommended — adds complexity)

**File Structure:**
```
src/components/
  ├── LegalModal.jsx          (NEW)
  └── legal/
      ├── TermsContent.jsx    (NEW - static content)
      └── PrivacyContent.jsx  (NEW - static content)
```

---

#### **STEP 2: Add Acceptance Text to SignUp Component**

**File to Modify:** `src/components/auth/SignUp.jsx`

**Location:** After the form, before the "Already have an account?" footer
- **Insert after line 174** (after submit button)
- **Insert before line 176** (before footer div)

**Text to Add:**
```jsx
<p className="text-xs text-muted text-center mt-4">
  By signing up, you agree to our{" "}
  <button
    type="button"
    onClick={() => setLegalModal({ open: true, type: "terms" })}
    className="text-teal hover:text-teal-neon hover:underline"
  >
    Terms
  </button>
  {" "}and{" "}
  <button
    type="button"
    onClick={() => setLegalModal({ open: true, type: "privacy" })}
    className="text-teal hover:text-teal-neon hover:underline"
  >
    Privacy Policy
  </button>
  .
</p>
```

**State Management:**
- Add state: `const [legalModal, setLegalModal] = useState({ open: false, type: null });`
- Import LegalModal component
- Render LegalModal conditionally

---

#### **STEP 3: Implement LegalModal Component**

**File:** `src/components/LegalModal.jsx`

**Key Implementation Details:**

**A) Modal Structure:**
```jsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
     onClick={onClose}>
  <div className="w-full max-w-3xl max-h-[90vh] bg-[#0d0f13] rounded-2xl border border-white/10 shadow-xl relative mx-4"
       onClick={(e) => e.stopPropagation()}>
    {/* X close button */}
    {/* Title */}
    {/* Scrollable content */}
  </div>
</div>
```

**B) ESC Key Handler:**
```jsx
useEffect(() => {
  if (!open) return;
  const handler = (e) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [open, onClose]);
```

**C) Content Loading:**
- Import `TermsContent` and `PrivacyContent` components
- Conditionally render based on `type` prop
- Wrap content in scrollable div: `className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 pb-6"`

**D) Accessibility:**
- Focus trap (optional but recommended)
- ARIA labels: `role="dialog"`, `aria-labelledby`, `aria-modal="true"`
- Focus management: Focus X button on open, return focus on close

---

#### **STEP 4: Create Terms and Privacy Content Components**

**Files to Create:**
- `src/components/legal/TermsContent.jsx`
- `src/components/legal/PrivacyContent.jsx`

**Structure:**
- Simple functional components returning JSX
- Typography: headings (h2, h3), paragraphs, lists
- Styling: Match app dark theme (`text-white`, `text-muted`)
- Content: Placeholder text initially, to be replaced with actual legal content

**Example Structure:**
```jsx
export default function TermsContent() {
  return (
    <div className="prose prose-invert max-w-none">
      <h2>Terms of Service</h2>
      <p>Last updated: [Date]</p>
      {/* Content sections */}
    </div>
  );
}
```

---

#### **STEP 5: State Flow**

**SignUp Component State:**
```jsx
const [legalModal, setLegalModal] = useState({ 
  open: false, 
  type: null // "terms" | "privacy" | null
});
```

**Open Flow:**
1. User clicks "Terms" or "Privacy Policy" link
2. `setLegalModal({ open: true, type: "terms" })` or `type: "privacy"`
3. LegalModal renders with appropriate content
4. User can scroll, close via X, ESC, or backdrop click

**Close Flow:**
1. User clicks X, presses ESC, or clicks backdrop
2. `setLegalModal({ open: false, type: null })`
3. Modal unmounts
4. User remains on signup page (no navigation)

**No Blocking:**
- Signup form remains functional while modal is open
- User can close modal and continue signing up
- No validation dependency on modal interaction

---

#### **STEP 6: Component List**

**New Files:**
1. `src/components/LegalModal.jsx` — Reusable modal component
2. `src/components/legal/TermsContent.jsx` — Terms of Service content
3. `src/components/legal/PrivacyContent.jsx` — Privacy Policy content

**Modified Files:**
1. `src/components/auth/SignUp.jsx` — Add acceptance text and modal integration

**No Changes Required:**
- `src/App.jsx` — No routing changes needed
- `src/components/auth/Login.jsx` — No changes
- `src/components/auth/VerifyOtp.jsx` — No changes
- Any other auth components

---

#### **STEP 7: Accessibility Considerations**

**Required:**
- ✅ ESC key closes modal (useEffect with keydown listener)
- ✅ Click outside (backdrop) closes modal
- ✅ X button is keyboard accessible (tab navigation)
- ✅ ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

**Optional (Recommended):**
- Focus trap: Trap focus inside modal when open
- Focus return: Return focus to trigger button on close
- Focus management: Auto-focus X button on open

**Implementation:**
- Use `useRef` for modal container
- Use `useEffect` to manage focus on mount/unmount
- Consider `react-focus-lock` library (optional, adds dependency)

---

#### **STEP 8: What NOT to Touch**

**DO NOT Modify:**
- ❌ `src/App.jsx` routing logic (lines 554-609)
- ❌ `src/components/auth/Login.jsx` — Login doesn't need legal acceptance
- ❌ `src/components/auth/VerifyOtp.jsx` — OTP flow is separate
- ❌ `src/components/auth/AuthInput.jsx` — Input component is fine
- ❌ `src/lib/supabaseClient.js` — Auth client is fine
- ❌ Signup form validation logic (lines 14-25 in SignUp.jsx)
- ❌ Signup API call logic (lines 29-70 in SignUp.jsx)
- ❌ OTP verification flow (lines 74-85 in SignUp.jsx)

**Safe to Modify:**
- ✅ `src/components/auth/SignUp.jsx` — Only add UI elements, no logic changes
- ✅ Create new components (LegalModal, TermsContent, PrivacyContent)

---

### SAFE-TO-SHIP CHECKLIST

**Functionality:**
- [ ] Acceptance text appears below signup form
- [ ] "Terms" link is clickable and opens modal
- [ ] "Privacy Policy" link is clickable and opens modal
- [ ] Modal displays correct content based on link clicked
- [ ] Modal is scrollable for long content
- [ ] X button closes modal
- [ ] ESC key closes modal
- [ ] Click outside (backdrop) closes modal
- [ ] Signup form remains functional with modal open
- [ ] User can close modal and continue signing up
- [ ] No navigation occurs when opening/closing modal

**Responsive Design:**
- [ ] Modal works on desktop (max-width constraint)
- [ ] Modal works on mobile (responsive padding, max-height)
- [ ] Text is readable on small screens
- [ ] Close button is accessible on mobile

**Accessibility:**
- [ ] ESC key handler works
- [ ] Keyboard navigation works (tab to X button)
- [ ] ARIA attributes present
- [ ] Focus management (optional but recommended)

**Code Quality:**
- [ ] No console errors
- [ ] No TypeScript/ESLint errors
- [ ] Components are reusable
- [ ] No hardcoded content (content in separate files)
- [ ] Follows existing modal patterns (RenameModal style)

**Testing Scenarios:**
- [ ] Open Terms modal from signup page
- [ ] Open Privacy modal from signup page
- [ ] Close modal via X button
- [ ] Close modal via ESC key
- [ ] Close modal via backdrop click
- [ ] Scroll long content in modal
- [ ] Submit signup form with modal open (should work)
- [ ] Submit signup form after closing modal (should work)
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation

---

### IMPLEMENTATION ORDER

1. **Create LegalModal component** (Step 3)
2. **Create TermsContent and PrivacyContent** (Step 4)
3. **Add acceptance text to SignUp** (Step 2)
4. **Test all close methods** (ESC, X, backdrop)
5. **Test responsive design** (mobile/desktop)
6. **Verify accessibility** (keyboard navigation, ARIA)
7. **Final testing** (all scenarios from checklist)

---

### ESTIMATED COMPLEXITY

- **LegalModal Component:** Medium (reuse existing pattern)
- **Content Components:** Low (static JSX)
- **SignUp Integration:** Low (add text + state)
- **Total:** ~2-3 hours of development time

---

### RISK ASSESSMENT

**Low Risk:**
- ✅ No auth logic changes
- ✅ No routing changes
- ✅ Pure UI addition
- ✅ Reuses existing modal patterns
- ✅ No backend dependencies

**Potential Issues:**
- ⚠️ Long content may need optimization (lazy loading if content is very large)
- ⚠️ Focus trap may need library dependency (optional)
- ⚠️ Content needs to be provided (legal text)

---

## SUMMARY

**Current State:**
- Signup UI: `src/components/auth/SignUp.jsx`
- No legal acceptance logic exists
- No `/terms` or `/privacy` routes
- Reusable modal pattern available (`RenameModal.jsx`)

**Implementation:**
- Create `LegalModal.jsx` (reusable)
- Create `TermsContent.jsx` and `PrivacyContent.jsx` (static content)
- Add acceptance text to `SignUp.jsx` (UI only, no logic changes)
- Modal opens on link click, closes via X/ESC/backdrop
- No routing required (modal approach)

**Safety:**
- Zero auth logic modifications
- Zero routing changes
- Pure UI addition
- Follows existing patterns

---

**END OF IMPLEMENTATION PLAN**

