import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../lib/api";

// Polling configuration for learning state computation
const POLL_INTERVAL_MS = 3000;   // retry every 3 seconds
const MAX_POLL_TIME_MS = 60000;  // give up after 60 seconds

/**
 * Custom hook to fetch learning state data from backend with snapshot-first + async support
 * @param {object} options - Hook options
 * @param {boolean} options.passive - If true, don't enqueue new job or poll. Only fetch existing snapshot.
 * @param {boolean} options.enabled - If false, skip fetching and window focus listener.
 * @param {string} options.sort - Sort parameter for concepts ("priority" or "recent")
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
  const { passive = false, enabled = true, sort = "priority" } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("ready");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const pollingTimeoutRef = useRef(null);
  const pollStartTimeRef = useRef(null);
  const isMountedRef = useRef(true);
  const dataRef = useRef(null);
  const fetchIdRef = useRef(0);

  // Keep dataRef in sync with data state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchLearningState = useCallback(async (isPolling = false) => {
    const thisFetchId = ++fetchIdRef.current;

    try {
      if (!isPolling) {
        setLoading(true);
        setError(null);
      }

      const params = sort ? { sort } : {};
      const response = await api.get("/api/learning/state", { params });
      console.log("[RAW API RESPONSE]", JSON.stringify(response.data, null, 2));

      if (!isMountedRef.current) return;
      if (thisFetchId !== fetchIdRef.current) return;

      // PASSIVE MODE: Accept any 200 response as ready (read-only snapshot fetch)
      if (passive) {
        if (response.data?.success && response.data?.data) {
          setData(response.data.data);
          setStatus("ready");
          setError(null);
        } else {
          setData(null);
          setStatus("pending");
          setError(null);
        }
        setLoading(false);
        setIsUpdating(false);
        return;
      }

      // ACTIVE MODE: Check for pending and poll if needed
      const isPending =
        response.status === 202 ||
        response.data?.data?.status === "pending" ||
        response.data?.status === "pending";

      if (isPending) {
        // Start polling if not already polling
        if (!isPolling) {
          setStatus("pending");
          setLoading(false);
          // If we have previous data, keep it and mark as updating
          if (dataRef.current) {
            setIsUpdating(true);
          } else {
            setData(null);
          }
          pollStartTimeRef.current = Date.now();
          startPolling(POLL_INTERVAL_MS);
        } else {
          if (thisFetchId !== fetchIdRef.current) return;
          // Continue polling - check if we've exceeded timeout
          if (!pollStartTimeRef.current) {
            pollStartTimeRef.current = Date.now();
          }
          const elapsed = Date.now() - pollStartTimeRef.current;
          if (elapsed > MAX_POLL_TIME_MS) {
            // 60 seconds elapsed, stop polling
            setStatus("error");
            setError("Learning state computation timed out. Please try refreshing.");
            setLoading(false);
            setIsUpdating(false);
            return;
          }
          // Continue polling with fixed interval
          startPolling(POLL_INTERVAL_MS);
        }
      } else {
        // Successfully got data — cancel any scheduled poll so we don't overwrite with a later 202
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
        pollStartTimeRef.current = null;
        setData(response.data.data);
        setStatus("ready");
        setError(null);
        setLoading(false);
        setIsUpdating(false);
      }
    } catch (err) {
      console.error("Failed to fetch learning state:", err);
      if (!isMountedRef.current) return;
      if (thisFetchId !== fetchIdRef.current) return;

      setStatus("error");
      setError(err.response?.data?.message || err.message || "Failed to load learning state");
      setData(null);
      setLoading(false);
      setIsUpdating(false);
    }
  }, [passive, sort]);

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
    if (!enabled) return;
    
    fetchLearningState(false);

    return () => {
      isMountedRef.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [fetchLearningState, enabled]);

  // Refetch on window focus (if not pending)
  useEffect(() => {
    if (!enabled) return;
    
    const handleFocus = () => {
      if (status !== "pending" && isMountedRef.current) {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [status, refresh, enabled]);

  return { data, loading, error, status, isUpdating, refresh };
}
