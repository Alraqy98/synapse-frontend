// src/modules/demo/demoScript.js
// Step definitions for Demo Mode showroom (Steps 1-3 only)

import { DEMO_FILE_ID, DEMO_IMAGE_ONLY_PAGE_INDEX } from "./demoData/demoFile";
import { DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT } from "./demoData/demoAstra";

/**
 * Step definitions for Demo Mode
 * Each step enforces route, highlights target, performs scripted actions, and shows overlay text.
 */
export const DEMO_STEPS = {
  1: {
    route: "/library",
    highlight: "[data-demo='demo-file-card']",
    overlayText: "Any file you upload is converted and viewed instantly as a PDF — slides, notes, anything.",
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
    overlayText: "This slide has no readable text. Just an image.",
    scriptedAction: {
      type: "navigate_page",
      pageNumber: DEMO_IMAGE_ONLY_PAGE_INDEX + 1, // 1-based (page 2)
    },
    autoAdvance: false, // Manual advance via Next button
  },
  3: {
    route: `/library/${DEMO_FILE_ID}`,
    highlight: "[data-demo='astra-chat-input']",
    overlayText: "Astra understands images — even when there's no text — using vision and prompt enhancement.",
    scriptedAction: {
      type: "auto_type_and_send",
      text: DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT,
      target: "[data-demo='astra-chat-input']",
    },
    autoAdvance: {
      condition: "astra_response_visible",
    },
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

