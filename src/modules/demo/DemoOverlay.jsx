import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useDemo } from "./DemoContext";
import { getStep, getRequiredRoute } from "./demoScript";
import { DEMO_FILE_ID, DEMO_IMAGE_ONLY_PAGE_INDEX } from "./demoData/demoFile";
import { DEMO_SUMMARY_ID } from "./demoData/demoSummary";
import { DEMO_MCQ_DECK_ID } from "./demoData/demoMcq";

// DemoOverlay - Script Engine + Step Renderer
// Handles step-specific highlights, overlay text, scripted actions, and strict interaction locking.

export default function DemoOverlay() {
  const { isDemo, exitDemo, currentStep, nextStep } = useDemo() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [overlayText, setOverlayText] = useState("");
  const scriptActionRef = useRef(null);
  const stepRef = useRef(null);

  // Inject CSS for demo button animations (run once)
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    if (!document.getElementById("demo-overlay-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "demo-overlay-styles";
      styleSheet.textContent = `
      @keyframes demo-pulse {
        0%, 100% {
          box-shadow: 0 0 25px rgba(0, 245, 204, 0.7), 0 0 50px rgba(0, 245, 204, 0.5);
        }
        50% {
          box-shadow: 0 0 35px rgba(0, 245, 204, 0.9), 0 0 70px rgba(0, 245, 204, 0.7);
        }
      }
      
      .demo-primary-cta {
        cursor: pointer;
      }
      
      /* Disable background dimming behind Next button */
      [data-demo-overlay-content] .demo-primary-cta {
        position: relative;
        z-index: 10002;
      }
      
      /* Step 9-12: Ensure MCQ question text and options are always visible above dimmed backdrop */
      [data-demo="mcq-question-text"],
      [data-demo="mcq-option"],
      [data-demo="mcq-explain-all-button"],
      [data-demo="mcq-explanation-container"] {
        position: relative !important;
        z-index: 10001 !important;
        isolation: isolate;
      }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  // Get current step definition
  const step = currentStep ? getStep(currentStep) : null;
  const requiredRoute = currentStep ? getRequiredRoute(currentStep) : null;

  // Route enforcement: auto-navigate to required route
  useEffect(() => {
    if (!isDemo || !currentStep || !requiredRoute) return;

    const currentPath = location.pathname;
    if (currentPath !== requiredRoute && !currentPath.startsWith(requiredRoute)) {
      // Auto-navigate to required route
      navigate(requiredRoute, { replace: true });
    }
  }, [isDemo, currentStep, requiredRoute, location.pathname, navigate]);

  // Step 1: Auto-open demo file when on /library
  useEffect(() => {
    if (!isDemo || currentStep !== 1) return;
    if (location.pathname !== "/library") return;

    // Wait for demo file card to appear, then auto-click it
    const timer = setTimeout(() => {
      const fileCard = document.querySelector("[data-demo='demo-file-card']");
      if (fileCard) {
        fileCard.click();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isDemo, currentStep, location.pathname]);

  // Step 2: Auto-navigate to page 2 (image-only) when FileViewer is visible
  useEffect(() => {
    if (!isDemo || currentStep !== 2) return;
    if (!location.pathname.includes(`/library/${DEMO_FILE_ID}`)) return;

    // Check if FileViewer root is present
    const fileViewerRoot = document.querySelector("[data-demo='fileviewer-root']");
    if (!fileViewerRoot) return;

    // Navigate to page 2 (image-only page)
    const targetPage = DEMO_IMAGE_ONLY_PAGE_INDEX + 1; // 1-based
    if (location.pathname !== `/library/${DEMO_FILE_ID}/page/${targetPage}`) {
      navigate(`/library/${DEMO_FILE_ID}/page/${targetPage}`, { replace: true });
    }
  }, [isDemo, currentStep, location.pathname, navigate]);

  // Step 3: Auto-type and send is handled by FileViewer component
  // (FileViewer listens to demo context and auto-executes scripted action)

  // Step 4: Auto-navigate to summaries when quick actions bar is visible
  // Navigation only - NO auto-advance (user must click Next)
  // Delay navigation until overlay is fully mounted to prevent visual jitter
  useEffect(() => {
    if (!isDemo || currentStep !== 4) return;
    if (!location.pathname.includes(`/library/${DEMO_FILE_ID}`)) return;

    // Wait for overlay to be fully mounted and DOM to be stable
    const timer = setTimeout(() => {
      // Check if quick actions bar is present
      const quickActionsBar = document.querySelector("[data-demo='quick-actions-bar']");
      if (!quickActionsBar) return;

      // Navigate after overlay is stable
      navigate(`/summaries/${DEMO_SUMMARY_ID}`, { replace: true });
    }, 2500); // Increased delay to ensure overlay is fully mounted

    return () => clearTimeout(timer);
  }, [isDemo, currentStep, location.pathname, navigate]);

  // Helper: Wait for element to exist and have dimensions
  const waitForElement = (selector, timeout = 3000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const poll = () => {
        const element = document.querySelector(selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            resolve(element);
            return;
          }
        }
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
          return;
        }
        setTimeout(poll, 50);
      };
      poll();
    });
  };

  // Step 6: Wait for demo summary response bubble to appear
  useEffect(() => {
    if (!isDemo || currentStep !== 6) return;
    if (!location.pathname.includes(`/summaries/${DEMO_SUMMARY_ID}`)) return;

    // Wait for response bubble to appear and have dimensions before highlighting
    const waitForResponse = async () => {
      try {
        const responseBubble = await waitForElement("[data-demo='demo-summary-response']", 3000);
        setHighlightedElement(responseBubble);
      } catch (err) {
        console.warn("[Demo] Summary response bubble not found:", err);
      }
    };

    // Small delay to ensure DOM is stable
    const timer = setTimeout(waitForResponse, 500);
    return () => clearTimeout(timer);
  }, [isDemo, currentStep, location.pathname]);

  // Clear text selection when leaving Step 6
  useEffect(() => {
    if (!isDemo) return;
    
    // Clear selection when moving away from Step 6
    if (currentStep !== 6) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  }, [isDemo, currentStep]);

  // Step 9: Wait for MCQ question to appear, then highlight it
  useEffect(() => {
    if (!isDemo || currentStep !== 9) return;
    if (!location.pathname.includes(`/mcq/${DEMO_MCQ_DECK_ID}`)) return;

    const waitForQuestion = async () => {
      try {
        const questionText = await waitForElement("[data-demo='mcq-question-text']", 3000);
        setHighlightedElement(questionText);
      } catch (err) {
        console.warn("[Demo] MCQ question text not found:", err);
      }
    };

    const timer = setTimeout(waitForQuestion, 500);
    return () => clearTimeout(timer);
  }, [isDemo, currentStep, location.pathname]);

  // Step 10: Programmatically select a wrong option (REAL UI change)
  useEffect(() => {
    if (!isDemo || currentStep !== 10) return;
    if (!location.pathname.includes(`/mcq/${DEMO_MCQ_DECK_ID}`)) return;

    const selectWrongOption = async () => {
      try {
        // Wait for question and options to be fully rendered
        await waitForElement("[data-demo='mcq-question-text']", 3000);
        await waitForElement("[data-demo='mcq-option']", 3000);
        
        // Wait a bit more to ensure handlers are exposed
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Find option B (index 1) - "Cavernous hemangioma" which is wrong
        const wrongOption = document.querySelector("[data-demo='mcq-option'][data-demo-index='1']");
        if (wrongOption) {
          // Get the option text from the DOM
          const optionTextElement = wrongOption.querySelector('.flex-1');
          const optionText = optionTextElement?.textContent?.trim();
          
          if (optionText && typeof window !== "undefined" && window.demoMcqSelectOption) {
            // Trigger the REAL handler - this will update UI state
            window.demoMcqSelectOption(optionText);
            
            // Wait for UI to update, then highlight the selected (wrong) option
            setTimeout(() => {
              const updatedOption = document.querySelector("[data-demo='mcq-option'][data-demo-index='1']");
              if (updatedOption) {
                setHighlightedElement(updatedOption);
              }
            }, 400);
          } else if (wrongOption) {
            // Fallback: simulate click if handler not available
            wrongOption.click();
            setTimeout(() => {
              setHighlightedElement(wrongOption);
            }, 300);
          }
        }
      } catch (err) {
        console.warn("[Demo] Failed to select wrong option:", err);
      }
    };

    const timer = setTimeout(selectWrongOption, 500);
    return () => clearTimeout(timer);
  }, [isDemo, currentStep, location.pathname]);

  // Step 11: Highlight Explain All button (DO NOT expand yet)
  useEffect(() => {
    if (!isDemo || currentStep !== 11) return;
    if (!location.pathname.includes(`/mcq/${DEMO_MCQ_DECK_ID}`)) return;

    const highlightExplainAllButton = async () => {
      try {
        // Wait for Explain All button to be rendered
        const explainAllButton = await waitForElement("[data-demo='mcq-explain-all-button']", 3000);
        if (explainAllButton) {
          // Auto-scroll the button into view before highlighting
          explainAllButton.scrollIntoView({ 
            behavior: "smooth", 
            block: "center",
            inline: "nearest"
          });
          
          // Wait for scroll to complete before highlighting
          await new Promise(resolve => setTimeout(resolve, 200));
          
          setHighlightedElement(explainAllButton);
        }
      } catch (err) {
        console.warn("[Demo] Explain All button not found:", err);
      }
    };

    const timer = setTimeout(highlightExplainAllButton, 500);
    return () => clearTimeout(timer);
  }, [isDemo, currentStep, location.pathname]);

  // Step 12: Programmatically trigger "Explain All" (REAL expansion)
  useEffect(() => {
    if (!isDemo || currentStep !== 12) return;
    if (!location.pathname.includes(`/mcq/${DEMO_MCQ_DECK_ID}`)) return;

    const triggerExplainAll = async () => {
      try {
        // Wait for answer state to exist (Step 10 must have completed)
        // Check for selected option state
        let retries = 0;
        const maxRetries = 20; // 2 seconds max wait
        while (retries < maxRetries) {
          const hasAnswerState = document.querySelector("[data-demo='mcq-option']")?.classList.contains("border-red-400") ||
                                 document.querySelector("[data-demo='mcq-option']")?.classList.contains("border-teal");
          if (hasAnswerState || (typeof window !== "undefined" && window.demoMcqExplainAll)) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        // Wait a bit more to ensure handlers are ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Trigger the REAL handler - this will expand all explanations
        if (typeof window !== "undefined" && window.demoMcqExplainAll) {
          window.demoMcqExplainAll();
        } else {
          // Fallback: find and click the "Explain All" button
          const explainAllButton = document.querySelector("[data-demo='mcq-explain-all-button']");
          if (explainAllButton) {
            explainAllButton.click();
          }
        }
        
        // Wait for explanations to render, then highlight the first explanation container
        setTimeout(() => {
          const explanationContainers = document.querySelectorAll("[data-demo='mcq-explanation-container']");
          if (explanationContainers.length > 0) {
            setHighlightedElement(explanationContainers[0]);
          }
        }, 600);
      } catch (err) {
        console.warn("[Demo] Failed to trigger explain all:", err);
      }
    };

    const timer = setTimeout(triggerExplainAll, 500);
    return () => clearTimeout(timer);
  }, [isDemo, currentStep, location.pathname]);

  // Update overlay text and highlight target when step changes
  useEffect(() => {
    if (!step) {
      setOverlayText("");
      setHighlightedElement(null);
      return;
    }

    setOverlayText(step.overlayText || "");

    // Find and highlight target element (poll until found)
    // Skip Step 6 - handled programmatically by waitForResponse effect
    // Skip Steps 8, 10-12 - handled by MCQ demo effects
    // Step 9 is handled here
    if (currentStep !== 6 && currentStep !== 8 && currentStep !== 10 && currentStep !== 11 && currentStep !== 12 && currentStep < 8 && step.highlight) {
      const findTarget = () => {
        const target = document.querySelector(step.highlight);
        if (target) {
          setHighlightedElement(target);
        } else {
          // Retry after a short delay if element not found yet
          setTimeout(findTarget, 200);
        }
      };
      findTarget();
    }
    
    // Step 9: Wait for MCQ question to be rendered, then highlight it
    if (currentStep === 9 && step.highlight) {
      const findQuestion = async () => {
        try {
          const questionElement = await waitForElement("[data-demo='mcq-question-text']", 3000);
          if (questionElement) {
            setHighlightedElement(questionElement);
          }
        } catch (err) {
          console.warn("[Demo] MCQ question not found:", err);
        }
      };
      findQuestion();
    }

    // Auto-advance logic for Step 1 (when FileViewer becomes visible)
    if (currentStep === 1 && step.autoAdvance?.condition === "fileviewer_visible") {
      const checkFileViewer = setInterval(() => {
        const fileViewer = document.querySelector("[data-demo='fileviewer-root']");
        if (fileViewer && location.pathname.includes(`/library/${DEMO_FILE_ID}`)) {
          clearInterval(checkFileViewer);
          // Small delay before advancing
          setTimeout(() => {
            nextStep?.();
          }, 1000);
        }
      }, 200);

      return () => clearInterval(checkFileViewer);
    }

    // Step 3: Handle prefill action (prefill input, don't auto-send)
    // Auto-advance to Step 4 is handled by DemoAstraChat after response renders
    if (currentStep === 3 && step.autoAdvance?.condition === "astra_response_visible") {
      const checkResponse = setInterval(() => {
        const responseBubble = document.querySelector("[data-demo='astra-response-bubble']");
        if (responseBubble) {
          clearInterval(checkResponse);
          // Auto-advance is handled by DemoAstraChat component after send
        }
      }, 200);
      return () => clearInterval(checkResponse);
    }
  }, [step, currentStep, location.pathname, nextStep]);

  // ESC key handler
  useEffect(() => {
    if (!isDemo) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        exitDemo?.("escape");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDemo, exitDemo]);

  if (!isDemo) return null;

  const handleBackdropClick = () => {
    // Spec: ANY backdrop click immediately exits demo
    exitDemo?.("backdrop");
  };

  // Calculate highlight position and size
  const highlightStyle = highlightedElement
    ? (() => {
        const rect = highlightedElement.getBoundingClientRect();
        
        // Step 9-12: Reduce shadow opacity for MCQ steps to ensure readability
        const isMCQStep = currentStep === 9 || currentStep === 10 || currentStep === 11 || currentStep === 12;
        const shadowOpacity = isMCQStep ? 0.4 : 0.7; // Less dimming for MCQ steps (0.4 as required)
        
        return {
          position: "absolute",
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          border: "3px solid rgba(0, 245, 204, 0.8)",
          borderRadius: "8px",
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${shadowOpacity}), 0 0 30px rgba(0, 245, 204, 0.5)`,
          pointerEvents: "none",
          zIndex: 10000,
          transition: "all 0.3s ease",
        };
      })()
    : null;

  // Get allowed demo targets for current step
  const getAllowedDemoTargets = () => {
    if (!currentStep) return [];
    const targets = [];
    
    // Step 3: Allow chat container and send button
    if (currentStep === 3) {
      const container = document.querySelector("[data-demo='astra-chat-container']");
      const sendButton = document.querySelector("[data-demo='astra-chat-send']");
      if (container) targets.push(container);
      if (sendButton) targets.push(sendButton);
    }
    
    // Step 6: Allow summary text selection and Ask Astra bubble
    if (currentStep === 6) {
      const summaryText = document.querySelector("[data-demo='summary-text']");
      const askAstraBubble = document.querySelector("[data-demo='summary-ask-astra-bubble']");
      if (summaryText) targets.push(summaryText);
      if (askAstraBubble) targets.push(askAstraBubble);
    }
    
    // Always allow highlighted element
    if (highlightedElement) {
      targets.push(highlightedElement);
    }
    
    return targets;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      onClick={(e) => {
        // Backdrop click: exit demo immediately
        // Only exit if click is on backdrop itself, not on overlay content or allowed demo targets
        const target = e.target;
        const isOverlayContent = target.closest('[data-demo-overlay-content]');
        const isHighlightedElement = highlightedElement && highlightedElement.contains(target);
        
        // Check if target is inside any allowed demo target (structural check)
        const allowedTargets = getAllowedDemoTargets();
        const isInsideAllowedTarget = allowedTargets.some(allowedTarget => {
          return allowedTarget && allowedTarget.contains(target);
        });
        
        // Also check if target itself is an allowed demo element
        const isAllowedDemoElement = target.closest('[data-demo="astra-chat-container"]') ||
                                     target.closest('[data-demo="astra-chat-send"]') ||
                                     target.closest('[data-demo="quick-action-ask-astra"]') ||
                                     target.closest('[data-demo="summary-text"]') ||
                                     target.closest('[data-demo="summary-ask-astra-bubble"]');
        
        if (!isOverlayContent && !isHighlightedElement && !isInsideAllowedTarget && !isAllowedDemoElement) {
          handleBackdropClick();
        }
      }}
      style={{ pointerEvents: "auto" }}
    >
      {/* Highlight ring around target element - allows clicks through to highlighted element */}
      {highlightStyle && (
        <div
      style={{
        ...highlightStyle,
        pointerEvents: "none", // Ring itself doesn't capture clicks
        zIndex: 10000,
      }}
    />
      )}

      {/* Overlay content container */}
      <div
        className="w-full h-full"
        data-demo-overlay-content
        onClick={(e) => {
          // Block clicks inside overlay content from bubbling to backdrop
          e.stopPropagation();
        }}
        style={{ pointerEvents: "none" }}
      >
        {/* Overlay text + Next button */}
        {overlayText && (
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-2xl mx-4 px-6 py-4 rounded-xl bg-black/90 border border-teal/30 shadow-2xl"
            style={{ pointerEvents: "auto", zIndex: 10001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-sm mb-4 leading-relaxed">{overlayText}</p>
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => exitDemo?.("skip")}
                className="text-xs text-muted hover:text-white transition"
              >
                Skip demo
              </button>
              {currentStep === 13 ? (
                <button
                  onClick={() => exitDemo?.("primary_cta_upload")}
                  className="px-5 py-2.5 rounded-lg bg-[#00f5cc] text-black font-semibold hover:bg-[#00ffe0] transition transform hover:scale-105"
                  style={{
                    boxShadow: "0 0 25px rgba(0, 245, 204, 0.7), 0 0 50px rgba(0, 245, 204, 0.5)",
                    zIndex: 10002,
                  }}
                >
                  Upload your first file
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextStep?.();
                  }}
                  className="demo-primary-cta px-5 py-2.5 rounded-lg bg-[#00f5cc] text-black font-semibold hover:bg-[#00ffe0] transition transform hover:scale-105"
                  style={{
                    boxShadow: "0 0 25px rgba(0, 245, 204, 0.7), 0 0 50px rgba(0, 245, 204, 0.5)",
                    animation: "demo-pulse 2s ease-in-out infinite",
                    transform: "scale(1.05)",
                    zIndex: 10002,
                  }}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom indicator (minimal) */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/70 border border-white/10 text-xs text-muted"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          Demo Mode (step {currentStep ?? "?"}) — click outside to exit
        </div>
      </div>
    </div>,
    document.body
  );
}
