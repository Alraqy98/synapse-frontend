import { useState, useEffect } from "react";
import api from "../../../lib/api";

export default function useLearningHistory() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/api/analytics/history?limit=30");
        setHistory(response.data.data || null);
      } catch (err) {
        console.error("Failed to fetch learning history:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  return { history, loading, error };
}
