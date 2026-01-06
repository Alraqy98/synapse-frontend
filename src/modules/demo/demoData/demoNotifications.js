// src/modules/demo/demoData/demoNotifications.js
// Static demo notification payloads for Demo Mode.

import { DEMO_MCQ_DECK_ID } from "./demoMcq";

// Shape matches normalized notifications in App.jsx:
// {
//   id, type, title, description, read, createdAt,
//   fileId, summaryId, mcqDeckId, flashcardDeckId
// }

export const demoMcqReadyNotification = {
  id: "demo-notif-mcq-ready",
  type: "mcq_completed",
  title: "MCQ deck ready",
  description: "Your abdominal CT practice deck is ready to review.",
  read: false,
  createdAt: new Date().toISOString(),
  fileId: null,
  summaryId: null,
  mcqDeckId: DEMO_MCQ_DECK_ID,
  flashcardDeckId: null,
};


