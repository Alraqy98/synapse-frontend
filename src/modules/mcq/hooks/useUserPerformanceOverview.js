/**
 * Hook to fetch user's cross-deck MCQ performance overview
 * Provides longitudinal performance data for performance mentor
 */

import { useState, useEffect } from 'react';
import api from '../../../lib/api';

/**
 * Fetch user's MCQ performance overview from backend
 * GET /ai/mcq/users/me/performance
 * 
 * @returns {Object} { overview, loading, error }
 */
export function useUserPerformanceOverview() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchOverview = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get('/ai/mcq/users/me/performance');
                
                if (!mounted) return;

                // Defensive: Ensure we got valid data structure
                const data = response.data || {};
                setOverview(data);
            } catch (err) {
                if (!mounted) return;
                
                console.error('Failed to fetch user performance overview:', err);
                
                // Don't fail the UI - just log and set error
                setError(err.message || 'Failed to load performance data');
                setOverview(null);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchOverview();

        return () => {
            mounted = false;
        };
    }, []); // Only fetch once per mount

    return { overview, loading, error };
}
