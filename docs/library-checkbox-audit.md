# Library Card Checkbox Integration Audit

**Date:** 2025-01-XX  
**Purpose:** Assess feasibility of adding checkbox to library cards for `is_done` status without breaking UX or state flow.

---

## 1️⃣ Library Card Anatomy

### File Path
**`src/modules/Library/LibraryCard.jsx`**

### Props Received
```javascript
{
  item,              // File/folder object
  onOpen,            // Opens file/folder
  onDelete,          // Deletes item
  onMoveToFolder,    // Moves to folder
  onChangeCategory,  // Changes category
  onRename           // Renames item
}
```

### Current Triggers

**Open File/Folder:**
- Title click: `onClick={handleOpen}` (line 195)
- Primary button: `onClick={(e) => { e.stopPropagation(); handleOpen(); }}` (line 218-220)
- Card container: Has `cursor-pointer` class but **NO onClick handler** (line 112)

**Context Menu:**
- MoreVertical button (top-right): `onClick={(e) => { e.stopPropagation(); setMenuOpen(...) }}` (line 129-132)
- Menu dropdown: `z-[50]` positioned `absolute right-0 mt-2` (line 140)
- All menu items use `e.stopPropagation()` to prevent card click

**Selection State:**
- ❌ **NO existing selectable state**
- ❌ **NO checkbox implementation**
- ❌ **NO multi-select functionality**

### Click Handling
- **Centralized:** All handlers are in LibraryCard component
- **Event propagation:** Menu buttons use `e.stopPropagation()` correctly
- **Card container:** Currently has no onClick, only `cursor-pointer` class

---

## 2️⃣ State Ownership

### Data Location
**Local component state in `LibraryPage.jsx`:**

```javascript
const [items, setItems] = useState([]);  // Line 30
```

### Data Fetching
- **No React Query / SWR / global store**
- **Direct API calls:** `getLibraryItems()` from `apiLibrary.js`
- **Fetch triggers:**
  - On mount
  - When filter changes (`activeFilter`)
  - When folder changes (`currentFolder?.id`)
  - Polling every 4s when files are processing

### Caching
- ❌ **NO caching** - fresh fetch on every filter/folder change
- ✅ **Ref tracking:** `itemsRef.current` used for polling (avoids re-render loops)
- ✅ **Optimistic updates:** Supported via `setItems()` after mutations

### Refetch Frequency
- **On demand:** Filter change, folder navigation
- **Polling:** 4s intervals when files are processing
- **After mutations:** Delete, rename, move, create folder

---

## 3️⃣ Extensibility Check

### Current Item Structure
**`mapItemFromApi()` in `apiLibrary.js` (lines 86-130):**

```javascript
{
  id, title, parent_id, category, size_bytes, file_url, signed_url,
  mime_type, depth, is_folder, kind, uiCategory, page_count,
  ocr_pages_count, preview_text, created_at, updated_at,
  ingestion_status, total_pages, rendered_pages,
  render_state, file_render_state
}
```

### Can Add `is_done`?
✅ **YES - Fully extensible**

**Reasons:**
1. **No strict TypeScript:** JavaScript only, no prop type validation
2. **Flexible mapping:** `mapItemFromApi()` can add new fields easily
3. **Backend-agnostic:** Frontend accepts any fields from API response
4. **No breaking changes:** Adding optional field won't break existing code

**Implementation:**
```javascript
// In mapItemFromApi() - line 115
is_done: item.is_done ?? false,  // Add this line
```

---

## 4️⃣ Interaction Conflicts

### Existing Interactions

**Drag/Drop:**
- ❌ **NO drag/drop implementation found**

**Long-Press:**
- ❌ **NO long-press handlers**

**Right-Click:**
- ✅ **Handled:** MoreVertical menu button (top-right)
- ✅ **Uses `e.stopPropagation()`** - won't conflict

**Mobile Tap:**
- ✅ **Standard onClick handlers** - no special mobile logic

### Potential Conflicts

**Checkbox Click → File Opens:**
⚠️ **RISK EXISTS** - Card has `cursor-pointer` but no onClick handler currently

**Solution:**
- Add checkbox with `e.stopPropagation()` (like menu button)
- OR: Add card onClick handler that ignores checkbox clicks
- OR: Place checkbox in top-left corner (away from title/button clicks)

**Menu Button:**
- ✅ **Safe:** Already uses `e.stopPropagation()` (line 130)
- ✅ **Top-right position:** Won't conflict with top-left checkbox

---

## 5️⃣ Visual Hierarchy

### Current Layout

**Card Structure (top to bottom):**
1. **Header row** (line 116):
   - Left: Icon (48x48px, `w-12 h-12`)
   - Right: MoreVertical menu button (16px icon, padding)
2. **Title** (line 193): Full width, clickable
3. **Meta badges** (line 202): Category badge + date
4. **Primary button** (line 217): Full width "Open" button

### Available Space

**Top-Left:**
- ✅ **Available:** Icon is 48x48px, checkbox (20-24px) can fit above/beside
- ✅ **No overlays:** Only icon container

**Top-Right:**
- ⚠️ **Occupied:** MoreVertical menu button
- ❌ **Not recommended:** Would crowd menu button

### Recommended Placement

**Option 1: Top-Left (Recommended)**
- Position: Above or beside icon container
- Size: 20-24px checkbox
- Z-index: Same layer as icon (no overlay needed)
- Visual: Subtle, doesn't interfere with icon

**Option 2: Top-Right (Alternative)**
- Position: Left of MoreVertical button
- Size: 20-24px checkbox
- Spacing: 8-12px gap from menu button
- Risk: Slightly crowded, but acceptable

### Dark Mode Compatibility
- ✅ **Full dark mode:** All components use dark theme
- ✅ **Checkbox styling:** Can use teal accent color (matches existing theme)
- ✅ **Contrast:** White/teal on dark background works well

---

## 6️⃣ Persistence Assumptions

### Current User Metadata
❌ **NO user-specific metadata per file**

**Current fields are:**
- File properties (title, size, mime_type)
- Processing state (render_state, ocr_status)
- Category (shared, not user-specific)
- Folder hierarchy (shared, not user-specific)

### Partial Loading Support
✅ **YES - Already supported**

**Evidence:**
- `mapItemFromApi()` handles missing fields with `??` fallbacks (line 108-114)
- `render_state` can be null/undefined (line 113)
- Frontend gracefully handles missing data

**Example:**
```javascript
ingestion_status: item.ingestion_status || (isFolder ? null : "ready")
```

### Adding `is_done` Persistence

**Frontend Readiness:**
✅ **Ready** - Can add to `mapItemFromApi()`:
```javascript
is_done: item.is_done ?? false,
```

**State Management:**
✅ **Ready** - Local state in LibraryPage can hold `is_done`:
- Items array already mutable via `setItems()`
- Optimistic updates supported
- No global state conflicts

**API Integration:**
⚠️ **Backend required:**
- Backend must return `is_done` in API response
- Backend must support PATCH to update `is_done`
- Frontend can call existing API patterns

---

## ✅ Summary & Recommendations

### Feasibility: **HIGH** ✅

### Safe Implementation Path

1. **Add checkbox to top-left corner** (above icon)
   - Size: 20-24px
   - Use `e.stopPropagation()` on checkbox click
   - Style: Teal accent, matches dark theme

2. **Extend `mapItemFromApi()`** to include `is_done`:
   ```javascript
   is_done: item.is_done ?? false,
   ```

3. **Add checkbox handler** in LibraryCard:
   ```javascript
   const handleCheckboxChange = (e) => {
     e.stopPropagation();
     // Call onToggleDone?.(item.id, !item.is_done)
   };
   ```

4. **Add prop to LibraryCard:**
   ```javascript
   onToggleDone?: (itemId: string, isDone: boolean) => void
   ```

5. **Update LibraryPage state** optimistically:
   ```javascript
   const handleToggleDone = (itemId, isDone) => {
     setItems(prev => prev.map(item => 
       item.id === itemId ? { ...item, is_done: isDone } : item
     ));
     // Then call API to persist
   };
   ```

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Checkbox click opens file | Use `e.stopPropagation()` |
| Visual crowding | Place top-left, subtle styling |
| State sync issues | Optimistic update + API call |
| Missing backend field | Default to `false` with `??` |

### No Breaking Changes Required
- ✅ No prop type changes needed
- ✅ No existing functionality affected
- ✅ Backward compatible (defaults to `false`)

---

## Files to Modify

1. **`src/modules/Library/LibraryCard.jsx`**
   - Add checkbox UI (top-left)
   - Add `onToggleDone` prop
   - Add checkbox click handler

2. **`src/modules/Library/apiLibrary.js`**
   - Add `is_done` to `mapItemFromApi()` (line 115)

3. **`src/modules/Library/LibraryPage.jsx`**
   - Add `handleToggleDone` function
   - Pass `onToggleDone` to LibraryGrid → LibraryCard

4. **`src/modules/Library/LibraryGrid.jsx`**
   - Pass `onToggleDone` prop through to LibraryCard

---

**Conclusion:** Checkbox can be safely added to top-left corner with minimal risk. Existing architecture supports extensibility, and interaction conflicts can be avoided with proper event handling.
