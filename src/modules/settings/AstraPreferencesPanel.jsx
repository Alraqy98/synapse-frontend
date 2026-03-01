// src/modules/settings/AstraPreferencesPanel.jsx
import React, { useState, useEffect, useRef } from "react";
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

    const selectTriggerClass = "bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-white/70 text-sm";
    const selectLabelClass = "text-white/40 text-sm block";

    if (isLoading) {
        return (
            <div className="bg-[#0D0F12]/60 border border-white/[0.06] border-l-2 border-l-teal/20 rounded-2xl backdrop-blur-sm p-6 space-y-4">
                <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-teal/40 font-mono">Preferences</div>
                    <h2 className="text-lg font-semibold text-white">Astra – Answer Preferences</h2>
                </div>
                <div className="text-sm text-white/40">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-[#0D0F12]/60 border border-white/[0.06] border-l-2 border-l-teal/20 rounded-2xl backdrop-blur-sm relative flex flex-col">
            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-teal/40 font-mono">Preferences</div>
                    <h2 className="text-lg font-semibold text-white">Astra – Answer Preferences</h2>
                </div>

                <div className="space-y-5">
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
                        labelClassName={selectLabelClass}
                        triggerClassName={selectTriggerClass}
                    />

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
                        labelClassName={selectLabelClass}
                        triggerClassName={selectTriggerClass}
                    />

                    <Select
                        label="FileViewer Answer Length"
                        value={draftPreferences.fileViewerAnswerLength}
                        onChange={(value) => updateDraftPreference("fileViewerAnswerLength", value)}
                        options={[
                            { label: "Very short", value: "very_short" },
                            { label: "Short", value: "short" },
                            { label: "Balanced", value: "balanced" },
                        ]}
                        labelClassName={selectLabelClass}
                        triggerClassName={selectTriggerClass}
                    />

                    <Select
                        label="Teaching Style"
                        value={draftPreferences.teachingStyle}
                        onChange={(value) => updateDraftPreference("teachingStyle", value)}
                        options={[
                            { label: "Direct", value: "direct" },
                            { label: "Step-by-step", value: "step_by_step" },
                            { label: "Exam-focused", value: "exam_focused" },
                        ]}
                        labelClassName={selectLabelClass}
                        triggerClassName={selectTriggerClass}
                    />

                    <div className="space-y-2">
                        <label className="text-white/40 text-sm block">
                            Study context <span className="text-white/30 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={draftPreferences.studyContext}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 500) {
                                    updateDraftPreference("studyContext", value);
                                }
                            }}
                            rows={4}
                            placeholder="Tell Astra anything relevant about your current studies (e.g. clerkship, exam prep, level). This is used as background context only."
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-white/70 text-sm placeholder-white/30 outline-none focus:border-white/20 transition-colors resize-none"
                            maxLength={500}
                        />
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-white/30">
                                Tell Astra anything relevant about your current studies (e.g. clerkship, exam prep, level).
                                This is used as background context only.
                            </p>
                            <span className="text-xs text-white/30">
                                {draftPreferences.studyContext.length}/500
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {isDirty && (
                <div className="sticky bottom-0 border-t border-white/[0.06] bg-[#0D0F12]/80 p-4 flex items-center justify-end gap-3">
                    <button
                        onClick={handleDiscard}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm rounded-xl bg-transparent border border-white/[0.08] text-white/70 hover:border-teal/40 hover:text-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AstraPreferencesPanel;

