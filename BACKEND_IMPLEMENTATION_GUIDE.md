# Backend Implementation Guide: Library API `render_state` Fix

## 🎯 Objective

Ensure all library API endpoints **always** return `render_state` in the expected nested structure for every file item.

---

## 📍 Endpoints to Fix

The frontend calls these endpoints (from `src/modules/Library/apiLibrary.js`):

1. **`GET /library/root?category=all`** (Line 142)
2. **`GET /library/root?category={category}`** (Line 151)
3. **`GET /library/children?parent_id={id}&category={cat}`** (Line 132)
4. **`GET /library/item/:id`** (Line 164) - Optional but recommended

---

## ✅ Required Response Structure

### Expected Shape (Per File Item)

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "file.pdf",
      "is_folder": false,
      "render_state": {
        "status": "completed",
        "ocr_status": "completed"
      },
      // ... other properties
    }
  ]
}
```

### Critical Requirements

1. **`render_state` MUST be nested** (not flat properties)
2. **Property names MUST be exact:**
   - `status` (not `render_status`, `state`, etc.)
   - `ocr_status` (not `ocrState`, `ocrStatus`, etc.)
3. **Values MUST be exact strings:**
   - `"completed"` (not `"done"`, `"finished"`, `true`, etc.)
   - `"pending"` (for default fallback)
   - `"failed"` (if applicable)
   - `"skipped"` (if applicable)
4. **`render_state` MUST exist** (never `null` or `undefined`)

---

## 🛠️ Implementation Patterns

### Pattern 1: SQL with LEFT JOIN (Recommended)

If using raw SQL or an ORM with joins:

```sql
SELECT 
  li.id,
  li.title,
  li.is_folder,
  li.category,
  li.size_bytes,
  li.file_url,
  li.signed_url,
  li.mime_type,
  li.depth,
  li.page_count,
  li.ocr_pages_count,
  li.preview_text,
  li.created_at,
  li.updated_at,
  -- JOIN render state
  COALESCE(frs.status, 'pending') as render_status,
  COALESCE(frs.ocr_status, 'pending') as render_ocr_status
FROM library_items li
LEFT JOIN file_render_state frs ON frs.file_id = li.id
WHERE li.parent_id = :parentId
  AND (li.category = :category OR :category = 'all')
  AND li.is_folder = false
ORDER BY li.created_at DESC;
```

**Then in your response builder:**

```javascript
const items = queryResult.map(row => ({
  id: row.id,
  title: row.title,
  is_folder: row.is_folder,
  // ... other properties
  render_state: {
    status: row.render_status || 'pending',
    ocr_status: row.render_ocr_status || 'pending'
  }
}));
```

---

### Pattern 2: ORM with Eager Loading (Sequelize Example)

```javascript
const items = await LibraryItem.findAll({
  where: {
    parent_id: parentId || null,
    ...(category !== 'all' && { category }),
  },
  include: [
    {
      model: FileRenderState,
      as: 'renderState',
      required: false, // LEFT JOIN
    },
  ],
  order: [['created_at', 'DESC']],
});

// Map to response format
const responseItems = items.map(item => {
  const renderState = item.renderState || {
    status: 'pending',
    ocr_status: 'pending',
  };

  return {
    id: item.id,
    title: item.title,
    is_folder: item.is_folder,
    // ... other properties
    render_state: {
      status: renderState.status || 'pending',
      ocr_status: renderState.ocr_status || 'pending',
    },
  };
});
```

---

### Pattern 3: Separate Query + Merge (If JOIN is not possible)

```javascript
// 1. Fetch library items
const items = await LibraryItem.findAll({
  where: { /* ... */ },
});

// 2. Fetch render states in batch
const fileIds = items
  .filter(item => !item.is_folder)
  .map(item => item.id);

const renderStates = await FileRenderState.findAll({
  where: { file_id: fileIds },
});

// 3. Create lookup map
const renderStateMap = new Map(
  renderStates.map(rs => [rs.file_id, rs])
);

// 4. Merge into response
const responseItems = items.map(item => {
  if (item.is_folder) {
    return {
      id: item.id,
      title: item.title,
      is_folder: true,
      // ... no render_state for folders
    };
  }

  const renderState = renderStateMap.get(item.id) || {
    status: 'pending',
    ocr_status: 'pending',
  };

  return {
    id: item.id,
    title: item.title,
    is_folder: false,
    // ... other properties
    render_state: {
      status: renderState.status || 'pending',
      ocr_status: renderState.ocr_status || 'pending',
    },
  };
});
```

---

## 📝 Code Examples by Framework

### Express.js + Sequelize

**File:** `src/modules/Library/library.controller.js` or `src/routes/library.routes.js`

```javascript
// GET /library/root
router.get('/root', async (req, res) => {
  try {
    const { category = 'all' } = req.query;

    const items = await LibraryItem.findAll({
      where: {
        parent_id: null,
        ...(category !== 'all' && { category }),
      },
      include: [
        {
          model: FileRenderState,
          as: 'renderState',
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const responseItems = items.map(item => {
      const baseItem = {
        id: item.id,
        title: item.title,
        is_folder: item.is_folder,
        category: item.category,
        size_bytes: item.size_bytes,
        file_url: item.file_url,
        signed_url: item.signed_url,
        mime_type: item.mime_type,
        depth: item.depth,
        page_count: item.page_count,
        ocr_pages_count: item.ocr_pages_count,
        preview_text: item.preview_text,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };

      // Add render_state for files only
      if (!item.is_folder) {
        const renderState = item.renderState || {
          status: 'pending',
          ocr_status: 'pending',
        };

        baseItem.render_state = {
          status: renderState.status || 'pending',
          ocr_status: renderState.ocr_status || 'pending',
        };

        // Log for verification
        console.info('[LIBRARY_API] render_state attached', {
          fileId: item.id,
          status: baseItem.render_state.status,
          ocr_status: baseItem.render_state.ocr_status,
        });
      }

      return baseItem;
    });

    res.json({ items: responseItems });
  } catch (error) {
    console.error('[LIBRARY_API] Error fetching root items:', error);
    res.status(500).json({ error: 'Failed to fetch library items' });
  }
});

// GET /library/children
router.get('/children', async (req, res) => {
  try {
    const { parent_id, category = 'all' } = req.query;

    const items = await LibraryItem.findAll({
      where: {
        parent_id: parent_id || null,
        ...(category !== 'all' && { category }),
      },
      include: [
        {
          model: FileRenderState,
          as: 'renderState',
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const responseItems = items.map(item => {
      const baseItem = {
        id: item.id,
        title: item.title,
        is_folder: item.is_folder,
        // ... other properties
      };

      if (!item.is_folder) {
        const renderState = item.renderState || {
          status: 'pending',
          ocr_status: 'pending',
        };

        baseItem.render_state = {
          status: renderState.status || 'pending',
          ocr_status: renderState.ocr_status || 'pending',
        };

        console.info('[LIBRARY_API] render_state attached', {
          fileId: item.id,
          status: baseItem.render_state.status,
          ocr_status: baseItem.render_state.ocr_status,
        });
      }

      return baseItem;
    });

    res.json({ items: responseItems });
  } catch (error) {
    console.error('[LIBRARY_API] Error fetching children:', error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});
```

---

### NestJS + TypeORM

**File:** `src/modules/library/library.service.ts`

```typescript
@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryItem)
    private libraryItemRepo: Repository<LibraryItem>,
    @InjectRepository(FileRenderState)
    private renderStateRepo: Repository<FileRenderState>,
  ) {}

  async getRootItems(category: string = 'all'): Promise<LibraryItemResponse[]> {
    const queryBuilder = this.libraryItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.renderState', 'renderState')
      .where('item.parent_id IS NULL');

    if (category !== 'all') {
      queryBuilder.andWhere('item.category = :category', { category });
    }

    const items = await queryBuilder
      .orderBy('item.created_at', 'DESC')
      .getMany();

    return items.map(item => this.mapItemToResponse(item));
  }

  async getChildren(parentId: string, category: string = 'all'): Promise<LibraryItemResponse[]> {
    const queryBuilder = this.libraryItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.renderState', 'renderState')
      .where('item.parent_id = :parentId', { parentId });

    if (category !== 'all') {
      queryBuilder.andWhere('item.category = :category', { category });
    }

    const items = await queryBuilder
      .orderBy('item.created_at', 'DESC')
      .getMany();

    return items.map(item => this.mapItemToResponse(item));
  }

  private mapItemToResponse(item: LibraryItem): LibraryItemResponse {
    const response: LibraryItemResponse = {
      id: item.id,
      title: item.title,
      is_folder: item.is_folder,
      category: item.category,
      size_bytes: item.size_bytes,
      file_url: item.file_url,
      signed_url: item.signed_url,
      mime_type: item.mime_type,
      depth: item.depth,
      page_count: item.page_count,
      ocr_pages_count: item.ocr_pages_count,
      preview_text: item.preview_text,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    // Add render_state for files only
    if (!item.is_folder) {
      const renderState = item.renderState || {
        status: 'pending',
        ocr_status: 'pending',
      };

      response.render_state = {
        status: renderState.status || 'pending',
        ocr_status: renderState.ocr_status || 'pending',
      };

      console.info('[LIBRARY_API] render_state attached', {
        fileId: item.id,
        status: response.render_state.status,
        ocr_status: response.render_state.ocr_status,
      });
    }

    return response;
  }
}
```

---

### Raw SQL (PostgreSQL/MySQL)

**File:** `src/modules/Library/library.service.js`

```javascript
async getRootItems(category = 'all') {
  const query = `
    SELECT 
      li.*,
      COALESCE(frs.status, 'pending') as render_status,
      COALESCE(frs.ocr_status, 'pending') as render_ocr_status
    FROM library_items li
    LEFT JOIN file_render_state frs ON frs.file_id = li.id
    WHERE li.parent_id IS NULL
      ${category !== 'all' ? `AND li.category = $1` : ''}
    ORDER BY li.created_at DESC
  `;

  const params = category !== 'all' ? [category] : [];
  const rows = await db.query(query, params);

  return rows.map(row => {
    const item = {
      id: row.id,
      title: row.title,
      is_folder: row.is_folder,
      category: row.category,
      size_bytes: row.size_bytes,
      file_url: row.file_url,
      signed_url: row.signed_url,
      mime_type: row.mime_type,
      depth: row.depth,
      page_count: row.page_count,
      ocr_pages_count: row.ocr_pages_count,
      preview_text: row.preview_text,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Add render_state for files only
    if (!row.is_folder) {
      item.render_state = {
        status: row.render_status || 'pending',
        ocr_status: row.render_ocr_status || 'pending',
      };

      console.info('[LIBRARY_API] render_state attached', {
        fileId: item.id,
        status: item.render_state.status,
        ocr_status: item.render_state.ocr_status,
      });
    }

    return item;
  });
}
```

---

## 🔍 Verification Checklist

After implementing, verify:

- [ ] **Network Tab:** Open browser DevTools → Network → Load library page
- [ ] **Response Structure:** Check `GET /library/root` response
- [ ] **Every File Item:** Has `render_state` object (not `null`)
- [ ] **Nested Structure:** `render_state.status` and `render_state.ocr_status` exist
- [ ] **Property Names:** Exact strings `"status"` and `"ocr_status"` (not camelCase)
- [ ] **Values:** Exact strings `"completed"`, `"pending"`, `"failed"`, or `"skipped"`
- [ ] **Folders:** Do NOT have `render_state` (only files)
- [ ] **Console Logs:** See `[LIBRARY_API] render_state attached` logs
- [ ] **UI Behavior:** Library UI shows "Ready" when both statuses are "completed"

---

## ⚠️ Common Pitfalls to Avoid

### ❌ Wrong: Flat Structure
```json
{
  "id": "...",
  "status": "completed",        // WRONG - not nested
  "ocr_status": "completed"    // WRONG - not nested
}
```

### ✅ Correct: Nested Structure
```json
{
  "id": "...",
  "render_state": {
    "status": "completed",
    "ocr_status": "completed"
  }
}
```

---

### ❌ Wrong: Null render_state
```json
{
  "id": "...",
  "render_state": null  // WRONG - must be object
}
```

### ✅ Correct: Default Object
```json
{
  "id": "...",
  "render_state": {
    "status": "pending",
    "ocr_status": "pending"
  }
}
```

---

### ❌ Wrong: Wrong Property Names
```json
{
  "render_state": {
    "render_status": "completed",  // WRONG - should be "status"
    "ocrState": "completed"        // WRONG - should be "ocr_status"
  }
}
```

### ✅ Correct: Exact Property Names
```json
{
  "render_state": {
    "status": "completed",
    "ocr_status": "completed"
  }
}
```

---

### ❌ Wrong: Wrong Enum Values
```json
{
  "render_state": {
    "status": "done",           // WRONG - should be "completed"
    "ocr_status": "finished"    // WRONG - should be "completed"
  }
}
```

### ✅ Correct: Exact Enum Values
```json
{
  "render_state": {
    "status": "completed",
    "ocr_status": "completed"
  }
}
```

---

## 📊 Database Schema Reference

Assuming your `file_render_state` table has:

```sql
CREATE TABLE file_render_state (
  id UUID PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES library_items(id),
  status VARCHAR(50) NOT NULL,  -- 'pending', 'running', 'completed', 'failed', 'skipped'
  ocr_status VARCHAR(50) NOT NULL,  -- 'pending', 'running', 'completed', 'failed', 'skipped'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(file_id)
);
```

---

## 🎯 Success Criteria

After implementation:

1. ✅ **Network tab shows `render_state` for every file**
2. ✅ **`render_state.status === "completed"`** (when ready)
3. ✅ **`render_state.ocr_status === "completed"`** (when ready)
4. ✅ **UI immediately shows "Ready"** (no refresh needed)
5. ✅ **No frontend code changes required**
6. ✅ **No polling glitches**
7. ✅ **No reliance on counters**

---

## 📝 Logging Requirement

Add this log when attaching `render_state`:

```javascript
console.info('[LIBRARY_API] render_state attached', {
  fileId: item.id,
  status: item.render_state.status,
  ocr_status: item.render_state.ocr_status,
});
```

This allows verification that the API is working correctly.

---

## 🚀 Next Steps

1. **Locate backend files:**
   - `library.controller.js` or `library.routes.js`
   - `library.service.js` or `library.service.ts`

2. **Identify response builders:**
   - Functions that build items for `GET /library/root`
   - Functions that build items for `GET /library/children`

3. **Add JOIN or separate query:**
   - Join `file_render_state` table
   - Or fetch render states separately and merge

4. **Normalize response:**
   - Always include `render_state` object for files
   - Use default `{ status: "pending", ocr_status: "pending" }` if missing

5. **Add logging:**
   - Log when `render_state` is attached

6. **Test:**
   - Check Network tab in browser
   - Verify response structure
   - Confirm UI shows "Ready" when appropriate

---

**End of Implementation Guide**

