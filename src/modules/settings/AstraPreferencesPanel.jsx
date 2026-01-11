// src/modules/settings/AstraPreferencesPanel.jsx
import React, { useState, useEffect } from "react";
import { Brain } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const STORAGE_KEY = "astra_preferences";

const DEFAULT_PREFERENCES = {
    language: "auto",
    tutorAnswerLength: "balanced",
    fileViewerAnswerLength: "balanced",
    teachingStyle: "direct",
    studyContext: "",
};

const AstraPreferencesPanel = () => {
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [isLoading, setIsLoading] = useState(true);

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
                        setPreferences({ ...DEFAULT_PREFERENCES, ...profile.astra_preferences });
                        setIsLoading(false);
                        return;
                    }
                }
                
                // Fallback to localStorage
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
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

    // Auto-save preferences
    const updatePreference = async (key, value) => {
        const updated = { ...preferences, [key]: value };
        setPreferences(updated);

        // Save to localStorage immediately
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Try to save to Supabase profiles table (if available)
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from("profiles")
                    .update({ astra_preferences: updated })
                    .eq("id", user.id);
            }
        } catch (err) {
            // Silently fail - localStorage is the fallback
            console.warn("Failed to save preferences to Supabase:", err);
        }
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
        <div className="panel p-6 space-y-6">
            <div className="flex items-center gap-2 text-white">
                <Brain size={18} className="text-teal" />
                <h2 className="text-lg font-bold">Astra – Answer Preferences</h2>
            </div>

            <div className="space-y-5">
                {/* Language */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                        Language
                    </label>
                    <select
                        value={preferences.language}
                        onChange={(e) => updatePreference("language", e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-teal transition-colors"
                    >
                        <option value="auto">Auto (default)</option>
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                        <option value="tr">Turkish</option>
                    </select>
                </div>

                {/* Tutor Answer Length */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                        Tutor Answer Length
                    </label>
                    <select
                        value={preferences.tutorAnswerLength}
                        onChange={(e) => updatePreference("tutorAnswerLength", e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-teal transition-colors"
                    >
                        <option value="very_short">Very short</option>
                        <option value="short">Short</option>
                        <option value="balanced">Balanced</option>
                        <option value="detailed">Detailed</option>
                    </select>
                </div>

                {/* FileViewer Answer Length */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                        FileViewer Answer Length
                    </label>
                    <select
                        value={preferences.fileViewerAnswerLength}
                        onChange={(e) => updatePreference("fileViewerAnswerLength", e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-teal transition-colors"
                    >
                        <option value="very_short">Very short</option>
                        <option value="short">Short</option>
                        <option value="balanced">Balanced</option>
                    </select>
                </div>

                {/* Teaching Style */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                        Teaching Style
                    </label>
                    <select
                        value={preferences.teachingStyle}
                        onChange={(e) => updatePreference("teachingStyle", e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-teal transition-colors"
                    >
                        <option value="direct">Direct</option>
                        <option value="step_by_step">Step-by-step</option>
                        <option value="exam_focused">Exam-focused</option>
                    </select>
                </div>

                {/* Study Context */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                        Study context <span className="text-muted font-normal">(optional)</span>
                    </label>
                    <textarea
                        value={preferences.studyContext}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Soft character limit (500 chars)
                            if (value.length <= 500) {
                                updatePreference("studyContext", value);
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
                            {preferences.studyContext.length}/500
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AstraPreferencesPanel;

