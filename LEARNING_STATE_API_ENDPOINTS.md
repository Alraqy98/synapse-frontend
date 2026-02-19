# Learning State API Endpoints - Backend Implementation Required

**Priority:** HIGH  
**Component:** PerformancePage (/analytics route)  
**Status:** Frontend complete, awaiting backend endpoints

---

## 🎯 Overview

The new PerformancePage (Clinical Learning State Interface) requires 2 backend endpoints:

1. **Learning State** → Current performance state, risk, prescription
2. **Learning History** → Transition timeline for state changes

---

## 📌 ENDPOINT 1: Learning State

### **GET /api/analytics/learning-state**

**Purpose:** Provide current learning state with risk analysis and prescription

**Auth:** Required (JWT token via Bearer header)

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "overall": {
      "state": "DECLINING",
      "momentum": -18
    },
    "chronic_risk": false,
    "days_in_state": 5,
    "primary_risk": {
      "concept_name": "Acid-Base Regulation",
      "accuracy": 41,
      "attempts": 34,
      "risk_reasons": "High-exposure, low-retention: answered 34 times, accuracy trending -22% over 12 days"
    },
    "prescription": {
      "type": "Stop repeating. Switch to mechanism-first review of Henderson-Hasselbalch before next attempt.",
      "cta_label": "Change your approach.",
      "target": "Henderson-Hasselbalch mechanism"
    },
    "concept_breakdown": [
      {
        "name": "Acid-Base Regulation",
        "accuracy": 41,
        "attempts": 34,
        "trend": -22,
        "facet": "Mechanism"
      },
      {
        "name": "Renal Tubular Transport",
        "accuracy": 58,
        "attempts": 21,
        "trend": -8,
        "facet": "Application"
      }
    ],
    "session_accuracy": [52, 49, 61, 55, 48, 43, 44, 41],
    "cohort_percentile": 31,
    "session_efficiency": 2.1
  }
}
```

**Field Definitions:**

- **overall.state**: `"DECLINING"` | `"STABLE"` | `"IMPROVING"`
- **overall.momentum**: Percentage change in accuracy over recent period (e.g., -18 = 18% decline)
- **chronic_risk**: Boolean indicating if concept has regressed multiple times
- **days_in_state**: Number of days in current state
- **primary_risk.concept_name**: Name of weakest/most critical concept
- **primary_risk.accuracy**: Current accuracy % for that concept
- **primary_risk.attempts**: Total attempts for that concept
- **primary_risk.risk_reasons**: Explanation of why it's a risk
- **prescription.type**: Main prescription text (what to do)
- **prescription.cta_label**: Button label for CTA
- **prescription.target**: Optional specific target (e.g., textbook chapter)
- **concept_breakdown**: Array of concepts with accuracy, attempts, trend
- **session_accuracy**: Array of accuracy % for last 8 sessions
- **cohort_percentile**: User's percentile rank vs. peers
- **session_efficiency**: Correct answers per minute

**Fallback Behavior (Frontend):**

If API returns null or fails, frontend shows:
- Loading spinner
- Empty state: "No learning state data available. Complete some MCQ sessions to generate insights."

---

## 📌 ENDPOINT 2: Learning History

### **GET /api/analytics/history?limit=30**

**Purpose:** Provide state transition timeline for visualization

**Auth:** Required (JWT token)

**Query Parameters:**
- `limit`: Number of historical state records to return (default: 30)

**Response Structure:**

```json
{
  "success": true,
  "data": [
    { "date": "Jan 28", "state": "STABLE" },
    { "date": "Feb 3", "state": "IMPROVING" },
    { "date": "Feb 10", "state": "STABLE" },
    { "date": "Feb 14", "state": "DECLINING" }
  ]
}
```

**Field Definitions:**

- **date**: Short date format (e.g., "Jan 28", "Feb 3")
- **state**: `"DECLINING"` | `"STABLE"` | `"IMPROVING"`

**State Mapping (for backend reference):**
- `IMPROVING` → 1
- `STABLE` → 0
- `DECLINING` → -1

**Fallback Behavior (Frontend):**

If API returns null or fails, frontend uses:
- Empty array `[]` → Timeline doesn't render

---

## 🏗️ Implementation Notes

### Required Database Queries

**For Learning State:**

1. Calculate current overall state (DECLINING/STABLE/IMPROVING)
2. Calculate momentum (% change in accuracy over last 7-14 days)
3. Identify primary risk concept (lowest accuracy, minimum 3 attempts)
4. Detect chronic risk pattern (concept regressed 3+ times)
5. Calculate days in current state
6. Get concept breakdown (all concepts with accuracy, attempts, trend)
7. Get last 8 session accuracy scores
8. Calculate cohort percentile
9. Calculate session efficiency (correct answers per minute)

**For Learning History:**

1. Query state transition log ordered by date DESC
2. Limit to most recent 30 transitions
3. Format date as "MMM DD"

### Backend Logic Requirements

**State Classification:**
- **DECLINING**: Accuracy dropped >5% in last 7 days OR trending down for 3+ sessions
- **STABLE**: Accuracy within ±5% for 7+ days
- **IMPROVING**: Accuracy increased >5% in last 7 days OR trending up for 3+ sessions

**Chronic Risk Detection:**
- Concept has accuracy <65% currently
- AND has regressed (dropped below 65%) 3+ times in last 90 days

**Prescription Generation:**
- Based on state + momentum + chronic_risk + primary_risk_concept
- Should be deterministic (rules-based, not LLM)
- Examples in frontend getMicrocopy() function

---

## 🧪 Testing Checklist

**Test Case 1:** User with sufficient data
```
Given: User has 50+ question attempts across 5+ concepts
When: GET /api/analytics/learning-state
Then: 
  - overall.state should be valid state
  - concept_breakdown should have 5+ items
  - session_accuracy should have up to 8 values
```

**Test Case 2:** New user
```
Given: User has <10 question attempts
When: GET /api/analytics/learning-state
Then: 
  - May return minimal data or null
  - Frontend shows "complete MCQ sessions" message
```

**Test Case 3:** History timeline
```
Given: User has 10+ days of activity
When: GET /api/analytics/history?limit=30
Then:
  - Returns array of state changes ordered chronologically
  - Each item has date + state
```

---

## ⚠️ Current Status

**Base URL:** `https://synapse-backend-k07r.onrender.com`

**Frontend Endpoints Configured:**
- ✅ `GET /api/analytics/learning-state` (useLearningState hook)
- ✅ `GET /api/analytics/history?limit=30` (useLearningHistory hook)

**Frontend Status:** 
- ✅ PerformancePage implemented
- ✅ Null-safety implemented
- ✅ Loading/empty states implemented
- ✅ Wired to /analytics route

**Backend Status:** 
- ❓ Endpoints not yet implemented (assumed)
- ❓ Need to verify if routes exist

**Next Steps:**
1. Backend team implements these 2 endpoints
2. Test with real user data
3. Verify response shapes match spec
4. Deploy and monitor

---

## 📊 Sample Response (Full Example)

```json
{
  "success": true,
  "data": {
    "overall": {
      "state": "DECLINING",
      "momentum": -18
    },
    "chronic_risk": false,
    "days_in_state": 5,
    "primary_risk": {
      "concept_name": "Acid-Base Regulation",
      "accuracy": 41,
      "attempts": 34,
      "risk_reasons": "High-exposure, low-retention: answered 34 times, accuracy trending -22% over 12 days"
    },
    "prescription": {
      "type": "Stop repeating. Switch to mechanism-first review of Henderson-Hasselbalch before next attempt.",
      "cta_label": "Change your approach.",
      "target": "Henderson-Hasselbalch mechanism"
    },
    "concept_breakdown": [
      { "name": "Acid-Base Regulation", "accuracy": 41, "attempts": 34, "trend": -22, "facet": "Mechanism" },
      { "name": "Renal Tubular Transport", "accuracy": 58, "attempts": 21, "trend": -8, "facet": "Application" },
      { "name": "Cardiac Output", "accuracy": 73, "attempts": 18, "trend": 4, "facet": "Physiology" },
      { "name": "Loop Diuretics", "accuracy": 62, "attempts": 15, "trend": -3, "facet": "Pharmacology" },
      { "name": "GFR Regulation", "accuracy": 79, "attempts": 12, "trend": 11, "facet": "Physiology" }
    ],
    "session_accuracy": [52, 49, 61, 55, 48, 43, 44, 41],
    "cohort_percentile": 31,
    "session_efficiency": 2.1
  }
}
```

---

## 🔗 Related Documentation

- `BACKEND_ANALYTICS_ENDPOINTS.md` - Dashboard, Concept, Rushed endpoints
- `BEHAVIORAL_PRESCRIPTION_ENGINE.md` - Momentum classification logic
- `src/modules/analytics/PerformancePage.jsx` - Frontend implementation
- `src/modules/analytics/hooks/useLearningState.js` - Learning state hook
- `src/modules/analytics/hooks/useLearningHistory.js` - History hook
