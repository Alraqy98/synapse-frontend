// src/modules/demo/demoScript.js
// Step definitions for Demo Mode showroom (Steps 1-10)

import { DEMO_FILE_ID, DEMO_IMAGE_ONLY_PAGE_INDEX } from "./demoData/demoFile";
import { DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT } from "./demoData/demoAstra";
import { DEMO_SUMMARY_ID } from "./demoData/demoSummary";
import { DEMO_MCQ_DECK_ID } from "./demoData/demoMcq";

/**
 * Step definitions for Demo Mode
 * Each step enforces route, highlights target, performs scripted actions, and shows overlay text.
 */
export const DEMO_STEPS = {
  1: {
    route: "/library",
    highlight: "[data-demo='demo-file-card']",
    overlayText: "Upload anything. We handle the rest.\n\nSlides, PDFs, notes, scans — whatever file you have is automatically converted and viewable inside Synapse.\n\nNo exporting. No reformatting. No extra steps.",
    scriptedAction: {
      type: "open_file",
      fileId: DEMO_FILE_ID,
    },
    autoAdvance: {
      condition: "fileviewer_visible",
      route: `/library/${DEMO_FILE_ID}`,
    },
  },
  2: {
    route: `/library/${DEMO_FILE_ID}`,
    highlight: "[data-demo='page-canvas']",
    overlayText: "This slide has no readable text.\n\nNormally, that's where most tools stop being useful.",
    scriptedAction: {
      type: "navigate_page",
      pageNumber: DEMO_IMAGE_ONLY_PAGE_INDEX + 1, // 1-based (page 2)
    },
    autoAdvance: false, // Manual advance via Next button
  },
  3: {
    route: `/library/${DEMO_FILE_ID}`,
    highlight: "[data-demo='astra-response-bubble']", // Highlight the response, not the input
    overlayText: "No text on the slide? That's usually a problem. Not with Astra.\n\nNormally, you'd screenshot this image, switch apps, paste it into another AI tool, explain the context, and hope for a useful answer.\n\nWith Synapse, Astra already sees your file. Just ask in the chat — no switching, no copy-paste.\n\nAstra is Synapse's built-in AI tutor, designed for real medical study materials.",
    scriptedAction: {
      type: "auto_show_response", // Auto-show response, no user interaction needed
    },
    autoAdvance: false, // Manual advance via Next button
  },
  4: {
    route: `/library/${DEMO_FILE_ID}`,
    highlight: "[data-demo='quick-actions-bar']",
    overlayText: "One file. Multiple study tools.\n\nFrom a single upload, Synapse generates summaries, flashcards, and MCQs — everything you need to master your material.",
    scriptedAction: {
      type: "navigate_to_summaries",
    },
    autoAdvance: false, // Manual advance only - user must click Next button
  },
  5: {
    route: `/summaries/${DEMO_SUMMARY_ID}`,
    highlight: "[data-demo='summary-text']",
    overlayText: "Summaries are your main study format.\n\nEvery file becomes a structured, easy-to-review summary. No more flipping through pages — just the key information you need.",
    scriptedAction: null,
    autoAdvance: false, // Manual advance via Next button
  },
  6: {
    route: `/summaries/${DEMO_SUMMARY_ID}`,
    highlight: "[data-demo='demo-summary-response']",
    overlayText: "Normally, you'd screenshot this, switch apps, paste it into another AI, and explain the context.\n\nWith Synapse, Astra already understands your material. Just ask — right where you study.",
    scriptedAction: {
      type: "auto_show_summary_response",
    },
    autoAdvance: false, // User clicks Next to advance
  },
  7: {
    route: "/flashcards",
    highlight: "[data-demo='flashcard-deck-card']",
    overlayText: "Flashcards are generated automatically from your material.\n\nReview what matters. When it matters.",
    scriptedAction: null,
    autoAdvance: false, // Manual advance via Next button
  },
  8: {
    route: `/mcq/${DEMO_MCQ_DECK_ID}`,
    highlight: "[data-demo='mcq-deck-title']",
    overlayText: "Exam-style questions, generated from your own material.",
    scriptedAction: {
      type: "start_mcq_demo",
    },
    autoAdvance: false, // Manual advance via Next button
  },
  9: {
    route: `/mcq/${DEMO_MCQ_DECK_ID}`,
    highlight: "[data-demo='mcq-question-text']",
    overlayText: "Exam-style questions, generated from your own material.",
    scriptedAction: {
      type: "show_mcq_question",
    },
    autoAdvance: false, // Manual advance via Next button
  },
  10: {
    route: `/mcq/${DEMO_MCQ_DECK_ID}`,
    highlight: "[data-demo='mcq-option']",
    overlayText: "Every choice is evaluated instantly.",
    scriptedAction: {
      type: "select_wrong_answer",
    },
    autoAdvance: false, // Manual advance via Next button
  },
  11: {
    route: `/mcq/${DEMO_MCQ_DECK_ID}`,
    highlight: "[data-demo='mcq-explanation-container']",
    overlayText: "Every answer is explained — so you learn, not just guess.",
    scriptedAction: {
      type: "show_explanation",
    },
    autoAdvance: false, // Final MCQ step - user clicks Next
  },
  12: {
    route: "/dashboard",
    highlight: null, // No highlight on final step
    overlayText: "Ready to get started? Upload your first file and see how Synapse works with your own content.",
    scriptedAction: null,
    autoAdvance: false, // Final step - user clicks "Upload your first file" to exit
  },
};

/**
 * Get step definition by step number
 */
export function getStep(stepNumber) {
  return DEMO_STEPS[stepNumber] || null;
}

/**
 * Check if step requires route change
 */
export function getRequiredRoute(stepNumber) {
  const step = getStep(stepNumber);
  return step?.route || null;
}

