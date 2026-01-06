// src/modules/demo/demoData/demoFlashcards.js
// Static demo flashcard deck data for Demo Mode.

import { DEMO_FILE_ID } from "./demoFile";

export const DEMO_FLASHCARD_DECK_ID = "demo-flashcard-ct";

export const demoFlashcardDeck = {
  id: DEMO_FLASHCARD_DECK_ID,
  title: "Abdominal CT Lecture - Key Concepts",
  card_count: 12,
  file_ids: [DEMO_FILE_ID],
  file_name: "Abdominal_CT_Lecture.pptx",
  created_at: new Date().toISOString(),
  generating: false,
  status: "ready",
};

