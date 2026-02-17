# Concept Layer Readiness - Executive Summary

**Risk Level**: ⚠️ **MEDIUM**

---

## Quick Answer

**Can we add concept layer to Performance Mentor?**

**YES** - Frontend is ready, **BUT** blocked by missing backend data.

---

## Readiness Matrix

| Component | Status | Blocker |
|-----------|--------|---------|
| **Data Availability** | ❌ NOT READY | Questions lack `concept_tags` |
| **Component Architecture** | ✅ READY | Modular, extensible |
| **State Management** | ✅ READY | Clean injection pattern |
| **UX Scalability** | ⚠️ MODERATE | Needs collapsible UI |

---

## What's Missing

### Backend Data (CRITICAL)

**Questions currently have**:
```javascript
{
  id,
  question,
  options,
  source_file_id,      // ✅
  source_page_numbers  // ✅
}
```

**Questions need**:
```javascript
{
  concept_tags: [],    // ❌ MISSING
  concept_id: string,  // ❌ MISSING
  bloom_level: string, // ❌ MISSING
  difficulty: number   // ❌ MISSING
}
```

**Backend endpoint needs**:
```
GET /ai/mcq/users/me/performance

Response needs:
{
  concept_breakdown: [
    { concept, accuracy, correct, total }
  ],
  weakest_concepts: [
    { concept, accuracy }
  ]
}
```

---

## Component Architecture (EXCELLENT)

**Current Structure**:
```
MCQPerformanceMentor
  ├── Key Signals Grid      (existing)
  ├── Insights              (existing)
  ├── Suggestions           (existing)
  ├── Longitudinal Performance (existing)
  └── [Concept Performance]   ← CAN ADD HERE
```

**Pattern Established**:
```javascript
{shouldShowConcepts && (
  <ConceptPerformance 
    breakdown={conceptBreakdown} 
    analysis={analysis} 
  />
)}
```

**No refactors needed** ✅

---

## State Injection (CLEAN)

**Option 1**: Extend existing endpoint
```javascript
// Backend adds concept_breakdown to response
// Frontend automatically receives it (no code change)
```

**Option 2**: New hook
```javascript
const { conceptBreakdown } = useConceptPerformance(deckId);

<MCQPerformanceMentor 
  concepts={conceptBreakdown}  // ← NEW PROP
/>
```

**Both options follow established patterns** ✅

---

## UX Concern (MODERATE)

**Current finished screen**: 900-1,600px tall  
**With concept section**: 1,170-1,930px tall

**Risk**: Information overload

**Solution**: Collapsible section

```javascript
<button onClick={() => setExpanded(!expanded)}>
  Concept Breakdown {expanded ? <ChevronUp /> : <ChevronDown />}
</button>

{expanded && <ConceptGrid />}
```

---

## Implementation Path

### Phase 1: Backend (BLOCKER)
1. Add `concept_tags` to questions
2. Create concept aggregation logic
3. Extend `/performance` endpoint

### Phase 2: Frontend (2-3 days)
1. Create `ConceptPerformance.jsx` (~70 lines)
2. Add to mentor (5 lines)
3. Implement collapsible UI

---

## Code Changes Required

**Minimal**:

```javascript
// MCQPerformanceMentor.jsx (5 lines added)

export default function MCQPerformanceMentor({ 
  analysis, 
  overview,
  conceptBreakdown  // ← NEW
}) {
  const shouldShowConcepts = conceptBreakdown?.concepts?.length >= 3;
  
  return (
    <div>
      {/* existing sections */}
      
      {shouldShowConcepts && (
        <ConceptPerformance breakdown={conceptBreakdown} />  // ← NEW
      )}
    </div>
  );
}
```

**New File**: `ConceptPerformance.jsx` (~70 lines)

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Missing backend data | 🔴 HIGH | Backend team adds concept tags |
| UX overwhelm | 🟡 MEDIUM | Collapsible UI (default collapsed) |
| Component coupling | 🟢 LOW | Already modular |
| Performance impact | 🟢 LOW | O(n) computation |

---

## Recommendation

**Proceed when backend ready**.

Frontend is structurally sound and can accept concept data with minimal changes (5-line prop addition + new sub-component).

**Critical path**: Backend must add concept metadata to questions and extend performance endpoint.

**UX safeguard**: Implement collapsible section to prevent information overload.

---

**Full Audit**: See `CONCEPT_LAYER_READINESS_AUDIT.md` for detailed analysis.
