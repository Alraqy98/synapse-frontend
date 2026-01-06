import React, { createContext, useContext, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { demoApiIntercept as runtimeDemoApiIntercept, setDemoActive } from "./demoApiRuntime";

// Demo Mode Context
// Frontend-only, no backend integration. All state is in-memory,
// with a single localStorage flag for completion.

const DemoContext = createContext(null);

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }) {
  const navigate = useNavigate();
  const [isDemo, setIsDemo] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [allowedInteractions, setAllowedInteractions] = useState(null);

  const isDemoCompleted = useCallback(() => {
    try {
      return localStorage.getItem("synapse_demo_completed") === "true";
    } catch {
      return false;
    }
  }, []);

  const markDemoCompleted = useCallback(() => {
    try {
      localStorage.setItem("synapse_demo_completed", "true");
    } catch {
      // ignore persistence failures silently
    }
  }, []);

  const startDemo = useCallback((entryPoint = "dashboard_cta") => {
    // Prevent demo restart if already running
    if (isDemo) return;

    // If user has fully completed demo before, they can still restart manually.
    setIsDemo(true);
    setDemoActive(true);
    setCurrentStep(1);
    // Phase 1 starts strict – concrete locking is handled by overlay layer.
    setAllowedInteractions({ phase: "strict" });
  }, [isDemo]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (!prev) return 1;
      return prev + 1;
    });
  }, []);

  const exitDemo = useCallback(
    (reason = "exit") => {
      // Clear all in-memory demo state
      setIsDemo(false);
      setCurrentStep(null);
      setAllowedInteractions(null);
      setDemoActive(false);

      // Deterministic routing on exit (hard contract)
      if (reason === "primary_cta_upload") {
        // Navigate to library with cache buster to force reload
        navigate("/library?reload=" + Date.now(), { replace: true });
        // Dispatch custom event to trigger library reload
        window.dispatchEvent(new CustomEvent("demo-exit-library-reload"));
      } else if (
        reason === "backdrop" ||
        reason === "escape" ||
        reason === "skip"
      ) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    },
    [navigate]
  );

  // Single interception entry point for API wrappers.
  // For now this just delegates to getDemoResponse, which always returns handled:false.
  const demoApiIntercept = useCallback((req) => runtimeDemoApiIntercept(req), []);

  const value = {
    isDemo,
    currentStep,
    allowedInteractions,
    startDemo,
    nextStep,
    exitDemo,
    isDemoCompleted,
    markDemoCompleted,
    demoApiIntercept,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}


