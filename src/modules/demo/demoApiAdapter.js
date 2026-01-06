// src/modules/demo/demoApiAdapter.js
// Demo Mode API router: given a request descriptor, decide whether
// to return static demo data or fall through to real backend.

import {
  DEMO_FILE_ID,
  demoFileMetadata,
  demoFileViewerFile,
  DEMO_IMAGE_ONLY_PAGE_INDEX,
  DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT,
  demoAstraExplainImageResponse,
  DEMO_MCQ_DECK_ID,
  demoMcqDeck,
  demoMcqQuestions,
  demoMcqProgressInProgress,
  demoMcqProgressCompleted,
  demoMcqReadyNotification,
  DEMO_SUMMARY_ID,
  demoSummary,
} from "./demoData";

/**
 * @param {{ method: string, url: string, body?: any }} req
 * @returns {{ handled: boolean, data?: any }}
 */
export function getDemoResponse(req) {
  const { method = "GET", url = "", body } = req || {};
  const upperMethod = String(method).toUpperCase();

  // Library list → demo file metadata
  if (
    upperMethod === "GET" &&
    (url.includes("/library/root") || url.includes("/library/children"))
  ) {
    return {
      handled: true,
      data: [demoFileMetadata],
    };
  }

  // File open / FileViewer file by ID
  if (upperMethod === "GET" && url.includes("/library/item/")) {
    // Always return the demo file when Demo Mode is active
    return {
      handled: true,
      data: demoFileViewerFile,
    };
  }

  // Astra chat — check for summary messages first, then file-based messages
  if (upperMethod === "POST" && url.includes("/ai/tutor/chat")) {
    // Check for summary-based messages first
    const bodySummaryId = body?.summaryId || body?.payload?.summaryId;
    if (bodySummaryId === DEMO_SUMMARY_ID) {
      // This is a demo summary message - return canned response
      const selectionText = body?.selectionText || body?.payload?.content || body?.content || "";
      return {
        handled: true,
        data: {
          success: true,
          answer: {
            answer: `This is a demo response about the selected text: "${selectionText.substring(0, 50)}...". In the real app, Astra would provide detailed explanations based on the summary content and your selection.`,
          },
        },
        text: `This is a demo response about the selected text: "${selectionText.substring(0, 50)}...". In the real app, Astra would provide detailed explanations based on the summary content and your selection.`,
        raw: {
          answer: `This is a demo response about the selected text: "${selectionText.substring(0, 50)}...". In the real app, Astra would provide detailed explanations based on the summary content and your selection.`,
        },
      };
    }
    
    // Check for file-based "Explain this image" prompt
    const msg = body?.message || "";
    if (
      typeof msg === "string" &&
      msg.toLowerCase().includes(DEMO_ASTRA_EXPLAIN_IMAGE_PROMPT.toLowerCase())
    ) {
      return {
        handled: true,
        data: {
          success: true,
          answer: {
            answer: demoAstraExplainImageResponse,
          },
        },
      };
    }
    // For other prompts, fall through to real backend
    return { handled: false };
  }

  // MCQ deck list
  if (upperMethod === "GET" && url === "/ai/mcq/decks") {
    return {
      handled: true,
      data: {
        decks: [demoMcqDeck],
      },
    };
  }

  // MCQ deck by ID (with progress)
  if (upperMethod === "GET" && url.startsWith("/ai/mcq/decks/")) {
    // /ai/mcq/decks/:id or /ai/mcq/decks/:id?...
    const isQuestions = url.includes("/questions");
    const isReview = url.includes("/review");

    if (isQuestions) {
      // MCQ questions for demo deck
      return {
        handled: true,
        data: {
          questions: demoMcqQuestions,
        },
      };
    }

    if (isReview) {
      // For demo, review returns same questions
      return {
        handled: true,
        data: {
          questions: demoMcqQuestions,
        },
      };
    }

    // Deck with progress (use completed progress by default)
    return {
      handled: true,
      data: {
        deck: demoMcqDeck,
        progress: demoMcqProgressCompleted,
      },
    };
  }

  // MCQ start / reset / retake-wrong / answer endpoints
  if (
    upperMethod === "POST" &&
    (url.endsWith("/start") ||
      url.endsWith("/reset") ||
      url.endsWith("/retake-wrong") ||
      url.includes("/ai/mcq/questions/") && url.endsWith("/answer"))
  ) {
    // In demo, we don't mutate; just return canned progress
    const isRetakeWrong = url.endsWith("/retake-wrong");
    const progress = isRetakeWrong
      ? demoMcqProgressInProgress
      : demoMcqProgressCompleted;

    return {
      handled: true,
      data: {
        progress,
        deck: demoMcqDeck,
      },
    };
  }

  // Notifications fetch → single demo notification
  if (upperMethod === "GET" && url.includes("/notifications")) {
    return {
      handled: true,
      data: [demoMcqReadyNotification],
    };
  }

  // Summaries list → demo summary
  if (upperMethod === "GET" && url.includes("/ai/summaries") && !url.includes("/ai/summaries/")) {
    // GET /ai/summaries (list all)
    return {
      handled: true,
      data: {
        summaries: [demoSummary],
      },
    };
  }

  // Summary by ID → demo summary
  if (upperMethod === "GET" && url.includes("/ai/summaries/")) {
    // GET /ai/summaries/:id
    const summaryIdMatch = url.match(/\/ai\/summaries\/([^/?]+)/);
    if (summaryIdMatch && summaryIdMatch[1] === DEMO_SUMMARY_ID) {
      return {
        handled: true,
        data: {
          summary: demoSummary,
        },
      };
    }
    return { handled: false };
  }

  // Default: not handled
  return { handled: false };
}

