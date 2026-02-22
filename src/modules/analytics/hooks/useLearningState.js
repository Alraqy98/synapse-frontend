import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../lib/api";

/**
 * Custom hook to fetch learning state data from backend with snapshot-first + async support
 * @param {object} options - Hook options
 * @param {boolean} options.passive - If true, don't enqueue new job or poll. Only fetch existing snapshot.
 * @returns {{ 
 *   data: object | null, 
 *   loading: boolean, 
 *   error: string | null, 
 *   status: "ready" | "pending" | "error",
 *   isUpdating: boolean,
 *   refresh: () => void
 * }}
 */
export default function useLearningState(options = {}) {
  const { passive = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("ready");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const pollingTimeoutRef = useRef(null);
  const pollStartTimeRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchLearningState = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
        setError(null);
      }

      const response = await api.get("/api/learning/state");
      
      // Check if response is pending (202 status OR data.status === "pending")
      const isPending = response.status === 202 || response.data?.data?.status === "pending";

      if (!isMountedRef.current) return;

      if (isPending) {
        // In passive mode, don't poll - just return pending status
        if (passive) {
          setStatus("pending");
          setLoading(false);
          setData(null);
          setIsUpdating(false);
          return;
        }
        
        // Start polling if not already polling (active mode only)
        if (!isPolling) {
          setStatus("pending");
          setLoading(false);
          // If we have previous data, keep it and mark as updating
          if (data) {
            setIsUpdating(true);
          } else {
            setData(null);
          }
          pollStartTimeRef.current = Date.now();
          startPolling(1000); // Start with 1 second delay
        } else {
          // Continue polling - check if we've exceeded timeout
          const elapsed = Date.now() - pollStartTimeRef.current;
          if (elapsed > 60000) {
            // 60 seconds elapsed, stop polling
            setStatus("error");
            setError("Learning state computation timed out. Please try refreshing.");
            setLoading(false);
            setIsUpdating(false);
            return;
          }
          // Continue polling with exponential backoff
          const nextDelay = Math.min(getCurrentDelay() * 2, 10000); // Max 10 seconds
          startPolling(nextDelay);
        }
      } else {
        // Successfully got data
        setData(response.data.data);
        setStatus("ready");
        setError(null);
        setLoading(false);
        setIsUpdating(false);
        pollStartTimeRef.current = null;
      }
    } catch (err) {
      console.error("Failed to fetch learning state:", err);
      if (!isMountedRef.current) return;
      
      setStatus("error");
      setError(err.response?.data?.message || err.message || "Failed to load learning state");
      setData(null);
      setLoading(false);
      setIsUpdating(false);
    }
  }, [data, passive]);

  const getCurrentDelay = () => {
    if (!pollStartTimeRef.current) return 1000;
    const elapsed = Date.now() - pollStartTimeRef.current;
    // Exponential backoff: 1s, 2s, 4s, 8s, 10s (max)
    if (elapsed < 1000) return 1000;
    if (elapsed < 3000) return 2000;
    if (elapsed < 7000) return 4000;
    if (elapsed < 15000) return 8000;
    return 10000;
  };

  const startPolling = (delay) => {
    // Clear any existing timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    
    pollingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        fetchLearningState(true);
      }
    }, delay);
  };

  const refresh = useCallback(() => {
    // Clear any ongoing polling
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    pollStartTimeRef.current = null;
    fetchLearningState(false);
  }, [fetchLearningState]);

  // Initial fetch on mount
  useEffect(() => {
    fetchLearningState(false);

    return () => {
      isMountedRef.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [fetchLearningState]);

  // Refetch on window focus (if not pending)
  useEffect(() => {
    const handleFocus = () => {
      if (status !== "pending" && isMountedRef.current) {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [status, refresh]);

  return { data, loading, error, status, isUpdating, refresh };
}
