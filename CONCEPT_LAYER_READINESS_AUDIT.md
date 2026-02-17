# MCQ Frontend Concept Layer Readiness Audit

**Date**: February 2026  
**Type**: READ-ONLY Structural Assessment  
**Goal**: Determine readiness for introducing concept-level performance intelligence

---

## PHASE 1 — DATA FLOW AUDIT

### Question Object Structure

**Location**: `MCQDeckView.jsx` line 113, 210  
**Source**: `apiMCQ.getMCQQuestions(deckId)`

**Current Question Schema** (from demo data and code analysis):

```javascript
{
  id: string,                        // ✅ Present
  question: string,                  // ✅ Present
  options: string[],                 // ✅ Present
  correct_option_letter: string,     // ✅ Present
  options_full: [{                   // ✅ Present
    letter: string,
    text: string,
    is_correct: boolean,
    explanation: string
  }],
  
  // Source metadata (PRESENT):
  source_file_id: string,            // ✅ Line 785
  source_file_title: string,         // ✅ Line 786
  source_page_numbers: string[],     // ✅ Line 787
  
  // Concept metadata (ABSENT):
  concept_tags: string[],            // ❌ NOT PRESENT
  concept_id: string,                // ❌ NOT PRESENT
  topic: string,                     // ❌ NOT PRESENT
  category: string,                  // ❌ NOT PRESENT
  bloom_level: string,               // ❌ NOT PRESENT
  difficulty: number                 // ❌ NOT PRESENT
}
```

**Verdict**: ❌ **Questions lack concept-level metadata**

---

### Answer Object Structure

**Location**: `MCQDeckView.jsx` lines 228-236, 397-407  
**Storage**: Component-local state, keyed by `questionId`

**Current Answer Schema**:

```javascript
answers[questionId] = {
  selectedText: string,              // ✅ Present
  selectedLetter: string,            // ✅ Present
  isCorrect: boolean,                // ✅ Present
  correctLetter: string,             // ✅ Present
  explanationSelected: string,       // ✅ Present
  timeSpent: number,                 // ✅ Present (seconds)
  explainAll: boolean                // ✅ Present
}
```

**Linked to Question**: ✅ Yes, via `questionId` key  
**Access to Question Object**: ✅ Yes, `questions` array available in `analyzeAttempt()` call (line 152)

**Verdict**: ✅ **Answer structure is adequate, can be enriched with question metadata**

---

### Analytics Response Structure

**Location**: `useUserPerformanceOverview.js` line 28  
**Endpoint**: `GET /ai/mcq/users/me/performance`

**Current Analytics Schema**:

```javascript
{
  totals: {
    answers: number,
    correct: number,
    incorrect: number
  },
  
  weakest_file: {
    file_id: string,
    file_title: string,
    accuracy: number
  },
  
  weakest_page: {
    file_id: string,
    file_title: string,
    page_number: number,
    accuracy: number
  },
  
  analytics: {
    seven_day_improvement_delta: number,
    cross_deck_context: {
      file_accuracy_historical: number
    }
  }
}
```

**Concept-Level Data**: ❌ **NOT PRESENT**

**Missing for Concept Layer**:
- `concept_breakdown: []` - Performance by concept
- `weakest_concepts: []` - Bottom N concepts
- `concept_improvement: {}` - Concept-level deltas
- `concept_tags: {}` - Concept taxonomy

---

### Data Flow to Performance Mentor

**Analysis Input** (`performanceAnalysis.js` line 29):
```javascript
analyzeAttempt({ 
  stats,      // ✅ Aggregate stats only
  answers,    // ✅ Answer state objects
  questions,  // ✅ Full question objects
  progress    // ✅ Backend progress
})
```

**Analysis Output** (`performanceAnalysis.js` line 195):
```javascript
{
  summary: string,
  signals: { /* time-based metrics */ },
  insights: [{ title, detail, severity }],
  suggestions: [{ title, detail }]
}
```

**Mentor Props** (`MCQPerformanceMentor.jsx` line 172):
```javascript
<MCQPerformanceMentor 
  analysis={analysis}     // ✅ Current attempt analysis
  overview={overview}     // ✅ Cross-deck analytics
/>
```

**Verdict**: ✅ **Data flows through clean pipeline, extensible for concept data**

---

## PHASE 2 — MENTOR ARCHITECTURE AUDIT

### Component Structure Analysis

**File**: `MCQPerformanceMentor.jsx` (286 lines)  
**Architecture**: Modular, section-based rendering

**Current Sections**:
1. **Header** (lines 183-187) - Summary text
2. **Key Signals Grid** (lines 189-226) - 4-column stats
3. **Insights** (lines 228-249) - Conditional, array-driven
4. **Suggestions** (lines 251-269) - Conditional, array-driven
5. **Longitudinal Performance** (lines 271-274) - Conditional sub-component
6. **Empty State** (lines 276-282) - Fallback

**Conditional Rendering Pattern**:
```javascript
{shouldShowLongitudinal && (
    <LongitudinalPerformance overview={overview} analysis={analysis} />
)}
```

**Sub-Component Pattern** (`LongitudinalPerformance`, lines 39-135):
- Accepts props: `{ overview, analysis }`
- Self-contained with own conditional logic
- Uses helper function: `getContextualMessage()`
- Returns JSX with border-top divider

---

### Modularity Assessment

**Question**: Can component accept `concept_breakdown` prop?

**Answer**: ✅ **YES - Fully Modular**

**Reasoning**:
1. Component already accepts multiple props (`analysis`, `overview`)
2. New prop can be added without breaking existing structure
3. Conditional rendering pattern is established
4. Sub-component architecture is proven

**Example Extension**:
```javascript
export default function MCQPerformanceMentor({ 
  analysis, 
  overview,
  conceptBreakdown  // ← NEW PROP
}) {
  const shouldShowConcepts = conceptBreakdown?.concepts?.length >= 3;
  
  return (
    <div className="panel ...">
      {/* Existing sections */}
      
      {/* NEW SECTION */}
      {shouldShowConcepts && (
        <ConceptPerformance 
          breakdown={conceptBreakdown} 
          analysis={analysis} 
        />
      )}
    </div>
  );
}
```

---

### Layout Scalability

**Current Layout Structure**:
```
MCQPerformanceMentor (parent container)
  ├── Header (fixed)
  ├── Key Signals Grid (fixed, 4 cols)
  ├── Insights (dynamic, mb-5 spacing)
  ├── Suggestions (dynamic, mb-5 spacing)
  ├── Longitudinal Performance (dynamic, border-top divider)
  └── Empty State (conditional fallback)
```

**Spacing Pattern**: Each section has `mb-5` (1.25rem) margin-bottom

**Divider Pattern**: Cross-section dividers use `border-t border-white/10 pt-5`

**Question**: Is layout scalable for concept section?

**Answer**: ✅ **YES - Vertically Scalable**

**Reasoning**:
1. Parent container: `panel p-6 rounded-2xl` - no height constraint
2. All sections use flexbox column layout with gap spacing
3. Longitudinal section already adds significant height (no overflow issues)
4. Container is within `overflow-y-auto` parent (MCQDeckView line 636)

---

### Coupling Analysis

**Question**: Is component too tightly coupled?

**Answer**: ✅ **LOW COUPLING - ADDITIVE FRIENDLY**

**Evidence**:
1. Props are independent objects (not deeply nested dependencies)
2. Each section has own conditional guard
3. Sub-components are self-contained
4. Helper functions are pure (no side effects)
5. No shared mutable state between sections

**Example**: `LongitudinalPerformance` (lines 39-135):
- Accepts `{ overview, analysis }` 
- Returns `null` if data missing
- No impact on other sections if hidden
- Uses own helper: `getContextualMessage()`

**Coupling Score**: **2/10** (very low)

---

## PHASE 3 — STATE MANAGEMENT AUDIT

### Analytics State Location

**Current Implementation**:

```javascript
// MCQDeckView.jsx line 94
const { overview: performanceOverview } = useUserPerformanceOverview();

// Passed to mentor (line 695)
<MCQPerformanceMentor 
  analysis={analysis} 
  overview={performanceOverview}
/>
```

**State Storage**: Component-local (not global)  
**Fetch Pattern**: Custom hook, single API call on mount  
**Error Handling**: Graceful (UI doesn't crash on failure)

---

### Concept Data Injection Feasibility

**Option 1**: Extend `useUserPerformanceOverview` hook

**Current**:
```javascript
// useUserPerformanceOverview.js line 28
const response = await api.get('/ai/mcq/users/me/performance');
```

**Extended**:
```javascript
const response = await api.get('/ai/mcq/users/me/performance');
// Response now includes concept_breakdown
```

**Feasibility**: ✅ **CLEAN - No code changes needed if backend adds field**

**Reasoning**:
- Hook returns `response.data` directly (line 34)
- Component defensively checks for data presence
- New fields automatically passed through

---

**Option 2**: Add new hook for concept-specific data

**New Hook**: `useConceptPerformance.js`

```javascript
export function useConceptPerformance(deckId) {
  const [conceptBreakdown, setConceptBreakdown] = useState(null);
  
  useEffect(() => {
    const response = await api.get(`/ai/mcq/decks/${deckId}/concepts/performance`);
    setConceptBreakdown(response.data);
  }, [deckId]);
  
  return { conceptBreakdown };
}
```

**Call in MCQDeckView**:
```javascript
const { conceptBreakdown } = useConceptPerformance(deckId);

<MCQPerformanceMentor 
  analysis={analysis} 
  overview={performanceOverview}
  concepts={conceptBreakdown}  // ← NEW
/>
```

**Feasibility**: ✅ **CLEAN - Follows established pattern**

---

**Option 3**: Compute concept breakdown in frontend

**Location**: `performanceAnalysis.js`

**Current Analysis** (line 29):
```javascript
export function analyzeAttempt({ stats, answers, questions, progress }) {
  // No concept aggregation
}
```

**Extended Analysis**:
```javascript
export function analyzeAttempt({ stats, answers, questions, progress }) {
  // Existing analysis...
  
  // NEW: Compute concept breakdown
  const conceptBreakdown = computeConceptBreakdown(answers, questions);
  
  return {
    summary,
    signals,
    insights,
    suggestions,
    conceptBreakdown  // ← NEW
  };
}

function computeConceptBreakdown(answers, questions) {
  const conceptMap = {};
  
  Object.keys(answers).forEach(qId => {
    const question = questions.find(q => q.id === qId);
    const answer = answers[qId];
    
    // Extract concepts from question
    const concepts = question.concept_tags || [];
    
    concepts.forEach(concept => {
      if (!conceptMap[concept]) {
        conceptMap[concept] = { correct: 0, total: 0 };
      }
      conceptMap[concept].total++;
      if (answer.isCorrect) {
        conceptMap[concept].correct++;
      }
    });
  });
  
  return Object.entries(conceptMap).map(([concept, stats]) => ({
    concept,
    accuracy: stats.correct / stats.total,
    correct: stats.correct,
    total: stats.total
  }));
}
```

**Feasibility**: ⚠️ **BLOCKED - Questions lack `concept_tags`**

---

### State Management Verdict

| Approach | Feasibility | Requires Backend | Requires Question Schema | Clean |
|----------|-------------|------------------|-------------------------|-------|
| Extend `/performance` endpoint | ✅ HIGH | ✅ YES | ❌ NO | ✅ YES |
| Add new `/concepts/performance` endpoint | ✅ HIGH | ✅ YES | ❌ NO | ✅ YES |
| Frontend computation | ❌ BLOCKED | ❌ NO | ✅ YES | ✅ YES |

**Recommended**: **Option 1 or 2** (backend-driven)

---

## PHASE 4 — UX SCALABILITY ASSESSMENT

### Current Finished Screen Layout

**Vertical Structure** (MCQDeckView.jsx lines 636-730):

```
┌─────────────────────────────────────────┐
│ Header (Back button + Time)            │ 64px
├─────────────────────────────────────────┤
│ Deck Complete Panel                     │
│  ├── Hero Score                         │ ~200px
│  ├── Supporting Stats (2 cols)          │ ~120px
│  ├── Performance Mentor                 │
│  │   ├── Header                         │ ~60px
│  │   ├── Key Signals (4 cols)           │ ~100px
│  │   ├── Insights (0-5 items)           │ 0-250px
│  │   ├── Suggestions (0-5 items)        │ 0-250px
│  │   └── Longitudinal (conditional)     │ 0-400px
│  └── Action Buttons                     │ ~180px
└─────────────────────────────────────────┘
```

**Current Height Range**: 900px - 1,600px (depending on insights)  
**Scrollable**: ✅ Yes (`overflow-y-auto` on parent)

---

### Adding Concept Section Impact

**New Section Estimated Height**:

```
Concept Performance Section
  ├── Header ("Concept Breakdown")         │ 40px
  ├── Top 5 Concepts Grid (2 cols)        │ 150px
  ├── Weakest Concept Card                │ 80px
  └── Improvement Detection (conditional)  │ 0-60px
                                      Total: 270-330px
```

**New Total Height**: 1,170px - 1,930px

---

### Overwhelm Risk Assessment

**Question**: Would concept section overwhelm the finished screen?

**Answer**: ⚠️ **MODERATE RISK**

**Factors**:

**Positive**:
1. ✅ Screen is already vertically scrollable
2. ✅ Users expect detailed analysis on finished screen
3. ✅ Longitudinal section already adds ~400px (precedent exists)
4. ✅ Concept data is highly actionable

**Negative**:
1. ⚠️ Total height could exceed 1,900px (2+ screen heights)
2. ⚠️ Information density already high
3. ⚠️ Cognitive load: 3 analytical sections (Signals, Longitudinal, Concepts)
4. ⚠️ Mobile users may experience scroll fatigue

**Mitigation Strategies**:

**Option A**: Make Concept Section Collapsible
```javascript
const [conceptsExpanded, setConceptsExpanded] = useState(false);

return (
  <div className="border-t border-white/10 pt-5">
    <button onClick={() => setConceptsExpanded(!conceptsExpanded)}>
      <h4>Concept Breakdown</h4>
      {conceptsExpanded ? <ChevronUp /> : <ChevronDown />}
    </button>
    
    {conceptsExpanded && (
      <ConceptGrid />
    )}
  </div>
);
```

**Option B**: Show Top 3 Concepts Only (Collapsed View)
```javascript
const topConcepts = concepts.slice(0, 3);

return (
  <>
    <ConceptGrid concepts={topConcepts} />
    {concepts.length > 3 && (
      <button onClick={showFullBreakdown}>
        View all {concepts.length} concepts →
      </button>
    )}
  </>
);
```

**Option C**: Progressive Disclosure (Tabs)
```javascript
<Tabs>
  <Tab label="Current Attempt">
    {/* Signals, Insights, Suggestions */}
  </Tab>
  
  <Tab label="Longitudinal">
    {/* Cross-deck analytics */}
  </Tab>
  
  <Tab label="Concepts">
    {/* Concept breakdown */}
  </Tab>
</Tabs>
```

---

### UX Scalability Verdict

| Criterion | Rating | Notes |
|-----------|--------|-------|
| **Vertical Space** | ✅ ADEQUATE | Scrollable container handles height |
| **Information Density** | ⚠️ HIGH | Already dense, concept section adds more |
| **Cognitive Load** | ⚠️ HIGH | 3 analytical sections may be overwhelming |
| **Mobile Experience** | ⚠️ CONCERN | Long scroll on small screens |
| **Actionability** | ✅ HIGH | Concept data is highly actionable |

**Overall UX Scalability**: ⚠️ **MODERATE - REQUIRES MITIGATION**

**Recommendation**: Implement **collapsible section** or **progressive disclosure** pattern

---

## FINAL ASSESSMENT

### Data Readiness: ❌ **NOT READY**

**Blockers**:
1. Question objects lack `concept_tags` or `concept_id`
2. Backend `/performance` endpoint does not return concept breakdown
3. No concept taxonomy exists in backend

**Required**:
- Add `concept_tags: string[]` to question schema
- Extend backend to compute concept-level aggregations
- Create concept taxonomy/ontology

---

### Component Readiness: ✅ **READY**

**Strengths**:
1. Modular architecture with sub-components
2. Established conditional rendering pattern
3. Clean prop interface
4. Low coupling between sections
5. Proven extensibility (Longitudinal section is recent addition)

**No refactors needed** - component can accept concept data as-is

---

### Injection Feasibility: ✅ **CLEAN**

**Options**:
1. **Extend existing endpoint** - Add `concept_breakdown` to `/performance` response
2. **New endpoint** - Create `/concepts/performance` endpoint
3. **New hook** - `useConceptPerformance(deckId)`

**All options follow established patterns** - no architectural changes needed

---

### UX Scalability: ⚠️ **MODERATE**

**Concerns**:
1. Finished screen height may exceed 1,900px
2. Information density already high
3. Risk of cognitive overload

**Mitigation Required**:
- Implement collapsible section
- OR use progressive disclosure (tabs/accordions)
- OR limit to top 3 concepts with "show more" link

---

## RISK LEVEL: **MEDIUM** ⚠️

### Risk Breakdown

| Risk Factor | Level | Impact | Mitigation |
|-------------|-------|--------|-----------|
| **Data Availability** | 🔴 HIGH | Blocker | Backend must add concept metadata |
| **Component Changes** | 🟢 LOW | None | Component ready as-is |
| **State Management** | 🟢 LOW | None | Clean injection pattern |
| **UX Overwhelm** | 🟡 MEDIUM | User fatigue | Collapsible section required |
| **Performance** | 🟢 LOW | Minimal | Concept computation is O(n) |

---

## RECOMMENDATIONS

### Immediate Actions (Required Before Concept Layer)

1. **Backend Schema Extension**
   ```sql
   ALTER TABLE mcq_questions 
   ADD COLUMN concept_tags TEXT[];
   ```

2. **Backend Endpoint Extension**
   ```
   GET /ai/mcq/users/me/performance
   Response: {
     ...existing fields,
     concept_breakdown: [
       { concept: string, accuracy: number, correct: number, total: number }
     ],
     weakest_concepts: [
       { concept: string, accuracy: number }
     ]
   }
   ```

3. **Frontend Component Addition**
   - Create `ConceptPerformance.jsx` sub-component
   - Follow `LongitudinalPerformance` pattern
   - Implement collapsible UI

4. **UX Mitigation**
   - Add collapse/expand interaction
   - Default to collapsed state
   - Show "expand for concept breakdown" hint

---

### Implementation Sequence (When Ready)

**Phase 1**: Backend Preparation
1. Add concept tags to questions (manual or LLM)
2. Create concept performance aggregation logic
3. Extend `/performance` endpoint

**Phase 2**: Frontend Integration  
1. Create `ConceptPerformance.jsx` component (50-80 lines)
2. Add to `MCQPerformanceMentor.jsx` (5 lines)
3. Test with collapsible UI

**Phase 3**: UX Refinement
1. A/B test collapsed vs expanded default
2. Monitor scroll depth analytics
3. Iterate based on user feedback

**Estimated Effort**: 2-3 days (assuming backend ready)

---

## CONCLUSION

**Frontend is structurally ready for concept layer**, but **blocked by missing backend data**.

**Component architecture is excellent** - modular, extensible, clean prop interface.

**Primary concern is UX scalability** - finished screen may become too dense. Collapsible UI is strongly recommended.

**Once backend provides concept data**, frontend integration is **straightforward and low-risk**.

---

**End of Audit**
