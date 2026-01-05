# Dashboard Recent Uploads Diagnosis Report

**Issue:** Dashboard "Recent Uploads" only shows root-level files, excludes files inside folders.

**Date:** 2025  
**Scope:** Diagnosis only (no fixes)

---

## 1️⃣ Data Flow Inspection

### Dashboard Fetch Logic

**Location:** `src/modules/dashboard/DashboardRecentActivity.jsx` (line 37)

**Function Called:**
```javascript
const allItems = await getLibraryItems("All", null);
```

**Arguments Passed:**
- `uiCategory = "All"`
- `parentId = null`

### getLibraryItems Function Behavior

**Location:** `src/modules/Library/apiLibrary.js` (lines 132-229)

**When `parentId === null`:**
- Executes "ROOT — ALL" branch (line 174)
- Calls backend endpoint: `GET /library/root?category=all`
- **Returns:** Only items where `parent_id IS NULL` (root-level items only)

**When `parentId !== null`:**
- Executes "CHILDREN" branch (line 139)
- Calls backend endpoint: `GET /library/children?parent_id=${parentId}&category=${cat}`
- **Returns:** Only direct children of the specified folder

**Conclusion:** `getLibraryItems("All", null)` is **designed to return only root-level items** by design. It does not return files inside folders.

---

## 2️⃣ Comparison with LibraryPage Behavior

### LibraryPage Fetch Logic

**Location:** `src/modules/Library/LibraryPage.jsx` (line 75)

**Function Called:**
```javascript
const data = await getLibraryItems(filter, folderId);
```

**Arguments Passed:**
- `filter = activeFilter` (e.g., "All", "Lecture", "Notes")
- `folderId = currentFolder?.id || null`

**Key Difference:**
- LibraryPage calls the **same API function** (`getLibraryItems`)
- LibraryPage passes a **dynamic `folderId`** that changes based on user navigation
- When user navigates into a folder, `folderId` becomes that folder's ID
- LibraryPage then calls `/library/children?parent_id=${folderId}` to show files inside that folder

**How LibraryPage Shows Files in Folders:**
1. User clicks a folder → `handleOpen()` sets `currentFolder` (line 189-195)
2. `useEffect` detects `currentFolder?.id` change (line 90)
3. Calls `loadItems(activeFilter, currentFolder?.id)` (line 90)
4. This calls `getLibraryItems(filter, folderId)` with the folder ID
5. Backend returns children of that folder via `/library/children`

**Critical Difference:**
- **LibraryPage:** Shows files **one folder at a time** (user navigates into folders)
- **Dashboard:** Wants **all files across all folders** in a single call
- **Same API, different use case:** LibraryPage is folder-aware navigation, Dashboard needs flat list

---

## 3️⃣ Folder Representation in API Response

### Backend Endpoint Behavior

**Root Endpoint:** `GET /library/root?category=all`
- Returns items where `parent_id IS NULL`
- Items have field: `parent_id: null`
- Folders have: `is_folder: true`
- Files have: `is_folder: false`

**Children Endpoint:** `GET /library/children?parent_id=${folderId}`
- Returns items where `parent_id === folderId`
- Items have field: `parent_id: <folder-uuid>`
- Only returns **direct children** (not recursive)

### Field Names (from mapItemFromApi)

**Location:** `src/modules/Library/apiLibrary.js` (lines 82-126)

**Folder Representation:**
- `is_folder: true` (boolean)
- `kind: "folder"` (string)
- `parent_id: <uuid or null>` (string or null)

**File Representation:**
- `is_folder: false` (boolean)
- `kind: "file"` (string)
- `parent_id: <uuid or null>` (string or null)
  - `null` = root-level file
  - `<uuid>` = file inside folder with that ID

**Files Inside Folders:**
- Have `parent_id` set to their folder's UUID
- Are **excluded** from `/library/root` response (backend filters by `parent_id IS NULL`)
- Are **only included** in `/library/children?parent_id=<folder-id>` response

---

## 4️⃣ Exact Exclusion Point

### Where Files Inside Folders Are Dropped

**Exclusion happens at the BACKEND API level**, not in frontend code.

**Backend Query Logic (inferred from endpoint behavior):**
- `/library/root?category=all` → SQL query filters: `WHERE parent_id IS NULL`
- `/library/children?parent_id=X` → SQL query filters: `WHERE parent_id = X`

**Frontend Code:**
- Dashboard calls `getLibraryItems("All", null)`
- This calls `/library/root?category=all`
- Backend returns only root items (parent_id IS NULL)
- Frontend receives no files with `parent_id !== null`
- Frontend filter (line 40): `filter(item => !item.is_folder && item.kind !== "folder")` only filters out folders from the already-limited root-only response

**Answer:** Files inside folders are excluded because **the backend endpoint `/library/root` only returns items where `parent_id IS NULL`**. The frontend never receives files with `parent_id !== null` in the first place.

---

## 5️⃣ Backend Contract Confirmation

### getLibraryItems() Design Intent

**Based on code analysis:**

1. **`getLibraryItems("All", null)`** → Returns **only root-level items**
   - Endpoint: `/library/root?category=all`
   - Backend contract: Items with `parent_id IS NULL`

2. **`getLibraryItems(category, folderId)`** → Returns **only direct children of folder**
   - Endpoint: `/library/children?parent_id=${folderId}&category=${cat}`
   - Backend contract: Items with `parent_id === folderId`

3. **No endpoint exists** that returns all files regardless of folder location
   - No `/library/all` endpoint
   - No recursive/flat list endpoint
   - No option to bypass `parent_id` filter

### Existing API Capabilities

**What exists:**
- ✅ Get root items: `/library/root?category=all`
- ✅ Get children of specific folder: `/library/children?parent_id=<id>`
- ✅ Get item by ID: `/library/item/<id>` (via `getItemById`)

**What does NOT exist:**
- ❌ Get all files across all folders (flat list)
- ❌ Recursive folder traversal endpoint
- ❌ Option to include nested files in root query

---

## 6️⃣ Root Cause Summary

### Root Cause (One Sentence)

**Files inside folders are excluded because the Dashboard calls `/library/root?category=all`, which by backend design only returns items where `parent_id IS NULL`, and there is no existing API endpoint that returns all files across all folders in a single call.**

### Exact Code Location

**Frontend call:**
- File: `src/modules/dashboard/DashboardRecentActivity.jsx`
- Line: 37
- Code: `await getLibraryItems("All", null)`

**API function routing:**
- File: `src/modules/Library/apiLibrary.js`
- Lines: 174-198
- Code: `GET /library/root?category=all` (when `parentId === null`)

**Backend exclusion:**
- Backend endpoint: `GET /library/root?category=all`
- SQL filter (inferred): `WHERE parent_id IS NULL`
- Result: Only root-level items returned

### Frontend vs Backend

**This is BACKEND-DRIVEN exclusion:**
- Frontend code is correct (calls the intended API)
- Backend API is working as designed (returns root items only)
- No frontend bug or filter issue
- The limitation is in the backend API contract

### Missing Data

**What data is missing:**
- All files where `parent_id !== null` (files inside folders)
- Files nested at any depth (not just direct children)
- Flat list of all user files regardless of folder structure

### LibraryPage Solution

**LibraryPage does NOT solve this:**
- LibraryPage shows files **one folder at a time** (user navigates)
- LibraryPage does not show all files across all folders simultaneously
- LibraryPage uses the same API endpoints with folder navigation
- LibraryPage's approach is folder-aware navigation, not flat list

---

## 7️⃣ Conclusion

**Why only root files appear:**
- Dashboard calls `/library/root?category=all` which only returns root items (`parent_id IS NULL`)
- Backend endpoint is working as designed (not a bug)
- No API endpoint exists that returns all files across all folders

**Is dashboard using wrong API or wrong arguments?**
- Dashboard is using the correct API for root items
- Arguments are correct for root-level query
- The issue is that **no API exists** for "all files regardless of folder"

**Is this fixable frontend-only or requires backend adjustment?**
- **Requires backend adjustment**
- Frontend cannot fix this without a new backend endpoint
- Options:
  1. **Backend:** Add new endpoint `/library/all` that returns all files (flat list, ignores folders)
  2. **Frontend workaround:** Recursively fetch all folders and combine results (inefficient, multiple API calls)
  3. **Backend:** Add query parameter to `/library/root` like `?include_nested=true` (modifies existing endpoint)

**Recommended approach:** Backend should provide a new endpoint or modify existing endpoint to support flat file listing for dashboard use case.

