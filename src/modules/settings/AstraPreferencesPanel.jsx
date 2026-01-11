// src/modules/settings/AstraPreferencesPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { Brain } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Select from "../../components/Select";

const STORAGE_KEY = "astra_preferences";

const DEFAULT_PREFERENCES = {
    language: "auto",
    tutorAnswerLength: "balanced",
    fileViewerAnswerLength: "balanced",
    teachingStyle: "direct",
    studyContext: "",
};

// Helper to deep compare objects
const areEqual = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
};

const AstraPreferencesPanel = () => {
    const [savedPreferences, setSavedPreferences] = useState(DEFAULT_PREFERENCES);
    const [draftPreferences, setDraftPreferences] = useState(DEFAULT_PREFERENCES);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const isDirtyRef = useRef(false);

    // Check if draft differs from saved
    const isDirty = !areEqual(savedPreferences, draftPreferences);

    // Update isDirty ref for beforeunload
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    // Load preferences on mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                // Try to load from Supabase profiles table first (if available)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("astra_preferences")
                        .eq("id", user.id)
                        .maybeSingle();
                    
                    if (profile?.astra_preferences) {
                        const loaded = { ...DEFAULT_PREFERENCES, ...profile.astra_preferences };
                        setSavedPreferences(loaded);
                        setDraftPreferences(loaded);
                        setIsLoading(false);
                        return;
                    }
                }
                
                // Fallback to localStorage
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        const loaded = { ...DEFAULT_PREFERENCES, ...parsed };
                        setSavedPreferences(loaded);
                        setDraftPreferences(loaded);
                    } catch (e) {
                        console.warn("Failed to parse stored preferences:", e);
                    }
                }
            } catch (err) {
                console.warn("Failed to load preferences:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, []);

    // Prevent accidental loss with beforeunload warning
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirtyRef.current) {
                e.preventDefault();
                e.returnValue = ""; // Required for Chrome
                return ""; // Required for Safari
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Update draft preference
    const updateDraftPreference = (key, value) => {
        setDraftPreferences((prev) => ({ ...prev, [key]: value }));
    };

    // Save preferences
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPreferences));

            // Try to save to Supabase profiles table (if available)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from("profiles")
                        .update({ astra_preferences: draftPreferences })
                        .eq("id", user.id);
                }
            } catch (err) {
                // Silently fail - localStorage is the fallback
                console.warn("Failed to save preferences to Supabase:", err);
            }

            // Update saved preferences
            setSavedPreferences(draftPreferences);
        } catch (err) {
            console.error("Failed to save preferences:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Discard changes
    const handleDiscard = () => {
        setDraftPreferences(savedPreferences);
    };

    if (isLoading) {
        return (
            <div className="panel p-6 space-y-4">
                <div className="flex items-center gap-2 text-white">
                    <Brain size={18} className="text-teal" />
                    <h2 className="text-lg font-bold">Astra – Answer Preferences</h2>
                </div>
                <div className="text-sm text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="panel relative flex flex-col">
            <div className="p-6 space-y-6 flex-1">
                <div className="flex items-center gap-2 text-white">
                    <Brain size={18} className="text-teal" />
                    <h2 className="text-lg font-bold">Astra – Answer Preferences</h2>
                </div>

                <div className="space-y-5">
                    {/* Language */}
                    <Select
                        label="Language"
                        value={draftPreferences.language}
                        onChange={(value) => updateDraftPreference("language", value)}
                        options={[
                            { label: "Auto (default)", value: "auto" },
                            { label: "English", value: "en" },
                            { label: "Arabic", value: "ar" },
                            { label: "Turkish", value: "tr" },
                        ]}
                    />

                    {/* Tutor Answer Length */}
                    <Select
                        label="Tutor Answer Length"
                        value={draftPreferences.tutorAnswerLength}
                        onChange={(value) => updateDraftPreference("tutorAnswerLength", value)}
                        options={[
                            { label: "Very short", value: "very_short" },
                            { label: "Short", value: "short" },
                            { label: "Balanced", value: "balanced" },
                            { label: "Detailed", value: "detailed" },
                        ]}
                    />

                    {/* FileViewer Answer Length */}
                    <Select
                        label="FileViewer Answer Length"
                        value={draftPreferences.fileViewerAnswerLength}
                        onChange={(value) => updateDraftPreference("fileViewerAnswerLength", value)}
                        options={[
                            { label: "Very short", value: "very_short" },
                            { label: "Short", value: "short" },
                            { label: "Balanced", value: "balanced" },
                        ]}
                    />

                    {/* Teaching Style */}
                    <Select
                        label="Teaching Style"
                        value={draftPreferences.teachingStyle}
                        onChange={(value) => updateDraftPreference("teachingStyle", value)}
                        options={[
                            { label: "Direct", value: "direct" },
                            { label: "Step-by-step", value: "step_by_step" },
                            { label: "Exam-focused", value: "exam_focused" },
                        ]}
                    />

                    {/* Study Context */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            Study context <span className="text-muted font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={draftPreferences.studyContext}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Soft character limit (500 chars)
                                if (value.length <= 500) {
                                    updateDraftPreference("studyContext", value);
                                }
                            }}
                            rows={4}
                            placeholder="Tell Astra anything relevant about your current studies (e.g. clerkship, exam prep, level). This is used as background context only."
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-muted outline-none focus:border-teal transition-colors resize-none"
                            maxLength={500}
                        />
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-muted">
                                Tell Astra anything relevant about your current studies (e.g. clerkship, exam prep, level).
                                This is used as background context only.
                            </p>
                            <span className="text-xs text-muted">
                                {draftPreferences.studyContext.length}/500
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer - Only show when dirty */}
            {isDirty && (
                <div className="sticky bottom-0 border-t border-white/10 bg-[#1a1d24] p-4 flex items-center justify-end gap-3">
                    <button
                        onClick={handleDiscard}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-teal text-black rounded-lg hover:bg-teal/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AstraPreferencesPanel;

