# Backend Analytics Endpoints - Implementation Spec

**Priority:** HIGH  
**Effort:** 9-13 hours (~1.5 days)  
**Required For:** Analytics drill-down + dashboard prescription engine

---

## 🎯 OVERVIEW

Frontend has implemented 3 new analytics features that require backend support:

1. **Concept drill-down** → Deep-dive into concept performance
2. **Rushed mistakes drill-down** → Behavioral analysis proof
3. **Dashboard prescription engine** → Home screen intelligence

**All frontend code is complete and waiting for these endpoints.**

---

## 📌 ENDPOINT 1: Dashboard Analytics

### **GET /api/analytics/dashboard**

**Purpose:** Provide home screen with actionable intelligence

**Auth:** Required (JWT token)

**Response:**
```json
{
  "success": true,
  "data": {
    "weakestConcepts": [
      {
        "id": "concept_uuid_123",
        "name": "Pharmacology",
        "accuracy": 58.5,
        "totalAttempts": 24
      },
      {
        "id": "concept_uuid_456",
        "name": "Cardiology", 
        "accuracy": 62.3,
        "totalAttempts": 18
      },
      {
        "id": "concept_uuid_789",
        "name": "Neurology",
        "accuracy": 65.0,
        "totalAttempts": 20
      }
    ],
    "recentTrend": [
      { "date": "2026-02-10", "accuracy": 68.0 },
      { "date": "2026-02-11", "accuracy": 70.0 },
      { "date": "2026-02-12", "accuracy": 72.5 },
      { "date": "2026-02-13", "accuracy": 71.0 },
      { "date": "2026-02-14", "accuracy": 73.0 },
      { "date": "2026-02-15", "accuracy": 75.5 },
      { "date": "2026-02-16", "accuracy": 74.0 }
    ],
    "lastSessionId": "deck_session_abc123"
  }
}
```

**Required Queries:**

```sql
-- Query 1: Top 3 weakest concepts
SELECT 
  c.id,
  c.name,
  AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
  COUNT(qa.id) as total_attempts
FROM concepts c
INNER JOIN questions q ON q.concept_id = c.id
INNER JOIN question_attempts qa ON qa.question_id = q.id
WHERE qa.user_id = $1
GROUP BY c.id, c.name
HAVING COUNT(qa.id) >= 3  -- Minimum 3 attempts for reliability
ORDER BY accuracy ASC
LIMIT 3;

-- Query 2: Last 7 days accuracy trend
SELECT 
  DATE(qa.attempted_at) as date,
  AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy
FROM question_attempts qa
WHERE qa.user_id = $1
  AND qa.attempted_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(qa.attempted_at)
ORDER BY date ASC;

-- Query 3: Last active session
SELECT id
FROM mcq_deck_sessions
WHERE user_id = $1
  AND status = 'in_progress'
ORDER BY updated_at DESC
LIMIT 1;
```

**Edge Cases:**
- If user has <3 concepts → return all available
- If user has <7 days data → return what exists
- If no active session → `lastSessionId: null`
- If no data at all → return empty arrays

**Caching:** Redis, 5-minute TTL (dashboard is viewed frequently)

---

## 📌 ENDPOINT 2: Rushed Mistakes Drill-Down

### **GET /api/analytics/decks/:deckId/rushed**

**Purpose:** Show proof of rushing behavior for specific deck

**Auth:** Required (JWT token)

**Params:**
- `deckId` (path parameter)

**Response:**
```json
{
  "success": true,
  "data": {
    "deckTitle": "Cardiology MCQ Deck",
    "avgCorrectTime": 23,
    "threshold": 17,
    "questions": [
      {
        "id": "q_uuid_123",
        "text": "Which arrhythmia requires immediate cardioversion?",
        "timeSpent": 12000,
        "yourAnswer": "A. Sinus tachycardia",
        "correctAnswer": "C. Ventricular tachycardia",
        "fileId": "file_uuid_456",
        "sourcePages": [45]
      },
      {
        "id": "q_uuid_789",
        "text": "What is the first-line treatment for atrial fibrillation?",
        "timeSpent": 15000,
        "yourAnswer": "B. Amiodarone",
        "correctAnswer": "D. Beta-blocker or rate control",
        "fileId": "file_uuid_456",
        "sourcePages": [47, 48]
      }
    ]
  }
}
```

**Required Queries:**

```sql
-- Query 1: Calculate avg correct time for this deck + user
SELECT AVG(qa.time_ms) / 1000.0 as avg_correct_time_sec
FROM question_attempts qa
WHERE qa.deck_id = $1
  AND qa.user_id = $2
  AND qa.is_correct = true;

-- Query 2: Get rushed incorrect answers
WITH avg_time AS (
  SELECT AVG(qa.time_ms) as avg_ms
  FROM question_attempts qa
  WHERE qa.deck_id = $1
    AND qa.user_id = $2
    AND qa.is_correct = true
)
SELECT 
  q.id,
  q.text,
  qa.time_ms as time_spent,
  qa.selected_option,
  q.correct_option,
  q.file_id,
  q.source_page_numbers as source_pages
FROM question_attempts qa
INNER JOIN questions q ON qa.question_id = q.id
CROSS JOIN avg_time
WHERE qa.deck_id = $1
  AND qa.user_id = $2
  AND qa.is_correct = false
  AND qa.time_ms < (avg_time.avg_ms * 0.75)
ORDER BY qa.attempted_at DESC;

-- Query 3: Get deck title
SELECT title FROM mcq_decks WHERE id = $1;
```

**Answer Format:**
```javascript
yourAnswer = `${attempt.selected_option}. ${optionText}`
correctAnswer = `${question.correct_option}. ${correctOptionText}`
```

**Edge Cases:**
- If no correct answers → avgCorrectTime = null, threshold = null
- If no rushed mistakes → empty questions array
- If deck doesn't exist → 404

**Threshold Calculation:**
```
threshold = avgCorrectTime * 0.75
```

---

## 📌 ENDPOINT 3: Concept Detail

### **GET /api/analytics/concepts/:conceptId/questions**

**Purpose:** Deep-dive into concept with question evidence + trend

**Auth:** Required (JWT token)

**Params:**
- `conceptId` (path parameter)

**Response:**
```json
{
  "success": true,
  "data": {
    "concept": {
      "id": "concept_uuid_123",
      "name": "Pharmacology",
      "accuracy": 58.5,
      "totalAttempts": 24,
      "correctAttempts": 14
    },
    "accuracyHistory": [
      { "date": "2026-02-10T10:00:00Z", "accuracy": 50.0 },
      { "date": "2026-02-12T14:30:00Z", "accuracy": 55.0 },
      { "date": "2026-02-15T09:15:00Z", "accuracy": 58.5 }
    ],
    "questions": [
      {
        "id": "q_uuid_456",
        "text": "What is the mechanism of action for ACE inhibitors?",
        "fileId": "file_uuid_789",
        "sourcePages": [12, 13],
        "attempts": [
          {
            "isCorrect": false,
            "timeMs": 15000,
            "attemptedAt": "2026-02-10T10:05:00Z"
          },
          {
            "isCorrect": true,
            "timeMs": 25000,
            "attemptedAt": "2026-02-15T09:20:00Z"
          }
        ]
      }
    ]
  }
}
```

**Required Queries:**

```sql
-- Query 1: Concept metadata
SELECT 
  c.id,
  c.name,
  AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
  COUNT(qa.id) as total_attempts,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_attempts
FROM concepts c
INNER JOIN questions q ON q.concept_id = c.id
INNER JOIN question_attempts qa ON qa.question_id = q.id
WHERE c.id = $1
  AND qa.user_id = $2
GROUP BY c.id, c.name;

-- Query 2: Accuracy history by session
SELECT 
  mds.created_at as date,
  AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy
FROM mcq_deck_sessions mds
INNER JOIN question_attempts qa ON qa.session_id = mds.id
INNER JOIN questions q ON qa.question_id = q.id
WHERE q.concept_id = $1
  AND qa.user_id = $2
GROUP BY mds.id, mds.created_at
ORDER BY mds.created_at ASC
LIMIT 10;

-- Query 3: All questions with attempts
SELECT 
  q.id,
  q.text,
  q.file_id,
  q.source_page_numbers as source_pages,
  json_agg(
    json_build_object(
      'isCorrect', qa.is_correct,
      'timeMs', qa.time_ms,
      'attemptedAt', qa.attempted_at
    ) ORDER BY qa.attempted_at ASC
  ) as attempts
FROM questions q
LEFT JOIN question_attempts qa ON qa.question_id = q.id
WHERE q.concept_id = $1
  AND qa.user_id = $2
GROUP BY q.id, q.text, q.file_id, q.source_page_numbers
ORDER BY 
  COUNT(CASE WHEN qa.is_correct = false THEN 1 END) DESC,  -- Wrong answers first
  q.created_at DESC;
```

**Sorting Logic:**
- Prioritize questions with wrong attempts
- Then sort by most recent

**Edge Cases:**
- If concept doesn't exist → 404
- If no attempts for concept → empty questions array
- If <10 sessions → return what exists in accuracyHistory

---

## 🔄 IMPLEMENTATION ORDER

### **Recommended Sequence:**

**Day 1 (4 hours):**
1. Implement GET /api/analytics/dashboard
   - Start with hardcoded/mocked data if needed
   - Unblocks dashboard prescription engine
   - High visibility feature

**Day 2 (4 hours):**
2. Implement GET /api/analytics/decks/:deckId/rushed
   - Simpler query (single deck scope)
   - Unblocks behavioral proof in MCQ screen

**Day 3 (5 hours):**
3. Implement GET /api/analytics/concepts/:conceptId/questions
   - Most complex query (joins + aggregations)
   - Unblocks deep drill-down capability

---

## 🧪 TESTING CHECKLIST

### **Endpoint 1: Dashboard**

**Test Case 1:** User with data
```
Given: User has answered 50+ questions across 5 concepts
When: GET /api/analytics/dashboard
Then: 
  - weakestConcepts.length === 3
  - recentTrend.length <= 7
  - Concepts sorted by accuracy ASC
```

**Test Case 2:** New user
```
Given: User has answered <3 questions
When: GET /api/analytics/dashboard
Then: 
  - weakestConcepts.length may be 0-2
  - recentTrend may be empty
  - No 500 error
```

**Test Case 3:** Active session
```
Given: User has in_progress MCQ session
When: GET /api/analytics/dashboard
Then: lastSessionId should be that session's ID
```

---

### **Endpoint 2: Rushed Mistakes**

**Test Case 1:** Deck with rushed mistakes
```
Given: User answered 3 questions incorrectly in <17s
When: GET /api/analytics/decks/:deckId/rushed
Then: 
  - questions.length === 3
  - threshold === avgCorrectTime * 0.75
  - Each question has yourAnswer and correctAnswer
```

**Test Case 2:** Perfect performance
```
Given: User answered all correctly or took appropriate time
When: GET /api/analytics/decks/:deckId/rushed
Then: 
  - questions.length === 0
  - avgCorrectTime and threshold still present
```

**Test Case 3:** Invalid deck ID
```
When: GET /api/analytics/decks/nonexistent/rushed
Then: 404 with error message
```

---

### **Endpoint 3: Concept Details**

**Test Case 1:** Concept with history
```
Given: User has 30 attempts across 10 sessions for "Pharmacology"
When: GET /api/analytics/concepts/:conceptId/questions
Then:
  - accuracyHistory.length === 10 (last 10 sessions)
  - questions array includes all questions
  - Each question has attempts array (chronological)
```

**Test Case 2:** New concept
```
Given: User has 2 attempts on concept
When: GET /api/analytics/concepts/:conceptId/questions
Then:
  - accuracyHistory.length === 1 (only 1 session)
  - questions.length may be 1-2
  - No crash
```

**Test Case 3:** Invalid concept
```
When: GET /api/analytics/concepts/nonexistent/questions
Then: 404 with error message
```

---

## 🔐 PERMISSIONS & ACCESS CONTROL

**All endpoints require:**
- Valid JWT token
- User must own the data (user_id filter in all queries)
- No cross-user data leakage

**Authorization checks:**
```javascript
// For deck-specific endpoints
if (deck.user_id !== req.user.id) {
  return res.status(403).json({ error: "Unauthorized" });
}

// For concept-specific endpoints
// Verify concept exists in user's question pool
const hasAccess = await checkUserHasConceptAccess(conceptId, userId);
if (!hasAccess) {
  return res.status(404).json({ error: "Concept not found" });
}
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### **Caching Strategy:**

**Dashboard endpoint:**
```
Key: analytics:dashboard:{userId}
TTL: 5 minutes
Invalidate: On new question attempt
```

**Rushed mistakes endpoint:**
```
Key: analytics:deck:{deckId}:rushed:{userId}
TTL: 10 minutes
Invalidate: On deck reset/retake
```

**Concept details endpoint:**
```
Key: analytics:concept:{conceptId}:{userId}
TTL: 15 minutes
Invalidate: On new attempt for that concept
```

---

### **Query Optimization:**

1. **Add indexes:**
```sql
CREATE INDEX idx_qa_user_concept ON question_attempts(user_id, concept_id);
CREATE INDEX idx_qa_user_deck ON question_attempts(user_id, deck_id);
CREATE INDEX idx_qa_attempted_at ON question_attempts(attempted_at);
CREATE INDEX idx_q_concept ON questions(concept_id);
```

2. **Limit result sizes:**
- Dashboard: Top 3 concepts only
- Recent trend: Last 7 days only
- Accuracy history: Last 10 sessions only
- Questions: Limit to 50 per concept (pagination later)

3. **Use prepared statements:**
```javascript
const query = db.prepare(`
  SELECT concept_id, AVG(is_correct) as accuracy
  FROM question_attempts
  WHERE user_id = ?
  GROUP BY concept_id
  ORDER BY accuracy ASC
  LIMIT 3
`);
```

---

## 🔍 DATA CONSISTENCY CHECKS

### **Before Returning Data:**

**1. Validate concept exists:**
```javascript
if (!concept) {
  return res.status(404).json({ error: "Concept not found" });
}
```

**2. Ensure attempts array not empty:**
```javascript
if (concept.totalAttempts === 0) {
  return res.json({
    data: {
      concept: { ...concept, accuracy: 0 },
      accuracyHistory: [],
      questions: []
    }
  });
}
```

**3. Handle missing source pages:**
```javascript
sourcePages: question.source_page_numbers || []
```

**4. Sanitize question text:**
```javascript
text: stripHtml(question.text).substring(0, 2000)
```

---

## 📊 RESPONSE TIME TARGETS

| Endpoint | Target | Acceptable | Critical |
|----------|--------|------------|----------|
| /dashboard | <200ms | <500ms | <1000ms |
| /decks/:id/rushed | <300ms | <800ms | <1500ms |
| /concepts/:id/questions | <500ms | <1200ms | <2000ms |

**Why different targets:**
- Dashboard: High traffic, needs to be instant
- Rushed: Medium complexity query
- Concepts: Most complex (joins + aggregations)

---

## 🧪 SAMPLE TEST DATA

### **For Local Testing:**

**Dashboard Response:**
```json
{
  "weakestConcepts": [
    { "id": "test_c1", "name": "Pharmacology", "accuracy": 58.5, "totalAttempts": 24 },
    { "id": "test_c2", "name": "Cardiology", "accuracy": 62.3, "totalAttempts": 18 },
    { "id": "test_c3", "name": "Neurology", "accuracy": 65.0, "totalAttempts": 20 }
  ],
  "recentTrend": [
    { "date": "2026-02-10", "accuracy": 68 },
    { "date": "2026-02-13", "accuracy": 72 },
    { "date": "2026-02-16", "accuracy": 74 }
  ],
  "lastSessionId": null
}
```

**Rushed Mistakes Response:**
```json
{
  "deckTitle": "Test Deck",
  "avgCorrectTime": 25,
  "threshold": 18,
  "questions": [
    {
      "id": "q1",
      "text": "Sample question text?",
      "timeSpent": 15000,
      "yourAnswer": "A. Wrong",
      "correctAnswer": "C. Correct",
      "fileId": "f1",
      "sourcePages": [10]
    }
  ]
}
```

**Concept Details Response:**
```json
{
  "concept": {
    "id": "c1",
    "name": "Pharmacology",
    "accuracy": 60,
    "totalAttempts": 10,
    "correctAttempts": 6
  },
  "accuracyHistory": [
    { "date": "2026-02-10T10:00:00Z", "accuracy": 50 },
    { "date": "2026-02-15T14:00:00Z", "accuracy": 60 }
  ],
  "questions": [
    {
      "id": "q1",
      "text": "Sample question?",
      "fileId": "f1",
      "sourcePages": [5],
      "attempts": [
        { "isCorrect": false, "timeMs": 20000, "attemptedAt": "2026-02-10T10:05:00Z" },
        { "isCorrect": true, "timeMs": 30000, "attemptedAt": "2026-02-15T14:10:00Z" }
      ]
    }
  ]
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

**Before Merging:**

- [ ] Add database indexes
- [ ] Add unit tests for queries
- [ ] Add integration tests for endpoints
- [ ] Add error handling for malformed data
- [ ] Add rate limiting (1000 req/hour per user)
- [ ] Add logging for analytics endpoint usage
- [ ] Add Redis caching layer
- [ ] Test with large datasets (1000+ questions)
- [ ] Verify no N+1 queries
- [ ] Test cross-user data isolation

**After Merging:**

- [ ] Monitor endpoint latency
- [ ] Monitor cache hit rates
- [ ] Monitor error rates
- [ ] Verify frontend integration
- [ ] User acceptance testing

---

## 🎯 SUCCESS CRITERIA

**Functional:**
- ✅ All 3 endpoints return correct data
- ✅ No 500 errors on edge cases
- ✅ Response times under target
- ✅ Frontend drill-down links work
- ✅ Charts render correctly

**Business:**
- ✅ Dashboard prescription engine shows on home screen
- ✅ Users can verify "rushed mistakes" claims
- ✅ Concept drill-down provides educational value
- ✅ No "coming soon" messaging visible

**Technical:**
- ✅ Queries optimized with indexes
- ✅ Caching reduces DB load
- ✅ No cross-user data leakage
- ✅ Graceful degradation on errors

---

## 📈 EXPECTED IMPACT

### **User Engagement:**
- ↑ 40% increase in dashboard visit duration
- ↑ 60% increase in analytics page visits
- ↑ 80% increase in drill-down clicks
- ↑ 30% increase in "Resume Session" clicks

### **Perceived Value:**
- ↑ 50% in "analytics are useful" rating
- ↑ 70% in "I trust the system" rating
- ↑ 40% in "I understand my weaknesses" rating

### **Technical Metrics:**
- ~300 additional API calls per 1000 active users per day
- ~5 MB additional data transfer per user per week
- <1% increase in server load (with caching)

---

## 💡 IMPLEMENTATION TIPS

### **Tip 1: Start with Mocked Data**

If schema changes are needed, return hardcoded data first:

```javascript
router.get('/api/analytics/dashboard', auth, (req, res) => {
  // TODO: Replace with real query
  res.json({
    data: {
      weakestConcepts: [
        { id: "mock1", name: "Pharmacology", accuracy: 58.5, totalAttempts: 24 }
      ],
      recentTrend: [],
      lastSessionId: null
    }
  });
});
```

This unblocks frontend testing immediately.

---

### **Tip 2: Use Database Views**

Create views for complex aggregations:

```sql
CREATE VIEW user_concept_performance AS
SELECT 
  qa.user_id,
  c.id as concept_id,
  c.name as concept_name,
  AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
  COUNT(qa.id) as total_attempts
FROM question_attempts qa
INNER JOIN questions q ON qa.question_id = q.id
INNER JOIN concepts c ON q.concept_id = c.id
GROUP BY qa.user_id, c.id, c.name;
```

Then query the view:
```sql
SELECT * FROM user_concept_performance 
WHERE user_id = $1 
ORDER BY accuracy ASC 
LIMIT 3;
```

---

### **Tip 3: Batch Related Queries**

Use CTEs for efficiency:

```sql
WITH user_stats AS (
  SELECT 
    AVG(time_ms) as avg_correct_time,
    COUNT(*) as total_correct
  FROM question_attempts
  WHERE user_id = $1 AND deck_id = $2 AND is_correct = true
)
SELECT q.*, qa.time_ms, us.avg_correct_time
FROM questions q
INNER JOIN question_attempts qa ON qa.question_id = q.id
CROSS JOIN user_stats us
WHERE qa.deck_id = $2
  AND qa.user_id = $1
  AND qa.is_correct = false
  AND qa.time_ms < (us.avg_correct_time * 0.75);
```

---

## 🎓 LESSONS FOR FUTURE ENDPOINTS

### **1. Always Include Proof Elements**

When claiming something, provide evidence:
- "You're weak in X" → show questions
- "You're rushing" → show times
- "You improved" → show trend

---

### **2. Always Link to Source**

Every question should link back to study material:
- Enables closed-loop learning
- Increases educational value
- Justifies premium pricing

---

### **3. Always Show Trends**

Single snapshot is less valuable than trajectory:
- 58% accuracy → interesting
- 50% → 55% → 58% → compelling (shows progress)

---

### **4. Always Sort Intelligently**

Don't just return data in DB order:
- Weakest concepts first (prioritizes action)
- Wrong attempts first (focuses on gaps)
- Recent sessions last (shows current state)

---

## 🏁 SUMMARY

**Frontend Status:** ✅ **Complete**  
**Backend Status:** ⏳ **3 endpoints needed**  
**Estimated Effort:** 9-13 hours (1.5 days)

**Impact:**
- Transforms analytics from cosmetic to credible
- Adds proof layer (users can verify claims)
- Unblocks dashboard prescription engine
- Removes "coming soon" stigma

**YC Demo Impact:**
- Before: "Nice stats" (5/10)
- After: "Deep behavioral analytics with proof" (8/10)

---

**Next Action:** Backend team implement 3 endpoints using specs above.

**Frontend is ready and waiting.**
