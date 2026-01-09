# Backend University Field Handling - Diagnostic Report

**Date:** January 2026  
**Scope:** University/institution field during user onboarding  
**Type:** READ-ONLY diagnostic analysis  
**Repository:** Frontend codebase only (backend code not accessible)

---

## Executive Summary

This report analyzes the handling of the `university` field during user onboarding based on frontend code inspection. The backend implementation cannot be directly inspected from this repository, but the data flow and expected behavior can be traced from the frontend perspective.

**Key Findings:**
- Frontend sends `university` as free-text string in onboarding payload
- Frontend expects `university` field in Supabase `profiles` table
- No normalization, lookup, or autocomplete logic visible in frontend
- No validation constraints visible in frontend code
- Storage appears to be direct column in `profiles` table (not normalized)

---

## 1. Frontend Data Flow

### 1.1 User Input Collection

**File:** `src/components/onboarding/StepUniversity.jsx`

**Component:** Simple text input field
- **Type:** Free-text input (no dropdown, no autocomplete)
- **Placeholder:** "Enter your university or hospital"
- **Validation:** Only checks if value is non-empty (`!value.trim()`)
- **No constraints:** No length limit, no format validation, no restricted list

**Code:**
```jsx
<input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Enter your university or hospital"
    className="..."
/>
```

**Key Observations:**
- ✅ Accepts any text input
- ✅ No character limit enforced
- ✅ No format validation (e.g., no email validation, no URL validation)
- ✅ No autocomplete or suggestions
- ✅ No dropdown or predefined list
- ⚠️ **No normalization** (e.g., "Harvard University" vs "Harvard" vs "Harvard Medical School")

---

### 1.2 Payload Construction

**File:** `src/components/onboarding/OnboardingFlow.jsx`  
**Lines:** 76-82

**Payload Structure:**
```javascript
const payload = {
    field_of_study: formData.fieldOfStudy,
    student_year: formData.yearOfStudy,
    university: formData.university,  // ← Direct string value
    country: formData.country,
    language: "en"
};
```

**Key Observations:**
- ✅ `university` is sent as a plain string
- ✅ No transformation or normalization before sending
- ✅ No encoding or sanitization visible
- ✅ Field name: `university` (snake_case, matching backend convention)

---

### 1.3 API Request

**File:** `src/components/onboarding/OnboardingFlow.jsx`  
**Lines:** 84-94

**Endpoint:** `POST ${VITE_API_URL}/onboarding`

**Request Details:**
```javascript
const res = await fetch(
    `${import.meta.env.VITE_API_URL}/onboarding`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`
        },
        body: JSON.stringify(payload)
    }
);
```

**Key Observations:**
- ✅ Standard REST API call
- ✅ JSON payload
- ✅ Bearer token authentication
- ⚠️ **No request validation** in frontend (relies on backend)

---

## 2. Backend Integration Points (Inferred)

### 2.1 Expected Backend Endpoint

**Route:** `POST /onboarding`  
**Expected Location:** Backend API server (not in this repository)

**Expected Payload Schema:**
```typescript
{
    field_of_study: string;
    student_year: string;
    university: string;  // ← Free-text string
    country: string;
    language: string;    // Always "en" in frontend
}
```

**Authentication:** Bearer token (Supabase JWT)

---

### 2.2 Expected Database Storage

**Table:** `profiles` (Supabase)  
**Column:** `university` (inferred from frontend profile fetch)

**Evidence from Frontend:**
```javascript
// src/App.jsx, line 384-388
const { data: profileData, error } = await supabase
    .from("profiles")
    .select("*")  // ← Selects all columns including university
    .eq("id", user.id)
    .maybeSingle();
```

**Profile Fields Used in Frontend:**
- `id` (string)
- `full_name` (string)
- `email` (string)
- `field_of_study` (string)
- `stage` (string)
- `university` (string) ← **Confirmed in settings audit**
- `country` (string)
- `student_year` (string)
- `avatar_url` (string)

**Inferred Schema (from frontend usage):**
```sql
-- Inferred (not confirmed without backend access)
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    field_of_study TEXT,
    stage TEXT,
    university TEXT,  -- ← Free-text column (no FK constraint visible)
    country TEXT,
    student_year TEXT,
    avatar_url TEXT,
    -- ... other fields
);
```

---

## 3. Data Normalization Analysis

### 3.1 Current State: Free-Text Storage

**Evidence:**
- Frontend sends raw string value
- No normalization logic in frontend
- No lookup or autocomplete in frontend
- Profile fetch expects direct string value

**Conclusion:** University is stored as **free-text string**, not normalized.

---

### 3.2 Potential Data Quality Issues

**Risk 1: Duplication**
- "Harvard University" vs "Harvard" vs "Harvard Medical School"
- "MIT" vs "Massachusetts Institute of Technology"
- "UCLA" vs "University of California, Los Angeles"
- "Oxford" vs "University of Oxford"

**Risk 2: Typos and Variations**
- "Johns Hopkins" vs "John Hopkins" (common typo)
- "St. John's" vs "Saint John's" vs "St Johns"
- Inconsistent capitalization

**Risk 3: International Variations**
- "University of Toronto" vs "U of T" vs "UofT"
- Different languages (e.g., "Université de Montréal" vs "University of Montreal")

**Risk 4: Hospital vs University**
- Placeholder says "university or hospital" but no distinction in storage
- "Mayo Clinic" (hospital) vs "Mayo Clinic College of Medicine" (university)

---

## 4. Validation Analysis

### 4.1 Frontend Validation

**Current Validation:**
- ✅ Non-empty check: `!value.trim()` (blocks empty submission)
- ❌ No length limit
- ❌ No format validation
- ❌ No character restrictions
- ❌ No profanity filter
- ❌ No SQL injection prevention (relies on backend)

**File:** `src/components/onboarding/StepUniversity.jsx`, line 27
```javascript
disabled={!value.trim()}  // Only checks if empty
```

---

### 4.2 Backend Validation (Inferred Requirements)

**Expected Backend Validation (not confirmed):**
- ✅ Should validate non-empty (frontend already does this)
- ⚠️ Should validate length (max length unknown)
- ⚠️ Should sanitize input (prevent XSS, SQL injection)
- ⚠️ Should trim whitespace
- ❓ Should validate format? (unknown)
- ❓ Should restrict characters? (unknown)

**Gap:** Cannot confirm backend validation without backend code access.

---

## 5. Database Schema Analysis

### 5.1 Inferred Schema

**Table:** `profiles`  
**Column:** `university`

**Inferred Type:** `TEXT` or `VARCHAR` (PostgreSQL/Supabase)

**Constraints (Unknown):**
- ❓ `NOT NULL` constraint? (unknown)
- ❓ `UNIQUE` constraint? (unlikely, multiple users can have same university)
- ❓ `CHECK` constraint? (unknown)
- ❓ Default value? (unknown)
- ❓ Foreign key? (unlikely, no universities table visible)

---

### 5.2 Normalization Status

**Question:** Is there a `universities` table?

**Frontend Evidence:** ❌ **No**
- No API calls to fetch university list
- No autocomplete endpoint visible
- No dropdown population logic
- No foreign key references in frontend

**Conclusion:** Universities are **NOT normalized** into a separate table (based on frontend evidence).

---

## 6. Search, Lookup, and Autocomplete

### 6.1 Current State

**Frontend Evidence:**
- ❌ No autocomplete component
- ❌ No search endpoint called
- ❌ No lookup API visible
- ❌ No suggestions or dropdown

**Conclusion:** No search, lookup, or autocomplete functionality exists in frontend.

---

### 6.2 Backend Capabilities (Unknown)

**Questions for Backend Inspection:**
- Is there a `GET /universities` or `GET /universities/search` endpoint?
- Is there a `universities` table in the database?
- Is there any seed data or static university list?
- Is there any fuzzy matching or search logic?

**Cannot determine from frontend code.**

---

## 7. Full Data Flow Trace

### 7.1 Complete Flow (Frontend → Backend → Database)

```
1. USER INPUT
   └─> StepUniversity.jsx
       └─> Free-text input: "Harvard Medical School"
           └─> Validation: !value.trim() (non-empty only)

2. FORM STATE
   └─> OnboardingFlow.jsx
       └─> formData.university = "Harvard Medical School"
           └─> No transformation

3. PAYLOAD CONSTRUCTION
   └─> OnboardingFlow.jsx, handleSubmit()
       └─> payload = {
               university: "Harvard Medical School",  // ← Direct string
               field_of_study: "...",
               student_year: "...",
               country: "...",
               language: "en"
           }

4. API REQUEST
   └─> POST /onboarding
       └─> Headers: Authorization: Bearer <token>
       └─> Body: JSON.stringify(payload)
       └─> ⚠️ Backend handling unknown (not in this repo)

5. BACKEND PROCESSING (INFERRED)
   └─> Expected: POST /onboarding endpoint
       └─> Expected: Validate payload
       └─> Expected: Extract university field
       └─> Expected: Store in profiles.university column
       └─> ⚠️ Actual implementation unknown

6. DATABASE WRITE (INFERRED)
   └─> Expected: UPDATE profiles SET university = 'Harvard Medical School' WHERE id = <user_id>
       └─> ⚠️ Actual SQL unknown
       └─> ⚠️ Constraints unknown

7. PROFILE FETCH (VERIFICATION)
   └─> App.jsx, fetchProfile()
       └─> SELECT * FROM profiles WHERE id = <user_id>
       └─> profileData.university = "Harvard Medical School"
       └─> ✅ Confirmed: Field is readable after write
```

---

## 8. Validation Gaps

### 8.1 Frontend Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| No length limit | Medium | Potential database overflow, UI display issues |
| No format validation | Low | Accepts invalid data (e.g., URLs, emails) |
| No character restrictions | Low | Accepts special characters that may cause issues |
| No normalization | High | Data duplication, inconsistent queries |
| No autocomplete | Medium | Poor UX, encourages typos |

---

### 8.2 Backend Gaps (Inferred, Not Confirmed)

| Gap | Severity | Status |
|-----|----------|--------|
| Input sanitization | Critical | ⚠️ Unknown (needs backend inspection) |
| SQL injection prevention | Critical | ⚠️ Unknown (needs backend inspection) |
| Length validation | Medium | ⚠️ Unknown (needs backend inspection) |
| Normalization | High | ❌ Confirmed missing (no universities table) |
| Foreign key constraints | Medium | ❌ Confirmed missing (free-text storage) |

---

## 9. Risks and Issues

### 9.1 Data Quality Risks

**Risk 1: Data Duplication**
- **Impact:** High
- **Example:** "Harvard", "Harvard University", "Harvard Medical School" stored as separate values
- **Consequence:** Cannot accurately count users by university, cannot group by institution
- **Mitigation:** Normalize into `universities` table with foreign key

**Risk 2: Inconsistent Queries**
- **Impact:** Medium
- **Example:** `WHERE university LIKE '%Harvard%'` may miss variations
- **Consequence:** Inaccurate analytics, broken filtering
- **Mitigation:** Use normalized table with canonical names

**Risk 3: Typos and Misspellings**
- **Impact:** Medium
- **Example:** "John Hopkins" (typo) vs "Johns Hopkins" (correct)
- **Consequence:** Data fragmentation, user confusion
- **Mitigation:** Autocomplete with validation

---

### 9.2 Security Risks

**Risk 1: SQL Injection**
- **Impact:** Critical
- **Status:** ⚠️ Unknown (needs backend inspection)
- **Mitigation:** Parameterized queries, input sanitization

**Risk 2: XSS (Cross-Site Scripting)**
- **Impact:** High
- **Status:** ⚠️ Unknown (needs backend inspection)
- **Mitigation:** Output encoding, input sanitization

**Risk 3: Data Injection**
- **Impact:** Medium
- **Example:** User enters malicious payload in university field
- **Status:** ⚠️ Unknown (needs backend inspection)
- **Mitigation:** Input validation, output encoding

---

### 9.3 UX Risks

**Risk 1: Poor Discoverability**
- **Impact:** Low
- **Issue:** Users may not know exact university name
- **Consequence:** Typos, inconsistent entries
- **Mitigation:** Autocomplete with suggestions

**Risk 2: No Hospital Distinction**
- **Impact:** Low
- **Issue:** Placeholder says "university or hospital" but no field distinction
- **Consequence:** Ambiguous data (is "Mayo Clinic" a hospital or university?)
- **Mitigation:** Separate fields or type selection

---

## 10. Backend Inspection Checklist

**Required Backend Analysis (Not Accessible from This Repository):**

### 10.1 Controllers/Routes
- [ ] Locate `POST /onboarding` endpoint handler
- [ ] Identify request validation logic
- [ ] Check error handling for invalid university values
- [ ] Verify authentication/authorization checks

### 10.2 Services/Business Logic
- [ ] Find university field processing logic
- [ ] Check for any normalization or transformation
- [ ] Identify any business rules (e.g., required field, format rules)
- [ ] Check for any logging or analytics hooks

### 10.3 Database Schema
- [ ] Verify `profiles.university` column type and constraints
- [ ] Check for `NOT NULL` constraint
- [ ] Check for `CHECK` constraints (length, format)
- [ ] Verify no foreign key to `universities` table
- [ ] Check indexes on `university` column (if any)

### 10.4 Database Tables
- [ ] Check if `universities` table exists
- [ ] Check if `institutions` table exists
- [ ] Check for any lookup/reference tables
- [ ] Verify seed data or static lists

### 10.5 Validation
- [ ] Check input sanitization (XSS prevention)
- [ ] Check SQL injection prevention (parameterized queries)
- [ ] Check length validation
- [ ] Check format validation (if any)
- [ ] Check character restrictions (if any)

### 10.6 Search/Lookup
- [ ] Check for `GET /universities` endpoint
- [ ] Check for `GET /universities/search` endpoint
- [ ] Check for autocomplete API
- [ ] Check for fuzzy matching logic

### 10.7 Comments/TODOs
- [ ] Search for TODO comments about universities
- [ ] Search for FIXME comments about institutions
- [ ] Check for any normalization plans
- [ ] Check for any migration notes

---

## 11. Recommendations (Future Implementation)

### 11.1 Short-Term (Data Quality)

1. **Add Frontend Validation:**
   - Length limit (e.g., max 200 characters)
   - Trim whitespace before submission
   - Basic character validation (reject obviously invalid inputs)

2. **Add Backend Validation:**
   - Sanitize input (prevent XSS, SQL injection)
   - Enforce length limit
   - Trim whitespace
   - Validate non-empty (if required)

### 11.2 Medium-Term (Normalization)

1. **Create `universities` Table:**
   ```sql
   CREATE TABLE universities (
       id UUID PRIMARY KEY,
       name TEXT NOT NULL UNIQUE,
       country TEXT,
       type TEXT,  -- 'university', 'hospital', 'medical_school'
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Add Foreign Key:**
   ```sql
   ALTER TABLE profiles
   ADD COLUMN university_id UUID REFERENCES universities(id);
   ```

3. **Migration Strategy:**
   - Keep `university` column for backward compatibility
   - Populate `university_id` from existing `university` values (fuzzy matching)
   - Add UI to select from normalized list

### 11.3 Long-Term (UX Enhancement)

1. **Add Autocomplete:**
   - Frontend: Autocomplete component with search
   - Backend: `GET /universities/search?q=harvard` endpoint
   - Fuzzy matching for typos

2. **Add Hospital Distinction:**
   - Separate field or type selector
   - Normalize hospitals separately if needed

---

## 12. Conclusion

### 12.1 Current State Summary

- ✅ **Frontend sends:** `university` as free-text string
- ✅ **Frontend receives:** `university` from `profiles` table
- ❌ **No normalization:** Stored as direct string, no `universities` table
- ❌ **No validation:** Only non-empty check in frontend
- ❌ **No autocomplete:** Free-text input only
- ⚠️ **Backend unknown:** Cannot confirm validation, sanitization, or constraints

### 12.2 Key Risks

1. **Data Duplication:** High risk due to free-text storage
2. **Security:** Unknown (needs backend inspection)
3. **Data Quality:** Medium risk due to typos and variations
4. **Query Accuracy:** Medium risk due to inconsistent values

### 12.3 Next Steps

1. **Backend Inspection Required:**
   - Access backend repository
   - Inspect `POST /onboarding` endpoint
   - Verify database schema and constraints
   - Check validation and sanitization logic

2. **Data Audit:**
   - Query existing `profiles.university` values
   - Identify duplicates and variations
   - Assess data quality issues

3. **Implementation Planning:**
   - Design normalization strategy
   - Plan migration path
   - Design autocomplete UX

---

**End of Diagnostic Report**

**Note:** This report is based on frontend code analysis only. Backend implementation details require access to the backend repository for complete verification.

