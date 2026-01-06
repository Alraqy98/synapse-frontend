// src/modules/demo/demoScript.js
// Step definitions for Demo Mode showroom (Steps 1-4 only)

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
    overlayText: "Any file you upload—slides, notes, even scans—is instantly converted and ready to study.",
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
    highlight: "[data-demo='astra-chat-container']", // Highlights both input + send button
    overlayText: "Astra understands images—even when there's no text. Ask it anything.",
    scriptedAction: {
      type: "prefill_input",
      text: DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT,
      target: "[data-demo='astra-chat-input']",
    },
    autoAdvance: {
      condition: "astra_response_visible", // Auto-advance to Step 4 after response renders
    },
  },
  4: {
    route: `/library/${DEMO_FILE_ID}`,
    highlight: "[data-demo='astra-response-bubble']", // Highlights the Astra answer bubble
    overlayText: "Astra understands images using vision and prompt enhancement—even when there's no text.",
    scriptedAction: null,
    autoAdvance: false, // Manual advance via Next button
  },
  5: {
    route: `/library/${DEMO_FILE_ID}`,
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

