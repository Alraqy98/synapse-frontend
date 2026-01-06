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

