import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useDemo } from "./DemoContext";
import { getStep, getRequiredRoute } from "./demoScript";
import { DEMO_FILE_ID, DEMO_IMAGE_ONLY_PAGE_INDEX } from "./demoData/demoFile";
import { DEMO_SUMMARY_ID } from "./demoData/demoSummary";

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

  // Step 6: Programmatically trigger text selection to show Ask Astra bubble
  useEffect(() => {
    if (!isDemo || currentStep !== 6) return;
    if (!location.pathname.includes(`/summaries/${DEMO_SUMMARY_ID}`)) return;

    // Wait for summary content to be rendered
    const triggerSelection = async () => {
      const summaryTextContainer = document.querySelector("[data-demo='summary-text']");
      if (!summaryTextContainer) {
        // Retry if not ready yet
        setTimeout(triggerSelection, 200);
        return;
      }

      // Find a text node inside the summary content
      const walker = document.createTreeWalker(
        summaryTextContainer,
        NodeFilter.SHOW_TEXT,
        null
      );

      let textNode = walker.nextNode();
      while (textNode) {
        const text = textNode.textContent?.trim() || "";
        // Find a text node with at least 10 characters for reliable selection
        if (text.length >= 10) {
          // Create a range and select text
          const range = document.createRange();
          // Select first 20 characters of this text node
          const startOffset = 0;
          const endOffset = Math.min(20, textNode.textContent.length);
          range.setStart(textNode, startOffset);
          range.setEnd(textNode, endOffset);

          // Apply selection
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);

          // Trigger mouseup event to activate the selection handler
          const mouseUpEvent = new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          summaryTextContainer.dispatchEvent(mouseUpEvent);

          // Wait for bubble to appear and have dimensions before highlighting
          try {
            const bubble = await waitForElement("[data-demo='summary-ask-astra-bubble']", 3000);
            setHighlightedElement(bubble);
          } catch (err) {
            console.warn("[Demo] Ask Astra bubble not found:", err);
          }

          break;
        }
        textNode = walker.nextNode();
      }
    };

    // Small delay to ensure DOM is stable
    const timer = setTimeout(triggerSelection, 500);
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

  // Update overlay text and highlight target when step changes
  useEffect(() => {
    if (!step) {
      setOverlayText("");
      setHighlightedElement(null);
      return;
    }

    setOverlayText(step.overlayText || "");

    // Find and highlight target element (poll until found)
    // Skip Step 6 - handled programmatically by triggerSelection effect
    if (currentStep !== 6 && step.highlight) {
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
        return {
          position: "absolute",
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          border: "3px solid rgba(0, 245, 204, 0.8)",
          borderRadius: "8px",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 245, 204, 0.5)",
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
              {currentStep === 9 ? (
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
