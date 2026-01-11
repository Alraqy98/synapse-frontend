// src/modules/settings/astraPreferences.js
// Utility to get Astra preferences for use in API calls

const STORAGE_KEY = "astra_preferences";

const DEFAULT_PREFERENCES = {
    language: "auto",
    tutorAnswerLength: "balanced",
    fileViewerAnswerLength: "balanced",
    teachingStyle: "direct",
    studyContext: "",
};

/**
 * Get current Astra preferences
 * @returns {Object} Preferences object
 */
export const getAstraPreferences = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_PREFERENCES, ...parsed };
        }
    } catch (e) {
        console.warn("Failed to parse stored preferences:", e);
    }
    return DEFAULT_PREFERENCES;
};

