# Folder Color Rendering Audit

**Date:** 2025-01-27  
**Scope:** Frontend only - diagnostic analysis  
**Goal:** Identify why folder colors are not rendering despite UI and API support

---

## 1️⃣ Data Inspection

### Components Responsible for Rendering Folders

#### A. Library Root & Grid (`LibraryPage.jsx` + `LibraryGrid.jsx`)
- **Location:** `src/modules/Library/LibraryPage.jsx` (lines 588-598)
- **Rendering:** Passes `items` array to `LibraryGrid`
- **Grid Component:** `src/modules/Library/LibraryGrid.jsx` (lines 38-49)
  - Maps over `items` and renders `LibraryCard` for each

#### B. Folder Cards (`LibraryCard.jsx`)
- **Location:** `src/modules/Library/LibraryCard.jsx`
- **Color Usage:**
  - Line 35: `const folderColor = item.folder_color || "#f7c948";` (fallback yellow)
  - Line 48: Folder icon uses `style={{ color: folderColor }}`
  - Line 146: Background uses `${folderColor}22` (22% opacity)
  - Line 232: Badge background uses `${folderColor}33` (33% opacity)
  - Line 233: Badge text uses `folderColor`

#### C. Tree View / Sidebar (`MoveToFolderModal.jsx`)
- **Location:** `src/modules/Library/MoveToFolderModal.jsx`
- **Color Usage:**
  - Line 139: `const color = f.folder_color || fallbackColor(f.title);`
  - Line 150: Folder icon uses `style={{ color }}`
  - Uses fallback color generator if `folder_color` is missing

### Folder Object Shape at Render Time

**Expected Shape (from `LibraryCard.jsx` line 35):**
```javascript
{
  id: "uuid",
  title: "Folder Name",
  is_folder: true,
  folder_color: "#8ab4f8" | null | undefined,  // ⚠️ CRITICAL FIELD
  // ... other fields
}
```

**Verification:** Component expects `item.folder_color` but has fallback `#f7c948` if missing.

---

## 2️⃣ API Consumption

### API Response Inspection

#### A. Folder Creation Endpoint
**File:** `src/modules/Library/apiLibrary.js` (lines 324-340)

**Request:**
```javascript
POST /library/folder
Body: {
  title: "Folder Name",
  parent_id: null,
  color: "#8ab4f8"  // ⚠️ Field name: "color"
}
```

**Response Processing:**
- Line 339: `return mapItemFromApi(json.folder || json);`
- Response is mapped through `mapItemFromApi` function

#### B. Folder Listing Endpoints
**File:** `src/modules/Library/apiLibrary.js` (lines 139-248)

**Endpoints:**
- `GET /library/root?category=all` (line 151)
- `GET /library/children?parent_id={id}&category={cat}` (line 166)

**Response Processing:**
- Line 190: `return (data.items || []).map(mapItemFromApi);`
- Line 218: `return (data.items || []).map(mapItemFromApi);`
- All items pass through `mapItemFromApi`

### State Mapping Analysis

**File:** `src/modules/Library/apiLibrary.js` (lines 86-118)

**Function:** `mapItemFromApi(item)`

**Current Mapping:**
```javascript
const mappedItem = {
    id: item.id,
    title: item.title,
    parent_id: item.parent_id,
    category: item.category,
    // ... 20+ fields ...
    is_done: item.is_done ?? false,
    page_contents: item.page_contents || null,
    // ❌ MISSING: folder_color or color
};
```

**Verdict:** `mapItemFromApi` does **NOT** preserve `color` or `folder_color` from API response.

**Impact:** Even if backend returns `color` or `folder_color`, it is **dropped during mapping**.

---

## 3️⃣ UI Wiring

### Color Picker UI

#### A. Create Folder Modal (`CreateFolderModal.jsx`)
**Location:** `src/modules/Library/CreateFolderModal.jsx`

**Color Picker:**
- Lines 5-16: State and preset colors defined
- Lines 44-67: Color picker UI rendered (preset buttons + custom color input)
- Line 23: Submits `color` field: `onSubmit({ title, color, parent_id })`

**Status:** ✅ Color picker UI exists and is functional

#### B. Folder Creation Handler (`LibraryPage.jsx`)
**Location:** `src/modules/Library/LibraryPage.jsx` (lines 511-526)

**Handler:**
```javascript
const handleCreateFolder = async ({ title, folder_color, parent_id }) => {
    await createLibraryFolder(
        title,
        parent_id ?? currentFolder?.id ?? null,
        folder_color  // ⚠️ Expects "folder_color" but receives "color"
    );
    // ...
};
```

**Issue:** 
- `CreateFolderModal` sends `color` (line 23)
- `handleCreateFolder` expects `folder_color` (line 511)
- **Field name mismatch** - `folder_color` will be `undefined` when modal submits `color`

**Status:** ⚠️ Color picker exists but field name mismatch prevents color from being passed

---

## 4️⃣ Styling Layer

### How Folder Icons/Cards Are Styled

#### A. Folder Icon (`LibraryCard.jsx` line 48)
```javascript
<Folder
    size={28}
    style={{ color: folderColor }}  // ✅ Inline style using folderColor
/>
```

#### B. Icon Background (`LibraryCard.jsx` line 146)
```javascript
style={{
    backgroundColor: isFolder ? `${folderColor}22` : "rgba(255,255,255,0.05)",
}}
```

#### C. Badge Styling (`LibraryCard.jsx` lines 232-233)
```javascript
style={{
    backgroundColor: isFolder ? `${folderColor}33` : "rgba(255,255,255,0.05)",
    color: isFolder ? folderColor : "#ccc",
}}
```

**Verdict:** ✅ Styling layer is correctly wired to use `folderColor` variable.

**Fallback Behavior:**
- Line 35: `const folderColor = item.folder_color || "#f7c948";`
- If `item.folder_color` is missing, defaults to yellow `#f7c948`

**Status:** Styling is correct, but `item.folder_color` is always missing due to mapping issue.

---

## 5️⃣ Interaction Flow

### Full Flow Trace

```
1. User opens Create Folder Modal
   └─> CreateFolderModal.jsx renders color picker
   
2. User selects color (e.g., "#8ab4f8")
   └─> setColor("#8ab4f8") updates state
   
3. User clicks "Create"
   └─> handleSubmit() called (line 18)
   └─> onSubmit({ title: "Folder", color: "#8ab4f8", parent_id: null })
   
4. LibraryPage.handleCreateFolder receives props
   └─> Function signature: ({ title, folder_color, parent_id })
   └─> ⚠️ BREAKPOINT: Receives { color: "#8ab4f8" } but expects { folder_color }
   └─> folder_color = undefined (field name mismatch)
   
5. createLibraryFolder called
   └─> apiLibrary.js line 324: createLibraryFolder(title, parentId, color)
   └─> color parameter = undefined (from step 4)
   └─> POST /library/folder with { color: undefined }
   
6. Backend returns folder object
   └─> Assumed: { id, title, color: undefined, ... }
   
7. mapItemFromApi processes response
   └─> apiLibrary.js lines 86-118
   └─> ⚠️ BREAKPOINT: Does not map color or folder_color field
   └─> Result: { id, title, ..., folder_color: undefined }
   
8. loadItems() refreshes library
   └─> getLibraryItems() called
   └─> API returns items
   └─> mapItemFromApi() called for each item
   └─> ⚠️ BREAKPOINT: folder_color still missing (not mapped)
   
9. LibraryCard renders
   └─> Line 35: const folderColor = item.folder_color || "#f7c948"
   └─> item.folder_color = undefined
   └─> folderColor = "#f7c948" (fallback yellow)
   └─> Folder renders with yellow color (not user-selected color)
```

### Chain Breakpoints

**Breakpoint 1:** Field name mismatch (Step 4)
- **Location:** `LibraryPage.jsx` line 511
- **Issue:** `CreateFolderModal` sends `color`, handler expects `folder_color`
- **Impact:** Color value is lost before API call

**Breakpoint 2:** Missing field mapping (Step 7 & 8)
- **Location:** `apiLibrary.js` lines 86-118 (`mapItemFromApi`)
- **Issue:** Function does not preserve `color` or `folder_color` from API response
- **Impact:** Even if backend returns color, it's dropped during mapping

---

## 6️⃣ Verdict

### Root Cause Summary

**Primary Issue:** `mapItemFromApi` function does not preserve `color` or `folder_color` field from API responses.

**Secondary Issue:** Field name mismatch between `CreateFolderModal` (sends `color`) and `LibraryPage.handleCreateFolder` (expects `folder_color`).

### Diagnosis

**Backend sends color:** ✅ Assumed (API accepts `color` in POST body)  
**Frontend receives color:** ❌ **NO** - Lost during `mapItemFromApi` mapping  
**Color picker UI wired:** ⚠️ **PARTIAL** - UI exists but field name mismatch  
**Styling layer prevents change:** ❌ **NO** - Styling is correctly wired

### Final Verdict

**"Frontend receives color but ignores it"**

The backend likely returns `color` or `folder_color` in API responses, but:
1. `mapItemFromApi` does not map this field to the frontend item object
2. Field name mismatch in folder creation flow prevents color from being sent initially
3. `LibraryCard` correctly expects `item.folder_color` but it's always `undefined`
4. Fallback yellow (`#f7c948`) is always used instead of user-selected color

### Exact Breakpoints

1. **File:** `src/modules/Library/apiLibrary.js`  
   **Line:** 86-118 (`mapItemFromApi` function)  
   **Issue:** Missing `folder_color: item.folder_color || item.color || null` in mapped object

2. **File:** `src/modules/Library/LibraryPage.jsx`  
   **Line:** 511 (`handleCreateFolder` function signature)  
   **Issue:** Expects `folder_color` but receives `color` from modal

---

## 📋 Files Involved

1. `src/modules/Library/apiLibrary.js` - Missing field mapping
2. `src/modules/Library/LibraryPage.jsx` - Field name mismatch
3. `src/modules/Library/CreateFolderModal.jsx` - Sends `color` field
4. `src/modules/Library/LibraryCard.jsx` - Expects `folder_color` (correctly wired)
5. `src/modules/Library/MoveToFolderModal.jsx` - Uses `folder_color` with fallback

---

## ✅ No Design Changes Required

All UI components and styling are correctly implemented. The issue is purely in data flow and field mapping.
