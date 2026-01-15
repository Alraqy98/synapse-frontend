# FileViewer AI Tools Panel - Implementation Plan

**Date:** 2025-01-27  
**Based on:** FileViewer AI Tools Panel UX Audit  
**Scope:** Frontend-only (React + Tailwind)  
**Approach:** Two-phase implementation (Visual Enhancement → Retractability)

---

## Phase 1: AI Tools Visual Enhancement

### Goal
Make AI Tools section more discoverable without changing dimensions or layout.

---

### Step 1.1: Identify Target Component

**File to Modify:**
- `src/modules/Library/FileViewer.jsx`

**Exact Section:**
- Lines 1225-1346 (AI Tools Section)
- Specifically: Header button (lines 1227-1236)

**Component Structure:**
```jsx
<div className="border-b border-white/5">
  <button onClick={() => setAiToolsCollapsed((x) => !x)}>
    {/* Header content */}
  </button>
  {!aiToolsCollapsed && (
    {/* Tools content */}
  )}
</div>
```

---

### Step 1.2: Visual Enhancement Changes

**Target Element:** Header button (line 1227)

**Tailwind Class Modifications (High-Level):**

1. **Add Icon to Header**
   - Import: `Sparkles` (already imported, line 13)
   - Placement: Before "AI Tools" text
   - Icon styling: `text-teal`, `size={16}`

2. **Enhance Header Background**
   - Current: Inherits from parent
   - Change to: `bg-gradient-to-r from-teal/10 to-transparent`
   - Add: `bg-[#0f1115]` (darker background for contrast)

3. **Add Accent Border**
   - Current: `border-b border-white/5`
   - Add: `border-l-4 border-teal` (left accent border)
   - Keep: `border-b border-white/5` (bottom separator)

4. **Improve Text Contrast**
   - Current: `text-xs font-medium text-white/70`
   - Change to: `text-xs font-semibold text-white`
   - Subtitle: `text-[10px] text-teal/60` (from `text-muted`)

5. **Add Hover Enhancement**
   - Current: `hover:bg-white/5`
   - Change to: `hover:bg-teal/10 hover:border-teal/60`

6. **Add Subtle Pulse Animation** (Optional)
   - CSS class: Custom animation for header
   - Trigger: When `aiToolsCollapsed === true` (to draw attention)
   - Pattern: Subtle glow pulse on icon

**No State Changes Required** (uses existing `aiToolsCollapsed`)

---

### Step 1.3: Add State Indicators (Optional Enhancement)

**Location:** Inside header button, after subtitle

**Additions:**
- Active page indicator: `Page {activePage}` (if page-aware mode)
- Connection status dot: Small green dot (always active in FileViewer)
- Badge: "AI" or "Page-aware" badge

**State Dependencies:**
- `activePage` (already exists, line 126)
- No new state needed

---

### Step 1.4: Testing Checklist (Phase 1)

**Visual Verification:**
- [ ] Header has teal accent border on left
- [ ] Sparkles icon visible and colored teal
- [ ] Text contrast improved (white vs white/70)
- [ ] Hover state shows teal background
- [ ] Gradient background visible
- [ ] No layout shift or width changes
- [ ] Works in both collapsed and expanded states

**Functional Verification:**
- [ ] Toggle still works (collapse/expand)
- [ ] AI Tools actions still functional
- [ ] No console errors
- [ ] Dark mode compatibility (if applicable)

---

## Phase 2: Right Sidebar Retractability

### Goal
Allow right sidebar to collapse/expand, giving more space to document viewer.

---

### Step 2.1: Add New State Variable

**File:** `src/modules/Library/FileViewer.jsx`

**Location:** With other UI state (around line 77, after `toolsCollapsed`)

**New State:**
```javascript
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
```

**Scope:** Component-level (FileViewer)
**Default:** `false` (sidebar visible by default)
**Reasoning:** Users expect sidebar to be visible initially

**State Management:**
- No localStorage persistence needed (session-only preference)
- If persistence desired later: `useState(() => localStorage.getItem('sidebarCollapsed') === 'true')`

---

### Step 2.2: Modify Sidebar Container

**File:** `src/modules/Library/FileViewer.jsx`

**Target Element:** Right sidebar wrapper (line 1224)

**Current:**
```jsx
<div className="w-[400px] bg-[#1a1d24] flex flex-col border-l border-white/5 overflow-hidden">
```

**Changes Required:**

1. **Make Width Conditional**
   - Current: `w-[400px]` (fixed)
   - Change to: `${sidebarCollapsed ? 'w-0' : 'w-[400px]'}`
   - Add responsive: `md:w-[400px]` for mobile safety

2. **Add Transition**
   - Add: `transition-all duration-300 ease-in-out`
   - Purpose: Smooth width animation

3. **Preserve Overflow**
   - Keep: `overflow-hidden` (clips content when collapsed)

4. **Optional: Hide Border When Collapsed**
   - Conditional: `${sidebarCollapsed ? 'border-l-0' : 'border-l border-white/5'}`

**Result:**
```jsx
<div className={`
  ${sidebarCollapsed ? 'w-0' : 'w-[400px]'}
  md:w-[400px] md:${sidebarCollapsed ? 'w-0' : 'w-[400px]'}
  transition-all duration-300 ease-in-out
  bg-[#1a1d24]
  flex flex-col
  ${sidebarCollapsed ? 'border-l-0' : 'border-l border-white/5'}
  overflow-hidden
`}>
```

**Note:** Tailwind doesn't support conditional classes directly, so use template literal or `cn()` utility.

---

### Step 2.3: Add Toggle Button

**Decision: Toggle Button Placement**

**Option Analysis:**

1. **Floating Button on Right Edge** (RECOMMENDED)
   - **Position:** `absolute` or `fixed` on right edge of viewport
   - **When Expanded:** Button on left edge of sidebar
   - **When Collapsed:** Button on right edge of screen
   - **Pros:** Always accessible, doesn't interfere with content
   - **Cons:** Overlay positioning complexity

2. **Header Button** (ALTERNATIVE)
   - **Position:** Top-right of left panel header
   - **Pros:** Consistent with other controls
   - **Cons:** Less discoverable, competes with other header buttons

3. **Panel Edge Button** (ALTERNATIVE)
   - **Position:** Left edge of sidebar (when expanded)
   - **Pros:** Contextual, clear relationship to sidebar
   - **Cons:** Hidden when collapsed, requires hover state

**Recommended: Floating Button on Right Edge**

**Reasoning:**
- Always visible (even when sidebar collapsed)
- Clear visual relationship to sidebar
- Doesn't interfere with document or chat
- Touch-friendly placement (right edge)

**Implementation Details:**

**Location:** Outside sidebar container, as sibling to left panel and sidebar

**Structure:**
```jsx
<div className="h-screen overflow-hidden flex bg-[#0f1115]">
  {/* Left Panel */}
  <div className="flex-1 ...">
    ...
  </div>

  {/* Right Sidebar */}
  <div className={`... ${sidebarCollapsed ? 'w-0' : 'w-[400px]'}`}>
    ...
  </div>

  {/* Toggle Button - NEW */}
  <button className="...">
    {/* Icon */}
  </button>
</div>
```

**Button Styling (High-Level):**
- Position: `fixed right-0 top-1/2 -translate-y-1/2` (or `absolute` if parent is relative)
- Size: `w-10 h-10` (touch-friendly, 40px)
- Background: `bg-[#1a1d24]` with `border border-white/10`
- Icon: `ChevronRight` when expanded, `ChevronLeft` when collapsed
- Z-index: `z-50` (above sidebar)
- Hover: `hover:bg-teal/10 hover:border-teal`

**Icon Logic:**
- When `sidebarCollapsed === false`: Show `ChevronRight` (indicates "collapse")
- When `sidebarCollapsed === true`: Show `ChevronLeft` (indicates "expand")

**Icon Import:**
- Already imported: `ChevronDown`, `ChevronUp` (line 18-19)
- Add: `ChevronRight`, `ChevronLeft` to imports

**Button Position Adjustment:**
- When expanded: `right-[400px]` (positioned at left edge of sidebar)
- When collapsed: `right-0` (positioned at right edge of screen)
- Transition: `transition-all duration-300` (smooth movement)

---

### Step 2.4: Handle Content Visibility

**Issue:** When sidebar width is `w-0`, content is clipped but still rendered.

**Options:**

1. **Keep Content Rendered** (RECOMMENDED)
   - **Pros:** State preserved, no re-mounting, instant expand
   - **Cons:** Content still in DOM (minimal performance impact)
   - **Action:** No changes needed (overflow-hidden handles clipping)

2. **Conditionally Render** (NOT RECOMMENDED)
   - **Cons:** State loss, scroll reset, re-initialization
   - **Action:** Do not implement

**Decision:** Keep content rendered, rely on `overflow-hidden` for clipping.

**No Changes Required** - Current structure already supports this.

---

### Step 2.5: Mobile/Tablet Responsiveness

**File:** `src/modules/Library/FileViewer.jsx`

**Target:** Sidebar width classes (Step 2.2)

**Breakpoint Strategy:**

**Desktop (> 1024px):**
- Sidebar: `w-[400px]` when expanded, `w-0` when collapsed
- Toggle: Always visible

**Tablet (768px - 1024px):**
- Sidebar: `md:w-[400px]` when expanded, `md:w-0` when collapsed
- Toggle: Always visible
- Consider: Sidebar might be too wide on smaller tablets

**Mobile (< 768px):**
- **Option A:** Hide sidebar by default (`w-0`), show as overlay when toggled
- **Option B:** Full-width sidebar when expanded (`w-full`), hidden when collapsed
- **Option C:** Keep desktop behavior (may be cramped)

**Recommended: Option B (Full-width on mobile)**

**Implementation:**
```jsx
className={`
  ${sidebarCollapsed ? 'w-0' : 'w-full md:w-[400px]'}
  transition-all duration-300 ease-in-out
  ...
`}
```

**Toggle Button on Mobile:**
- Keep same position (right edge)
- Ensure touch target: `min-w-[44px] min-h-[44px]` (iOS HIG)

---

### Step 2.6: State Preservation Verification

**State to Preserve:**

1. **Chat Messages** (`chatMessages` state)
   - ✅ Preserved: Component stays mounted
   - ✅ No action needed

2. **Chat Input** (`chatInput` state)
   - ✅ Preserved: Component stays mounted
   - ✅ No action needed

3. **Session ID** (`fileSessionId`)
   - ✅ Preserved: Stored in localStorage + state
   - ✅ No action needed

4. **AI Tools Collapsed State** (`aiToolsCollapsed`)
   - ✅ Preserved: Component stays mounted
   - ✅ No action needed

5. **Scroll Position** (chat messages container)
   - ✅ Preserved: DOM element stays mounted
   - ⚠️ **Potential Issue:** Scroll position might reset if container reflows
   - **Mitigation:** Use `scrollTop` ref to save/restore if needed

6. **Tools Collapsed State** (`toolsCollapsed`)
   - ✅ Preserved: Component stays mounted
   - ✅ No action needed

**No Additional Code Required** - React state preservation is automatic when component stays mounted.

---

### Step 2.7: Testing Checklist (Phase 2)

**Functional Testing:**
- [ ] Toggle button visible and clickable
- [ ] Sidebar collapses smoothly (300ms transition)
- [ ] Sidebar expands smoothly
- [ ] Document viewer expands when sidebar collapses
- [ ] Document viewer contracts when sidebar expands
- [ ] No layout shift or jump during transition
- [ ] Toggle button moves with sidebar edge

**State Preservation:**
- [ ] Chat messages remain after collapse/expand
- [ ] Chat input value preserved
- [ ] Scroll position in chat maintained (if applicable)
- [ ] AI Tools collapsed state preserved
- [ ] Session ID unchanged
- [ ] No re-initialization of chat component

**Visual Testing:**
- [ ] Toggle button icon changes correctly (ChevronRight ↔ ChevronLeft)
- [ ] Button position transitions smoothly
- [ ] Sidebar border hides when collapsed
- [ ] No content visible when collapsed (overflow-hidden working)
- [ ] Background color transitions smoothly

**Responsive Testing:**
- [ ] Desktop (> 1024px): Sidebar 400px when expanded
- [ ] Tablet (768-1024px): Sidebar 400px when expanded
- [ ] Mobile (< 768px): Sidebar full-width when expanded
- [ ] Toggle button touch-friendly on mobile (44x44px minimum)
- [ ] No horizontal scroll on any viewport

**Edge Cases:**
- [ ] Rapid toggle clicks (prevent animation conflicts)
- [ ] Toggle while AI Tools section is expanded
- [ ] Toggle while chat is actively typing
- [ ] Toggle during page navigation
- [ ] Browser resize during collapse/expand
- [ ] iPad Safari safe-area handling
- [ ] Dark mode compatibility

**Performance:**
- [ ] No console errors
- [ ] No memory leaks (check React DevTools)
- [ ] Smooth 60fps animation (check browser DevTools)
- [ ] No unnecessary re-renders (React DevTools Profiler)

---

## Implementation Order

### Phase 1 First (Visual Enhancement)
1. Modify header button styling
2. Add icon and accent border
3. Test visual changes
4. Commit: "Enhance AI Tools header visibility"

### Phase 2 Second (Retractability)
1. Add `sidebarCollapsed` state
2. Modify sidebar width classes
3. Add toggle button
4. Test collapse/expand functionality
5. Test state preservation
6. Test responsive breakpoints
7. Commit: "Add retractable right sidebar"

---

## Files to Modify

### Single File Modification:
- `src/modules/Library/FileViewer.jsx`

**Sections to Modify:**
1. **Imports** (line 18-19): Add `ChevronRight`, `ChevronLeft`
2. **State** (line 77): Add `sidebarCollapsed` state
3. **Header Button** (line 1227): Visual enhancements
4. **Sidebar Container** (line 1224): Conditional width + transition
5. **Root Container** (line 1007): Add toggle button as sibling

**No New Files Required**

---

## Edge Cases to Test Before Pushing

### Critical Edge Cases:

1. **Rapid Toggle Clicks**
   - **Issue:** Animation might conflict if user clicks rapidly
   - **Test:** Click toggle 10 times rapidly
   - **Expected:** Smooth animation, no jank, final state correct

2. **Sidebar Collapse During Chat Message Send**
   - **Issue:** Chat input might lose focus or state
   - **Test:** Type message, collapse sidebar mid-typing, expand
   - **Expected:** Input value preserved, focus maintained

3. **Page Navigation During Collapse**
   - **Issue:** Active page change might cause layout issues
   - **Test:** Collapse sidebar, navigate to next page, expand
   - **Expected:** Smooth transition, page renders correctly

4. **Browser Resize During Animation**
   - **Issue:** Responsive breakpoints might conflict with animation
   - **Test:** Start collapse animation, resize browser window
   - **Expected:** Animation completes smoothly, layout adapts

5. **iPad Safari Safe Area**
   - **Issue:** Fixed toggle button might overlap safe area
   - **Test:** iPad Safari, check toggle button position
   - **Expected:** Button respects safe-area-inset-right

6. **Long Chat History**
   - **Issue:** Scroll position might reset when sidebar expands
   - **Test:** Scroll to bottom of long chat, collapse, expand
   - **Expected:** Scroll position maintained (or gracefully restored)

7. **AI Tools Expanded + Sidebar Collapsed**
   - **Issue:** AI Tools content might be visible when it shouldn't be
   - **Test:** Expand AI Tools, collapse sidebar
   - **Expected:** AI Tools content hidden (overflow-hidden working)

8. **Mobile Keyboard Open**
   - **Issue:** Toggle button might be hidden behind keyboard
   - **Test:** Mobile device, open chat input, keyboard appears
   - **Expected:** Toggle button still accessible (or gracefully hidden)

9. **PDF.js Canvas During Transition**
   - **Issue:** Canvas might re-render or resize incorrectly
   - **Test:** View PDF, collapse sidebar, check canvas
   - **Expected:** Canvas maintains aspect ratio, no re-render

10. **Multiple File Opens**
   - **Issue:** Sidebar state might persist across file changes
   - **Test:** Open file A, collapse sidebar, open file B
   - **Expected:** Sidebar state resets to default (or persists as designed)

---

## Rollback Plan

### If Issues Arise:

**Phase 1 Rollback:**
- Revert header button styling changes
- Remove icon and accent border
- Restore original text colors

**Phase 2 Rollback:**
- Remove `sidebarCollapsed` state
- Restore fixed `w-[400px]` width
- Remove toggle button
- Remove transition classes

**Git Strategy:**
- Commit Phase 1 separately from Phase 2
- Use descriptive commit messages
- Tag commits for easy rollback

---

## Success Criteria

### Phase 1 Complete When:
- ✅ AI Tools header is visually more prominent
- ✅ No layout shifts or width changes
- ✅ All existing functionality works
- ✅ Visual changes pass design review

### Phase 2 Complete When:
- ✅ Sidebar collapses/expands smoothly
- ✅ Document viewer expands/contracts correctly
- ✅ All state preserved (chat, session, scroll)
- ✅ Responsive breakpoints work
- ✅ No console errors or warnings
- ✅ All edge cases tested and passing

---

## Notes for Code Review

### What Reviewers Should Check:

1. **No Breaking Changes:**
   - All existing props/state preserved
   - No API changes
   - No component unmounting

2. **Performance:**
   - Smooth animations (60fps)
   - No unnecessary re-renders
   - No memory leaks

3. **Accessibility:**
   - Toggle button has aria-label
   - Keyboard navigation works
   - Focus management correct

4. **Responsive Design:**
   - Mobile breakpoints tested
   - Touch targets adequate (44x44px)
   - No horizontal scroll

5. **State Management:**
   - State preserved correctly
   - No state leaks between files
   - localStorage usage appropriate (if added)

---

## Estimated Implementation Time

- **Phase 1 (Visual Enhancement):** 1-2 hours
- **Phase 2 (Retractability):** 3-4 hours
- **Testing & Edge Cases:** 2-3 hours
- **Total:** 6-9 hours

---

## Next Steps After Implementation

1. **User Testing:**
   - Gather feedback on discoverability
   - Test toggle button placement
   - Validate mobile experience

2. **Optional Enhancements:**
   - Persist sidebar state in localStorage
   - Add keyboard shortcut (e.g., `Cmd/Ctrl + B`)
   - Add animation preferences (reduce motion)

3. **Analytics:**
   - Track sidebar collapse/expand usage
   - Monitor AI Tools engagement
   - Measure discoverability improvement
