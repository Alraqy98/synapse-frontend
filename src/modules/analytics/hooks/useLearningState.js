import { useState, useEffect } from "react";
import api from "../../../lib/api";

/**
 * Custom hook to fetch learning state data from backend
 * @returns {{ data: object | null, loading: boolean }}
 */
export default function useLearningState() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLearningState = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/learning/state");
        setData(response.data.data);
      } catch (err) {
        console.error("Failed to fetch learning state:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLearningState();
  }, []);

  return { data, loading };
}
