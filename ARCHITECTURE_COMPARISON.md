# Architecture Comparison: Current vs. Required

## Current Architecture (LLM Output Display)

```
┌─────────────────────────────────────────────────────────┐
│                        App.jsx                          │
│                                                         │
│  State: [profile, notifications, activeModal]          │
│  Context: DemoContext only                             │
│                                                         │
└──────────────────┬──────────────────────────────────────┘
                   │ Props drilling
                   ▼
    ┌──────────────┴──────────────────────────┐
    │                                          │
    ▼                                          ▼
┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐
│   MCQ   │  │Flashcards│  │  Tutor │  │ Dashboard │
│         │  │          │  │        │  │           │
│ Local   │  │  Local   │  │ Local  │  │  Local    │
│ State   │  │  State   │  │ State  │  │  State    │
└────┬────┘  └────┬─────┘  └───┬────┘  └─────┬─────┘
     │            │             │              │
     │            │             │              │
     ▼            ▼             ▼              ▼
┌─────────────────────────────────────────────────┐
│              Backend API                        │
│  (Separate calls, no shared state)             │
└─────────────────────────────────────────────────┘

DATA FLOW: Vertical only (module ↔ backend)
MODULES: Isolated silos
LEARNING STATE: Does not exist
```

---

## Required Architecture (Learning Intelligence System)

```
┌──────────────────────────────────────────────────────────────┐
│                          App.jsx                             │
│                                                              │
│           ┌─────────── Context Providers ──────────┐        │
│           │                                         │        │
│   ┌───────▼────────┐  ┌─────────────────────┐     │        │
│   │  AuthContext   │  │  LearningContext    │     │        │
│   │  - user        │  │  - topicPerformance │◄────┼────┐   │
│   │  - profile     │  │  - weaknessScore    │     │    │   │
│   └────────────────┘  │  - masteryLevel     │     │    │   │
│                       │  - reviewQueue      │     │    │   │
│   ┌────────────────┐  │  - recentAttempts   │     │    │   │
│   │ ReviewContext  │  │  - performanceHistory│    │    │   │
│   │ - queue        │  └─────────────────────┘     │    │   │
│   │ - dueToday     │                              │    │   │
│   └────────────────┘  ┌─────────────────────┐     │    │   │
│                       │  CacheContext       │     │    │   │
│                       │  - apiCache         │     │    │   │
│                       └─────────────────────┘     │    │   │
│                                                   │    │   │
└───────────────────────────────────────────────────┼────┼───┘
                                                    │    │
                  ┌─────────────────────────────────┘    │
                  │                                      │
    ┌─────────────▼─────┬──────────────┬────────────────▼───┐
    │                   │              │                    │
    ▼                   ▼              ▼                    ▼
┌─────────┐      ┌──────────┐    ┌────────┐        ┌───────────┐
│   MCQ   │      │Flashcards│    │  Tutor │        │ Dashboard │
│         │      │          │    │        │        │           │
│ Hooks:  │      │  Hooks:  │    │ Hooks: │        │  Hooks:   │
│ ├─────┐ │      │ ├─────┐  │    │ ├────┐ │        │ ├──────┐  │
│ │Perf │ │      │ │Perf │  │    │ │Weak│ │        │ │Stats │  │
│ │Track│ │      │ │Track│  │    │ │Topc│ │        │ │Aggr  │  │
│ └──┬──┘ │      │ └──┬──┘  │    │ └─┬──┘ │        │ └───┬──┘  │
│    │    │      │    │     │    │   │    │        │     │     │
│ ┌──▼──┐ │      │ ┌──▼───┐ │    │ ┌─▼──┐ │        │  ┌──▼───┐ │
│ │Topic│ │      │ │SpcRep│ │    │ │Ctx │ │        │  │PerDash│ │
│ │Tag  │ │      │ │Queue │ │    │ │Inj │ │        │  │      │ │
│ └─────┘ │      │ └──────┘ │    │ └────┘ │        │  └──────┘ │
└────┬────┘      └────┬─────┘    └───┬────┘        └─────┬─────┘
     │                │              │                    │
     └────────────────┼──────────────┼────────────────────┘
                      │              │
                      ▼              ▼
            ┌─────────────────────────────┐
            │   Performance Middleware    │
            │   - Intercept responses     │
            │   - Update global state     │
            │   - Trigger recalculations  │
            └──────────────┬──────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │        Backend API            │
            │  - Topic taxonomy             │
            │  - Performance aggregation    │
            │  - Weakness calculation       │
            │  - Review queue management    │
            └───────────────────────────────┘

DATA FLOW: Horizontal (module ↔ global state) + Vertical (API)
MODULES: Connected via shared state
LEARNING STATE: Global, persistent, engine-aware
```

---

## Key Architectural Changes

### 1. State Management

**Current**:
```javascript
// In MCQDeckView.jsx
const [answers, setAnswers] = useState({});
// Data lost on unmount
```

**Required**:
```javascript
// Global context
const { recordAttempt, getWeakTopics } = useLearningContext();

// Record performance
recordAttempt('mcq', {
    questionId: q.id,
    topicId: q.topic_id,
    isCorrect,
    confidence,
    timeSpent
});

// Other modules can now access weak topics
```

---

### 2. Cross-Module Intelligence

**Current**:
```
User fails cardiology MCQs
  ↓
[Data sent to backend]
  ↓
[Data stored]
  ↓
[End of story]
```

**Required**:
```
User fails cardiology MCQs
  ↓
Performance recorded in global state
  ↓
Weakness score recalculated
  ↓
┌──────────────────────────────────────┐
│ Tutor: Injects cardiology context   │
│ Flashcards: Prioritizes cardiology  │
│ Dashboard: Shows cardiology warning │
│ Review Queue: Adds cardiology items │
└──────────────────────────────────────┘
```

---

### 3. Data Contracts

**Current MCQ Question**:
```json
{
  "id": "q123",
  "question": "What is the treatment?",
  "options": ["A", "B", "C", "D"],
  "correct_option_letter": "A"
}
```

**Required MCQ Question**:
```json
{
  "id": "q123",
  "question": "What is the treatment?",
  "options": ["A", "B", "C", "D"],
  "correct_option_letter": "A",
  
  "topic_id": "cardiology",
  "subtopic_ids": ["heart-failure", "pharmacology"],
  "difficulty": 3,
  "cognitive_level": "application",
  "institution_tags": ["usmle", "step2"],
  "bloom_level": "apply"
}
```

**Current Answer Submission**:
```javascript
answerMCQQuestion(questionId, selectedLetter, timeMs)
```

**Required Answer Submission**:
```javascript
answerMCQQuestion({
    questionId,
    selectedLetter,
    timeMs,
    confidence: 1-5,          // NEW
    topicId,                  // NEW
    attemptContext: {         // NEW
        previousAttempts,
        reviewType,
        source
    }
})
```

---

### 4. Module Communication Patterns

**Current**:
```
MCQ Module          Flashcard Module
     ↓                     ↓
  Backend             Backend
     (No horizontal communication)
```

**Required**:
```
           Global Learning State
                    ↕
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
MCQ Module    Flashcards      Tutor Module
    │               │               │
    └───────────────┼───────────────┘
                    │
              Shared Topics
            Shared Weaknesses
         Shared Review Queue
```

---

## Implementation Effort Comparison

### Current System Maintenance (Baseline)

| Task | Effort |
|------|--------|
| Add new MCQ feature | 1-2 days |
| Add new module | 3-5 days |
| Fix bug in module | 0.5-1 day |

### With Learning Engine

| Task | Effort Without Global State | Effort With Global State |
|------|------------------------------|--------------------------|
| Add new MCQ feature | 1-2 days | 2-3 days (+ state integration) |
| Add new module | 3-5 days | 5-8 days (+ performance hooks) |
| Fix bug in module | 0.5-1 day | 1-2 days (+ state consistency) |
| Add topic tracking | **Impossible** | 3-5 days |
| Add cross-module intelligence | **Impossible** | 1-2 days (after context exists) |
| Build performance dashboard | **Incomplete data** | 2-3 days (data available) |

---

## Risk-Benefit Matrix

### Option A: Full Restructure

**Risks** 🔴:
- 14-16 weeks downtime
- High regression risk
- Team learning curve
- Potential user disruption

**Benefits** 🟢:
- True learning engine
- Competitive moat
- Future-proof architecture
- Full feature set

**Score**: High risk, high reward

---

### Option B: Incremental Bridge

**Risks** 🟡:
- 8-10 weeks partial downtime
- Technical debt accumulation
- Incomplete features
- May need Phase 2 refactor

**Benefits** 🟢:
- Lower risk
- Faster time to value
- Proof of concept
- Can pivot based on data

**Score**: Medium risk, medium reward

---

### Option C: Status Quo

**Risks** 🟢:
- No technical risk

**Benefits** ❌:
- No learning engine
- No differentiation
- Limited product value
- Falls behind competitors

**Score**: No risk, no reward

---

## Recommended Path: Incremental Bridge

### Phase 1: Foundation (Weeks 1-4)

**Week 1-2**: Build `LearningContext`
```javascript
// src/contexts/LearningContext.jsx
export const LearningProvider = ({ children }) => {
    const [topicPerformance, setTopicPerformance] = useState({});
    const [weaknessScore, setWeaknessScore] = useState({});
    
    const recordAttempt = (type, data) => {
        // Update performance
        // Recalculate weaknesses
    };
    
    return <LearningContext.Provider value={{...}}>
        {children}
    </LearningContext.Provider>;
};
```

**Week 3-4**: Extend backend contracts
- Add topic taxonomy table
- Add difficulty levels
- Extend MCQ question schema

### Phase 2: MCQ Integration (Weeks 5-6)

**Refactor MCQDeckView**:
- Hook into `LearningContext`
- Record attempts globally
- Display topic tags
- Add confidence input

### Phase 3: Performance Dashboard (Weeks 7-8)

**Build `/performance` route**:
- Topic performance grid
- Weakness breakdown
- Recent attempts list

### Phase 4: Weakness Panel (Weeks 9-10)

**Add to Dashboard**:
- Show top 5 weak topics
- Suggest review actions
- Link to targeted practice

**Result**: Proof of concept for learning engine, deliverable in 10 weeks.

---

**Decision Point**: If user engagement is high, commit to full restructure (Option A) for comprehensive learning intelligence system.
