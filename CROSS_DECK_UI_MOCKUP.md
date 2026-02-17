# Cross-Deck Intelligence UI Mockup

## MCQ Finished Screen - Before vs. After

---

## BEFORE (Current Implementation)

```
┌─────────────────────────────────────────────────────────┐
│                     Deck complete                       │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │              Score: 18/20 (90%)                │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  Total time: 08:30        Avg/question: 00:25         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         Performance Mentor                      │  │
│  │                                                 │  │
│  │  Strong performance with 90% accuracy.         │  │
│  │                                                 │  │
│  │  Key Signals:                                  │  │
│  │  Avg Correct: 28s  Avg Incorrect: 15s         │  │
│  │  Rushed Mistakes: 1  Variability: ±6s         │  │
│  │                                                 │  │
│  │  What this suggests:                           │  │
│  │  • Rushed mistakes                             │  │
│  │                                                 │  │
│  │  Next attempt focus:                           │  │
│  │  • Allocate minimum time per question          │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Review Mistakes]  [Review All]                       │
│  [Retake Mistakes]  [Restart Deck]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## AFTER (With Cross-Deck Intelligence)

```
┌─────────────────────────────────────────────────────────┐
│                     Deck complete                       │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │              Score: 18/20 (90%)                │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  Total time: 08:30        Avg/question: 00:25         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         Performance Mentor                      │  │
│  │                                                 │  │
│  │  Strong performance with 90% accuracy.         │  │
│  │                                                 │  │
│  │  Key Signals:                                  │  │
│  │  Avg Correct: 28s  Avg Incorrect: 15s         │  │
│  │  Rushed Mistakes: 1  Variability: ±6s         │  │
│  │                                                 │  │
│  │  What this suggests:                           │  │
│  │  • Rushed mistakes                             │  │
│  │                                                 │  │
│  │  Next attempt focus:                           │  │
│  │  • Allocate minimum time per question          │  │
│  │                                                 │  │
│  │  ═══════════════════════════════════════════   │  │
│  │                                                 │  │
│  │  Longitudinal Performance                  NEW │  │
│  │                                                 │  │
│  │  Total Answers  Global Accuracy  7-Day Change │  │
│  │      350            78%             +8%        │  │
│  │                                                 │  │
│  │  Weakest File                                  │  │
│  │  Cardiology Textbook                           │  │
│  │  52% accuracy                                  │  │
│  │                                                 │  │
│  │  Weakest Page                                  │  │
│  │  Anatomy Atlas - Page 42                       │  │
│  │  35% accuracy                                  │  │
│  │                                                 │  │
│  │  ┌───────────────────────────────────────┐    │  │
│  │  │ Improvement detected: Current accuracy│    │  │
│  │  │ (90%) exceeds historical file average │    │  │
│  │  │ (75%) by 15%.                         │    │  │
│  │  └───────────────────────────────────────┘    │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Review Mistakes]  [Review All]                       │
│  [Retake Mistakes]  [Restart Deck]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### New Section: Longitudinal Performance

```
╔═══════════════════════════════════════════════════╗
║         Longitudinal Performance                  ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐       ║
║  │  Total   │  │  Global  │  │  7-Day   │       ║
║  │ Answers  │  │ Accuracy │  │  Change  │       ║
║  │   350    │  │   78%    │  │   +8%    │       ║
║  └──────────┘  └──────────┘  └──────────┘       ║
║                                                   ║
║  ┌─────────────────────────────────────────┐    ║
║  │ Weakest File                             │    ║
║  │ Cardiology Textbook                      │    ║
║  │ 52% accuracy                             │    ║
║  └─────────────────────────────────────────┘    ║
║                                                   ║
║  ┌─────────────────────────────────────────┐    ║
║  │ Weakest Page                             │    ║
║  │ Anatomy Atlas - Page 42                  │    ║
║  │ 35% accuracy                             │    ║
║  └─────────────────────────────────────────┘    ║
║                                                   ║
║  ┌─────────────────────────────────────────┐    ║
║  │ [Contextual Message]                     │    ║
║  │ • Improvement message (teal border)      │    ║
║  │   OR                                      │    ║
║  │ • Reinforcement message (red border)     │    ║
║  └─────────────────────────────────────────┘    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## Display Conditions

### When Longitudinal Section Appears

```
IF (overview.totals.answers >= 20)
  SHOW Longitudinal Performance
ELSE
  HIDE Longitudinal Performance
END
```

### Conditional Sub-Components

```
Global Stats Grid
  ├── Total Answers       (always shown)
  ├── Global Accuracy     (always shown)
  └── 7-Day Change        (IF analytics.seven_day_improvement_delta exists)

Weakest Areas
  ├── Weakest File        (IF weakest_file.file_title exists)
  └── Weakest Page        (IF weakest_page.file_title exists)

Contextual Message
  ├── Improvement         (IF current > historical + 10%)
  ├── Reinforcement       (IF historical < 60% AND current < 60%)
  └── None                (OTHERWISE)
```

---

## Real-World Example: Struggling Student

### Scenario
- User has answered 120 questions across 5 decks
- Global accuracy: 55%
- Current deck: Cardiology (45% accuracy)
- File historical accuracy: 48%
- 7-day change: -3%

### Display

```
┌─────────────────────────────────────────────────────────┐
│         Performance Mentor                              │
│                                                         │
│  45% accuracy suggests room for improvement.           │
│  Review insights below.                                │
│                                                         │
│  Key Signals:                                          │
│  Avg Correct: 42s  Avg Incorrect: 28s                 │
│  Rushed Mistakes: 3  Variability: ±12s                │
│                                                         │
│  What this suggests:                                   │
│  • Impulsive under uncertainty (HIGH)                  │
│  • Rushed mistakes (HIGH)                              │
│  • Inconsistent pacing (MED)                           │
│                                                         │
│  Next attempt focus:                                   │
│  • Slow down on unfamiliar questions                   │
│  • Allocate minimum time per question                  │
│  • Develop consistent time strategy                    │
│                                                         │
│  ════════════════════════════════════════════          │
│                                                         │
│  Longitudinal Performance                              │
│                                                         │
│  Total Answers  Global Accuracy  7-Day Change         │
│      120            55%             -3%                │
│                                                         │
│  Weakest File                                          │
│  Pharmacology Textbook                                 │
│  40% accuracy                                          │
│                                                         │
│  Weakest Page                                          │
│  Cardiology - Page 23                                  │
│  30% accuracy                                          │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │ ⚠️ This file has historically low accuracy  │      │
│  │ (48%). Current performance (45%) suggests   │      │
│  │ continued difficulty. Consider focused      │      │
│  │ review of this material.                    │      │
│  └─────────────────────────────────────────────┘      │
│                 (RED BORDER)                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Real-World Example: Improving Student

### Scenario
- User has answered 350 questions across 12 decks
- Global accuracy: 78%
- Current deck: Anatomy (85% accuracy)
- File historical accuracy: 70%
- 7-day change: +8%

### Display

```
┌─────────────────────────────────────────────────────────┐
│         Performance Mentor                              │
│                                                         │
│  Strong performance with 85% accuracy.                 │
│  Excellent work.                                       │
│                                                         │
│  Key Signals:                                          │
│  Avg Correct: 25s  Avg Incorrect: 18s                 │
│  Rushed Mistakes: 0  Variability: ±5s                 │
│                                                         │
│  What this suggests:                                   │
│  • Strong and stable performance (LOW)                 │
│                                                         │
│  Next attempt focus:                                   │
│  • Maintain consistency                                │
│                                                         │
│  ════════════════════════════════════════════          │
│                                                         │
│  Longitudinal Performance                              │
│                                                         │
│  Total Answers  Global Accuracy  7-Day Change         │
│      350            78%             +8%                │
│                                                         │
│  Weakest File                                          │
│  Cardiology Textbook                                   │
│  52% accuracy                                          │
│                                                         │
│  Weakest Page                                          │
│  Pharmacology - Page 12                                │
│  48% accuracy                                          │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │ ✓ Improvement detected: Current accuracy    │      │
│  │ (85%) exceeds historical file average       │      │
│  │ (70%) by 15%.                               │      │
│  └─────────────────────────────────────────────┘      │
│                 (TEAL BORDER)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Color Coding

### Stats Colors

| Element | Color | Tailwind Class |
|---------|-------|---------------|
| Correct time | Teal | `text-teal` |
| Incorrect time | Red | `text-red-400` |
| Global accuracy | Teal | `text-teal` |
| 7-day positive | Teal | `text-teal` |
| 7-day negative | Red | `text-red-400` |
| 7-day neutral | White | `text-white` |
| Weakest file accuracy | Red | `text-red-400` |
| Weakest page accuracy | Red | `text-red-400` |

### Contextual Message Borders

| Message Type | Border Color | Tailwind Class |
|-------------|--------------|----------------|
| Improvement | Teal | `border-teal/30` |
| Reinforcement | Red | `border-red-400/30` |

---

## Responsive Behavior

### Desktop (> 768px)

```
Global Stats Grid: 3 columns
Weakest Areas: Full width cards
Contextual Message: Full width
```

### Tablet (640px - 768px)

```
Global Stats Grid: 3 columns (wrapped)
Weakest Areas: Full width cards
Contextual Message: Full width
```

### Mobile (< 640px)

```
Global Stats Grid: 2 columns
  Row 1: Total Answers | Global Accuracy
  Row 2: 7-Day Change (if exists)
Weakest Areas: Full width cards (stacked)
Contextual Message: Full width (wrapped text)
```

---

## Empty States

### Case 1: New User (< 20 answers)

```
┌─────────────────────────────────────────────────────────┐
│         Performance Mentor                              │
│                                                         │
│  [Current attempt analysis only]                       │
│                                                         │
│  [NO Longitudinal Performance section]                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Case 2: API Failure

```
┌─────────────────────────────────────────────────────────┐
│         Performance Mentor                              │
│                                                         │
│  [Current attempt analysis only]                       │
│                                                         │
│  [NO Longitudinal Performance section]                 │
│  [Error logged to console, UI graceful]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Case 3: Missing Weakest Data

```
┌─────────────────────────────────────────────────────────┐
│  Longitudinal Performance                              │
│                                                         │
│  Total Answers  Global Accuracy  7-Day Change         │
│      350            78%             +8%                │
│                                                         │
│  [Weakest File section omitted if null]                │
│  [Weakest Page section omitted if null]                │
│                                                         │
│  [Contextual message only if analytics exists]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### CSS Classes Used

**Container**:
```css
panel p-6 rounded-2xl border border-white/10
```

**Section Divider**:
```css
border-t border-white/10 pt-5
```

**Stats Grid**:
```css
grid grid-cols-2 sm:grid-cols-3 gap-3
```

**Stat Card**:
```css
panel p-3 rounded-lg border border-white/10
```

**Contextual Message**:
```css
panel p-3 rounded-lg border border-teal/30 bg-white/[0.02]
```

### Typography

**Section Header**: `text-sm font-semibold`  
**Stat Label**: `text-[10px] uppercase tracking-wider text-muted`  
**Stat Value**: `text-base font-semibold`  
**Card Title**: `text-xs text-muted`  
**Card Content**: `text-sm font-medium text-white`  
**Message**: `text-xs leading-relaxed text-white`

---

## Accessibility

### Screen Reader Support

```html
<div aria-label="Longitudinal performance data">
  <div role="region" aria-labelledby="stats-heading">
    <h4 id="stats-heading">Global Statistics</h4>
    ...
  </div>
</div>
```

### Keyboard Navigation

- All interactive elements accessible via Tab
- Contextual messages are read by screen readers
- Color is not sole indicator of meaning (text also provided)

---

**End of Mockup**
