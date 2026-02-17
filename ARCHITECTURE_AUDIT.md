# Synapse Frontend Architecture Audit
## Learning Intelligence System Readiness Assessment

**Date**: February 2026  
**Auditor**: Senior Product Architect  
**Goal**: Assess whether current UI can support deterministic learning engine

---

## Executive Summary

**VERDICT: ❌ CURRENT FRONTEND CANNOT SUPPORT A LEARNING ENGINE WITHOUT SIGNIFICANT RESTRUCTURING**

The Synapse frontend is well-executed as an **LLM output display system**, but fundamentally lacks the architectural primitives required for a learning intelligence platform. The codebase consists of isolated modules with no shared learning state, no performance tracking infrastructure, and no engine-aware design patterns.

**Critical Gap**: There is no concept of a "learning profile" or "performance state" anywhere in the system.

---

## 1️⃣ STATE MANAGEMENT AUDIT

### Current State Architecture

**Global State**: ❌ **NONE**
- Only context: `DemoContext` (demo mode only)
- No `UserContext`, `LearningContext`, `PerformanceContext`
- Profile data fetched in `App.jsx`, passed as props, never persisted in state

**User Learning State**: ❌ **DOES NOT EXIST**
- No storage for:
  - Cumulative performance history
  - Topic-level mastery
  - Weakness tracking
  - Confidence scores
  - Review priorities
  - Spaced repetition state

**State Location Analysis**:
```
App.jsx (lines 196-199):
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);  ← ONLY user profile
  const [notifications, setNotifications] = useState([]);
```

**Profile Schema** (onboarding data only):
```javascript
{
  fullName: string,
  email: string,
  fieldOfStudy: string,      // ← Not used by modules
  country: string,            // ← Not used by modules
  university: string,         // ← Not used by modules
  yearOfStudy: string,        // ← Not used by modules
  stage: string,              // ← Only shown in UI header
  primaryGoal: [],            // ← Not used anywhere
  resources: []               // ← Not used anywhere
}
```

**Reality**: Profile is **decorative metadata**, not operational state.

### Module-Level State Isolation

**MCQ Module** (`MCQDeckView.jsx`):
- State: `answers`, `finished`, `progress`
- Scope: **Component-local only**
- Persistence: Backend only (no global state)
- Performance data: **Lost after unmount**

**Flashcards Module** (`ReviewScreen.jsx`):
- State: `cards`, `index`
- Scope: **Component-local only**
- NO performance tracking (no confidence, no mastery, no repetition)
- NO state sharing with other modules

**Tutor Module** (`TutorPage.jsx`):
- State: `sessions`, `messages`
- Scope: **Component-local only**
- NO awareness of MCQ/flashcard performance
- NO topic-level weakness injection

**Summaries Module**:
- State: File-based summary list
- NO performance data
- NO learning context

### Cross-Module Intelligence: ❌ **IMPOSSIBLE**

**Example Failure Scenario**:
1. User scores 30% on cardiology MCQs
2. User opens Tutor → Tutor has **no knowledge** of cardiology weakness
3. User opens flashcards → Flashcards have **no knowledge** of cardiology weakness
4. User generates summary → Summary has **no knowledge** of cardiology weakness

**Modules are hermetically sealed.**

---

## 2️⃣ MCQ MODULE AUDIT

### Current Capabilities: ✅ Good Foundation

**Data Captured**:
- Time per question (`timeSpent`)
- Correct/incorrect (`isCorrect`)
- Selected option (`selectedLetter`)
- Progress tracking (`progress.questions_answered`)

**UI Features**:
- Option-level explanations ✅
- Time tracking ✅
- Review mode ✅ (lines 237-267)
- Performance mentor ✅ (NEW - just added)

**Performance Analysis** (`performanceAnalysis.js`):
- Chess.com-style metrics ✅
- Deterministic insights ✅
- No backend dependency ✅

### What's Missing for Engine Integration

**❌ Topic/Category Tracking**:
- Questions have NO topic tags
- No way to aggregate performance by subject
- Cannot identify "weak in cardiology, strong in anatomy"

**❌ Difficulty Tracking**:
- No difficulty levels on questions
- Cannot adapt question selection to user level

**❌ Confidence Input**:
- User cannot indicate confidence level
- Cannot distinguish "lucky guess" from "certain"

**❌ Longitudinal Performance**:
- Analysis only for current attempt
- No historical comparison
- No trend visualization

**❌ Global Performance State**:
- Performance data trapped in component
- Not accessible to other modules
- Not persisted in global state

**API Contract** (`apiMCQ.js` line 182):
```javascript
answerMCQQuestion(questionId, selectedOptionLetter, timeMs)
```

**Backend receives**: ✅ Question ID, answer, time  
**Backend does NOT receive**: ❌ Confidence, difficulty, topic performance

---

## 3️⃣ TUTOR MODULE AUDIT

### Current Implementation: ❌ Text Box Wrapper

**Tutor Context Injection**: ❌ **NONE**

`TutorPage.jsx` state (lines 24-35):
```javascript
const [sessions, setSessions] = useState([]);
const [openTabIds, setOpenTabIds] = useState(new Set());
const [quickActionState, setQuickActionState] = useState(null);
```

**What Tutor Receives**:
- ❌ NO current course
- ❌ NO current grade/year
- ❌ NO institution
- ❌ NO performance weaknesses
- ❌ NO topic history

**What Tutor Sends** (backend API):
- User message
- Session ID
- ❌ NO performance context
- ❌ NO learning profile

**Reality**: Tutor is a **stateless chat interface**. It has zero awareness of user learning state.

### What's Required for Engine Integration

**Contextual Tutor Needs**:
1. Access to global learning profile
2. Injection of weak topics into prompt context
3. Awareness of recent MCQ/flashcard performance
4. Ability to suggest targeted exercises
5. Real-time performance updates

**Current Implementation**: **0 out of 5** ❌

---

## 4️⃣ CROSS-MODULE INTELLIGENCE

### Current Reality: ❌ **ZERO INTEGRATION**

**Module Isolation Analysis**:

| Module | Knows About MCQ | Knows About Flashcards | Knows About Tutor | Knows About Weaknesses |
|--------|----------------|----------------------|------------------|----------------------|
| MCQ | N/A | ❌ No | ❌ No | ❌ No |
| Flashcards | ❌ No | N/A | ❌ No | ❌ No |
| Tutor | ❌ No | ❌ No | N/A | ❌ No |
| Summaries | ❌ No | ❌ No | ❌ No | ❌ No |
| Dashboard | ❌ No | ❌ No | ❌ No | ❌ No |

**Data Flow**: **Vertical only (module ↔ backend)**  
**Horizontal data flow**: **DOES NOT EXIST**

**Example of Required Integration**:
```
User fails cardiology MCQs 
  ↓ 
Tutor should suggest cardiology review
  ↓
Flashcards should prioritize cardiology cards
  ↓
Dashboard should show cardiology weakness
```

**Current Capability**: ❌ **IMPOSSIBLE**

### Notification System: ❌ Not Engine-Aware

`App.jsx` notifications (lines 210-216):
```javascript
const [notifications, setNotifications] = useState([]);
```

**Notification Types**:
- File ready
- Summary completed
- MCQ deck ready
- ❌ NO performance-based notifications
- ❌ NO "review weak topics" notifications
- ❌ NO spaced repetition reminders

---

## 5️⃣ NAVIGATION & CONTEXT PRESERVATION

### Router Structure: ✅ Good

**Routes** (`App.jsx` lines 1077-1234):
- React Router v6 ✅
- Deep linking support ✅
- Route-based rendering ✅

**Context Preservation**: ⚠️ **PARTIAL**

**What Persists**:
- URL params (fileId, deckId, sessionId) ✅
- Authentication state ✅

**What Does NOT Persist**:
- Learning profile ❌
- Performance history ❌
- Active weak topics ❌
- Review queue ❌

### Missing Navigation Patterns for Engine

**Required Routes** (not present):
- `/performance` - Learning profile page ❌
- `/review` - Spaced repetition queue ❌
- `/weaknesses` - Topic breakdown ❌
- `/qbank` - Institution-based question browser ❌
- `/analytics` - Performance dashboard (placeholder only)

**Current `/analytics` route** (line 1154):
```javascript
<Route path="/analytics" element={<Placeholder label="Analytics" />} />
```

**Status**: ❌ **NOT IMPLEMENTED**

---

## 6️⃣ MISSING UI COMPONENTS FOR ENGINE

### Required New Surfaces

| Component | Purpose | Current Status |
|-----------|---------|---------------|
| **LearningProfilePage** | Display user mastery/weaknesses | ❌ Does not exist |
| **TopicHeatmap** | Visual topic performance grid | ❌ Does not exist |
| **WeaknessPanel** | Sidebar showing weak topics | ❌ Does not exist |
| **ReviewCenter** | Spaced repetition queue manager | ❌ Does not exist |
| **InstitutionQBank** | Filtered question browser | ❌ Does not exist |
| **PerformanceDashboard** | Analytics with trends | ❌ Placeholder only |
| **AdaptiveRecommendations** | Engine-driven suggestions | ❌ Does not exist |
| **ConfidenceInput** | User confidence capture | ❌ Not in MCQ |
| **DifficultyIndicator** | Question difficulty display | ❌ Not in MCQ |
| **TopicTags** | Subject categorization UI | ❌ Not anywhere |

**Dashboard Stats** (`DashboardStatsPreview.jsx` line 9):
```javascript
const stats = [
    { label: "Questions created", value: "—" },
    { label: "Files uploaded", value: "—" },
    { label: "Study days tracked", value: "—" },
];
```

**All stats hardcoded to "—"** ❌

---

## 7️⃣ STRUCTURAL WEAKNESSES

### 1. **Over-Reliance on Props Drilling**

**Pattern Analysis**:
```javascript
// App.jsx
<DashboardPage profile={profile} onOpenUploadModal={...} />

// DashboardPage.jsx
<DashboardWelcome profile={profile} />
```

**Problem**: Profile passed through 3+ layers, but still just metadata.

**Missing**: Global context providers for learning state.

### 2. **Component Isolation**

**Modules Cannot Communicate**:
- Each module is a standalone feature
- No shared state layer
- No event bus
- No cross-module hooks

**Example**: MCQ performance analysis component (`MCQPerformanceMentor.jsx`) computes insights **but cannot share them** with other modules.

### 3. **Poor State Normalization**

**Backend Data Shape** (mixed contracts):
- MCQ uses `file_ids` array
- Flashcards use `file_ids` array  
- Summaries use `file_id` single value
- Tutor uses no file association

**No normalized schema in frontend.**

### 4. **API Layer Inconsistency**

**Three Different API Patterns**:
1. `api.js` - Axios instance with auth
2. `apiMCQ.js` - Uses global `api`
3. `apiFlashcards.js` - Custom axios with manual headers

**No unified request/response middleware.**

### 5. **No Analytics Hooks**

**No event tracking infrastructure**:
- No performance event emitters
- No analytics middleware
- No centralized logging

**Example**: When user completes MCQ, performance data is:
1. Sent to backend ✅
2. Displayed in UI ✅
3. Lost forever in frontend ❌

### 6. **Modal Overload**

**Current Modal Pattern** (`App.jsx` lines 252, 1238-1280):
```javascript
const [activeModal, setActiveModal] = useState(null);
// "upload" | "summary" | "mcq" | "flashcards"
```

**Problem**: Modal-driven workflows break engine-driven navigation.

**Example Engine Flow (IMPOSSIBLE)**:
```
User scores 40% on cardiology MCQs
  ↓
Engine determines: "User needs cardiology flashcard review"
  ↓
Engine wants to: Open flashcards with cardiology filter
  ↓
Current system: Can only open flashcards list (no filters)
```

### 7. **No Loading/Caching Infrastructure**

**Data Fetching**: Manual in every component

**Example Pattern** (`DashboardRecentActivity.jsx` lines 36-45):
```javascript
const fetchRecentUploads = async () => {
    try {
        const files = await getRecentFiles(5);
        setRecentFiles(files);
    } catch (err) {
        setRecentFiles([]);
    }
};
```

**Repeated in every component.** ❌

**Missing**:
- Global cache layer
- React Query / SWR
- Optimistic updates
- Background sync

---

## 8️⃣ FRONTEND ENGINE INTEGRATION PLAN

### Phase 1: State Infrastructure (Weeks 1-3)

#### 1.1 Create Global Learning Context

**New File**: `src/contexts/LearningContext.jsx`

```javascript
export const LearningProvider = ({ children }) => {
    const [learningProfile, setLearningProfile] = useState({
        topicPerformance: {},      // { topicId: { correct, total, avgTime, lastAttempt } }
        weaknessScore: {},          // { topicId: weaknessScore (0-100) }
        masteryLevel: {},           // { topicId: masteryLevel (0-5) }
        reviewQueue: [],            // [{ type, id, dueDate, priority }]
        recentAttempts: [],         // Last 50 attempts across all modules
        performanceHistory: {},     // Time-series data
        confidenceData: {},         // { questionId: confidenceLevel }
        streaks: {},                // Daily study streaks
    });

    return <LearningContext.Provider value={{...}}>
        {children}
    </LearningContext.Provider>;
};
```

**Integration**: Wrap `<SynapseOS />` in `App.jsx`.

#### 1.2 Create Performance Hooks

**New File**: `src/hooks/usePerformanceTracking.js`

```javascript
export const usePerformanceTracking = () => {
    const { learningProfile, updatePerformance } = useLearning();
    
    const recordAttempt = (type, data) => {
        // Normalize MCQ/Flashcard/Quiz attempts
        // Update topic performance
        // Recalculate weakness scores
        // Trigger review queue update
    };
    
    const getWeakTopics = (limit = 5) => {
        // Return sorted weak topics
    };
    
    const getTopicMastery = (topicId) => {
        // Return mastery level 0-5
    };
    
    return { recordAttempt, getWeakTopics, getTopicMastery };
};
```

#### 1.3 Create API Middleware

**New File**: `src/lib/apiMiddleware.js`

```javascript
export const performanceMiddleware = {
    onMCQAnswer: async (response, context) => {
        // Intercept MCQ answer response
        // Extract performance data
        // Update global learning state
        // Trigger weakness recalculation
    },
    
    onFlashcardReview: async (response, context) => {
        // Intercept flashcard review
        // Update spaced repetition state
    },
    
    onTutorMessage: async (response, context) => {
        // Extract topic from conversation
        // Update topic engagement metrics
    }
};
```

### Phase 2: Backend Contract Extensions (Weeks 4-6)

#### 2.1 Required New API Endpoints

**Performance Aggregation**:
```
GET  /api/performance/profile
GET  /api/performance/topics
GET  /api/performance/weaknesses
GET  /api/performance/history?start=&end=
POST /api/performance/sync
```

**Topic Management**:
```
GET  /api/topics                    # Topic taxonomy
GET  /api/topics/:id/questions      # Questions by topic
GET  /api/topics/:id/performance    # Topic-specific performance
```

**Review Queue**:
```
GET  /api/review/queue              # Spaced repetition queue
POST /api/review/:itemId/complete   # Mark review item complete
GET  /api/review/due                # Items due today
```

**Confidence Tracking**:
```
PATCH /api/mcq/questions/:id/answer
Body: { 
    selectedOptionLetter: string,
    timeMs: number,
    confidence: 1-5,           ← NEW
    topicId: string            ← NEW
}
```

#### 2.2 Backend Response Schema Extension

**Current MCQ Question**:
```json
{
  "id": "q123",
  "question": "...",
  "options": [...],
  "correct_option_letter": "A"
}
```

**Required Extension**:
```json
{
  "id": "q123",
  "question": "...",
  "options": [...],
  "correct_option_letter": "A",
  "topic_id": "cardiology",           ← NEW
  "subtopic_ids": ["heart-failure"],  ← NEW
  "difficulty": 3,                    ← NEW (1-5)
  "institution_tags": ["usmle"],      ← NEW
  "cognitive_level": "application"    ← NEW
}
```

### Phase 3: UI Component Development (Weeks 7-10)

#### 3.1 Learning Profile Page

**Route**: `/performance`

**Components**:
```
PerformancePage/
  ├── TopicHeatmap.jsx          # Visual grid of topic performance
  ├── MasteryBreakdown.jsx      # Mastery levels by category
  ├── WeaknessList.jsx          # Prioritized weak topics
  ├── PerformanceTrends.jsx     # Time-series charts
  └── RecommendedActions.jsx    # Engine-driven suggestions
```

#### 3.2 Review Center

**Route**: `/review`

**Components**:
```
ReviewCenter/
  ├── ReviewQueue.jsx           # Spaced repetition queue
  ├── DueToday.jsx              # Items due today
  ├── ReviewStreaks.jsx         # Daily consistency tracking
  └── ReviewHistory.jsx         # Past review sessions
```

#### 3.3 Adaptive Components

**Enhanced MCQ**:
```javascript
// MCQDeckView.jsx - Add confidence input
<ConfidenceSelector 
    value={confidence}
    onChange={setConfidence}
    onSubmit={() => handleSelect(option, confidence)}
/>
```

**Enhanced Tutor**:
```javascript
// TutorPage.jsx - Inject weak topics
const weakTopics = useWeakTopics(3);

<TutorWindow
    sessionId={sessionId}
    context={{
        weakTopics,
        recentPerformance: learningProfile.recentAttempts,
        targetTopics: learningProfile.reviewQueue
    }}
/>
```

**Enhanced Dashboard**:
```javascript
// DashboardPage.jsx - Engine-driven recommendations
<AdaptiveRecommendations 
    weakTopics={weakTopics}
    reviewQueue={reviewQueue}
    onSelectAction={handleEngineAction}
/>
```

### Phase 4: Data Contracts & Normalization (Weeks 11-12)

#### 4.1 Normalized Schema

**New File**: `src/types/schema.js`

```javascript
// Topic Schema
export const TopicSchema = {
    id: string,
    name: string,
    category: string,
    parentId: string | null,
    difficulty: 1-5,
};

// Performance Schema
export const PerformanceSchema = {
    userId: string,
    topicId: string,
    correct: number,
    total: number,
    avgTime: number,
    confidenceAvg: number,
    masteryLevel: 0-5,
    weaknessScore: 0-100,
    lastAttempt: timestamp,
};

// Attempt Schema
export const AttemptSchema = {
    id: string,
    userId: string,
    moduleType: "mcq" | "flashcard" | "quiz",
    questionId: string,
    topicId: string,
    isCorrect: boolean,
    timeSpent: number,
    confidence: 1-5,
    timestamp: timestamp,
};
```

#### 4.2 State Sync Strategy

**Optimistic Updates**:
```javascript
// On MCQ answer submission
1. Update local state immediately
2. Display feedback to user
3. Background sync to backend
4. Update global learning state
5. Trigger weakness recalculation
```

**Background Sync**:
```javascript
// Every 30 seconds or on tab close
syncPerformanceState({
    recentAttempts: learningProfile.recentAttempts,
    topicPerformance: learningProfile.topicPerformance
});
```

### Phase 5: Required State Restructuring (Weeks 13-15)

#### 5.1 Migrate to Context-Based Architecture

**Current**:
```
App.jsx (all state) → Props drilling → Components
```

**Target**:
```
Contexts (global state)
  ├── AuthContext (user, profile)
  ├── LearningContext (performance, weaknesses, mastery)
  ├── ReviewContext (spaced repetition queue)
  ├── NotificationContext (performance alerts)
  └── CacheContext (API response caching)
    ↓
Components hook directly into contexts
```

#### 5.2 Refactor Module Isolation

**Current**: Each module is standalone.

**Target**: Modules consume shared learning state.

**Example Refactor** (`MCQDeckView.jsx`):

```javascript
// OLD
const [answers, setAnswers] = useState({});

// NEW
const { recordAttempt } = usePerformanceTracking();
const [answers, setAnswers] = useState({});

function handleSelect(optText, confidence) {
    // ... existing logic ...
    
    // NEW: Record in global learning state
    recordAttempt('mcq', {
        questionId: q.id,
        topicId: q.topic_id,
        isCorrect,
        timeSpent,
        confidence,
    });
}
```

---

## 9️⃣ MIGRATION RISK ASSESSMENT

### High Risk Areas

**1. State Migration Complexity** 🔴
- ~50 components currently use local state
- Converting to context-based requires touching ~40% of codebase
- Risk: Breaking existing functionality

**2. API Contract Changes** 🔴
- Backend must extend question/response schemas
- Frontend-backend coupling increases
- Risk: Version mismatch, breaking changes

**3. Performance Overhead** 🟡
- Global learning state will be large (1000s of attempts)
- Re-renders on performance updates could be expensive
- Need careful memoization strategy

**4. Data Migration** 🟡
- Existing users have MCQ/flashcard history in backend
- Must backfill topic associations
- Must calculate initial weakness scores

### Low Risk Areas

**1. New Components** 🟢
- New pages (performance, review) won't break existing features
- Can be built incrementally

**2. UI Enhancements** 🟢
- Adding confidence input to MCQ is non-breaking
- Topic tags are additive

**3. Middleware Layer** 🟢
- API middleware can be added without changing existing calls
- Can intercept responses transparently

---

## 🔟 BRUTAL HONESTY SECTION

### Can the Current Frontend Support an Engine?

**Answer: NO. Absolutely not.**

### Why Not?

**1. No Concept of Learning State**
- The frontend treats every session as isolated
- No memory, no continuity, no intelligence

**2. Modules Cannot Communicate**
- MCQ has no way to tell Flashcards "user is weak in cardiology"
- Tutor has no way to know user just failed 5 anatomy questions
- Dashboard cannot prioritize review based on performance

**3. No Performance Tracking Infrastructure**
- Performance analysis exists **only in MCQDeckView component**
- Data is computed, displayed, then **thrown away**
- No global store, no persistence, no trends

**4. Backend Contract is Too Simple**
- Questions have no topics, no difficulty, no metadata
- API returns basic success/fail, no performance aggregation
- No topic taxonomy, no institution tags

### What This Means

**Current System**: 
- User uploads file → Generates questions → Answers questions → Sees score → **END**
- No learning loop, no adaptation, no intelligence

**Required System**:
- User answers questions → Performance tracked → Weaknesses identified → Engine adapts → Review queue updated → Tutor recommends → Flashcards prioritize → Dashboard guides → **CONTINUOUS LEARNING LOOP**

**Gap**: **Massive architectural rewrite required.**

---

## 1️⃣1️⃣ RECOMMENDATION

### Option A: Full Restructure (14-16 weeks)

**Implement all phases above**:
- Build global learning context
- Extend backend contracts
- Refactor all modules
- Build new UI surfaces

**Pros**:
- Enables true learning engine
- Future-proof architecture
- Competitive moat

**Cons**:
- High risk
- Significant downtime
- Team learning curve

### Option B: Incremental Bridge (8-10 weeks)

**Compromise approach**:
1. Build `LearningContext` (weeks 1-2)
2. Add topic tags to backend (weeks 3-4)
3. Refactor MCQ module only (weeks 5-6)
4. Build performance dashboard (weeks 7-8)
5. Add weakness panel to dashboard (weeks 9-10)

**Defer**:
- Tutor integration
- Flashcard spaced repetition
- Full review center

**Pros**:
- Lower risk
- Faster time to value
- Proof of concept for stakeholders

**Cons**:
- Incomplete engine
- Technical debt
- Still requires Phase 2 later

### Option C: Keep Current System (0 weeks)

**Status Quo**:
- Accept that Synapse is an "LLM output display"
- No learning engine
- No competitive differentiation

**Pros**:
- No risk
- No cost

**Cons**:
- Never becomes a learning platform
- Falls behind competitors
- Limited product value

---

## 1️⃣2️⃣ FINAL VERDICT

**The current frontend is well-built for what it is: a file viewer with LLM features.**

**But it is NOT architecturally compatible with a learning engine.**

**Path forward requires choosing between:**
1. **Full restructure** → True learning intelligence system
2. **Incremental bridge** → Partial learning features, technical debt
3. **Accept limitations** → Remain a content generation tool

**My recommendation: Option B (Incremental Bridge)**
- Proves concept without full rewrite
- Delivers value in 10 weeks
- Allows iteration based on user response
- Lower risk than full restructure

**If user engagement with learning features is high after Phase 1, commit to Option A for Phase 2.**

---

## 1️⃣3️⃣ APPENDIX: CODEBASE METRICS

**Total Files**: 136 JS/JSX files  
**Lines of Code**: ~15,000 (estimated)  
**State Management**: Local useState (no Redux/Zustand)  
**Context Providers**: 1 (DemoContext)  
**Global State**: 0  
**API Layers**: 3 (inconsistent patterns)  
**Performance Tracking**: 1 component (MCQ only)  
**Cross-Module Communication**: 0  

**Readiness Score: 2/10** ❌

---

**End of Audit**
