/**
 * Static mock data for Remotion demo scenes.
 * Pass these as props so real components don't fetch.
 */

export const MOCK_PROFILE = {
  full_name: "Mohammed",
};

export const MOCK_DASHBOARD = {
  recentFiles: [
    { id: "f1", title: "5 Newborn Physical Examination.pdf", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), uiCategory: "PDF" },
    { id: "f2", title: "Pediatric History Taking.docx", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(), uiCategory: "Document" },
  ],
  recentGenerations: [
    { type: "summary", id: "s1", title: "Newborn Exam Summary", created_at: new Date(Date.now() - 3600000).toISOString() },
    { type: "mcq", id: "m1", title: "Newborn MCQ Deck", created_at: new Date(Date.now() - 7200000).toISOString() },
  ],
  upcomingEvents: [
    { id: "e1", title: "OSCE Practice", event_date: "2026-03-15", event_type: "exam" },
    { id: "e2", title: "Ward Round", event_date: "2026-03-18", event_type: "lecture" },
  ],
};

export const MOCK_FILE_VIEWER = {
  file: {
    id: "file-demo",
    title: "5 Newborn Physical Examination.pdf",
    name: "5 Newborn Physical Examination.pdf",
    totalPages: 77,
    currentPage: 17,
  },
  chatMessages: [
    { id: "u1", role: "user", text: "explain" },
    {
      id: "a1",
      role: "assistant",
      text: "On the newborn physical exam, key steps include inspection (color, breathing, tone), head (fontanelles, caput), heart (rate, murmurs), abdomen (cord, masses), hips (Barlow/Ortolani), and reflexes. Page 17 covers the cardiovascular examination: assess heart rate (normal 120–160), listen for murmurs (common benign PDA in first 24–48h), and check peripheral pulses.",
    },
  ],
};

export const MOCK_MCQ_QUESTION = {
  id: "q1",
  question: "During the newborn physical examination, you note a heart murmur. Which of the following is the most common cause of a benign murmur in the first 24–48 hours of life?",
  options_full: [
    { letter: "A", option_text: "Ventricular septal defect", is_correct: false, explanation: "VSD can cause a murmur but is not the most common benign cause in the first 24–48h." },
    { letter: "B", option_text: "Patent ductus arteriosus (PDA)", is_correct: true, explanation: "PDA is the most common cause of a benign murmur in the first 24–48 hours as the ductus is still closing." },
    { letter: "C", option_text: "Tetralogy of Fallot", is_correct: false, explanation: "TOF is a cyanotic defect and would not typically present as a benign murmur." },
    { letter: "D", option_text: "Coarctation of the aorta", is_correct: false, explanation: "Coarctation typically presents with differential pulses or hypertension, not just a murmur." },
  ],
};

export const MOCK_LEARNING_STATE = {
  state: "STABLE",
  momentum: -26.3,
  primaryRisk: { concept: "Congenital Glaucoma", accuracy: 0, attempts: 3 },
  intervention: { type: "MEMORY_REINFORCEMENT", duration: 20 },
  specialty: "Pediatrics",
};

export const MOCK_REINFORCEMENT_SESSION = {
  session_id: "demo-session",
  started_at: new Date().toISOString(),
  duration_minutes: 20,
  questions: [
    {
      id: "rq1",
      question_text: "A term newborn has a persistent heart murmur at 24 hours. The most likely benign cause is:",
      options: [
        { id: "ro1", option_text: "PDA", is_correct: true },
        { id: "ro2", option_text: "VSD", is_correct: false },
        { id: "ro3", option_text: "ASD", is_correct: false },
        { id: "ro4", option_text: "TOF", is_correct: false },
      ],
    },
  ],
};

export const MOCK_PLANNER_EVENTS = [
  { id: "p1", title: "Oral Exam - Pediatrics", event_date: "2026-03-24", event_type: "oral", color: "#EF4444" },
  { id: "p2", title: "Oral Exam - Clinical Skills", event_date: "2026-03-24", event_type: "oral", color: "#EF4444" },
];

export const MOCK_PLANNER_MONTH = { year: 2026, month: 2 }; // March 2026 (0-indexed 2)
