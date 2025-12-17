import React, { useState, useEffect } from 'react';
import OnboardingLayout from './OnboardingLayout';
import StepAccountType from './StepAccountType';
import StepCountry from './StepCountry';
import StepUniversity from './StepUniversity';
import StepYearOrSpecialty from './StepYearOrSpecialty';
import StepPrimaryGoal from './StepPrimaryGoal';
import StepResourcePreferences from './StepResourcePreferences';
import OnboardingComplete from './OnboardingComplete';
import { supabase } from '../../lib/supabaseClient';

const OnboardingFlow = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        avatarUrl: '',
        fieldOfStudy: '',
        country: '',
        university: '',
        yearOfStudy: '',
        primaryGoal: [],
        resources: []
    });

    // ======================================================
    // 🔥 Load user's name + email directly from Supabase auth
    // ======================================================
    useEffect(() => {
        const loadUserData = async () => {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (!user) return;

            const fullName = user.user_metadata?.full_name || "";
            const email = user.email || "";

            const avatarUrl =
                fullName
                    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
                    : "";

            setFormData(prev => ({
                ...prev,
                fullName,
                email,
                avatarUrl
            }));
        };

        loadUserData();
    }, []);

    const updateData = (key, value) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    // ======================================================
    // 🔥 Final Submit: fully fixed with proper upsert
    // ======================================================
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user?.id) {
                alert("Unexpected error: User not found.");
                return;
            }

            const payload = {
                field_of_study: formData.fieldOfStudy,
                student_year: formData.yearOfStudy,
                university: formData.university,
                country: formData.country,
                language: "en"
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/onboarding`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const json = await res.json();
            if (!res.ok) {
                console.error(json);
                alert(json.error || "Onboarding failed");
                return;
            }

            setShowCompletion(true);
        } catch (err) {
            console.error(err);
            alert("Unexpected error.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // ======================================================
    // FINAL SCREEN
    // ======================================================
    if (showCompletion) {
        return (
            <OnboardingComplete
                onComplete={onComplete}
            />
        );
    }

    // ======================================================
    // STEPS
    // ======================================================
    const steps = [
        {
            title: "Where are you located?",
            subtitle: "We'll tailor content to your region's medical standards.",
            component: (
                <StepCountry
                    value={formData.country}
                    onChange={(v) => updateData("country", v)}
                    onNext={handleNext}
                />
            ),
        },
        {
            title: "Your field and year of study",
            subtitle: "This determines the depth of clinical reasoning we use.",
            component: (
                <StepYearOrSpecialty
                    fieldOfStudy={formData.fieldOfStudy}
                    yearOfStudy={formData.yearOfStudy}
                    onChangeField={(v) => updateData("fieldOfStudy", v)}
                    onChangeYear={(v) => updateData("yearOfStudy", v)}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            ),
        },
        {
            title: "Where do you study or work?",
            subtitle: "Connect with peers from your institution.",
            component: (
                <StepUniversity
                    value={formData.university}
                    onChange={(v) => updateData("university", v)}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            ),
        },
        {
            title: "What is your primary goal?",
            subtitle: "Select all that apply.",
            component: (
                <StepPrimaryGoal
                    value={formData.primaryGoal}
                    onChange={(v) => updateData("primaryGoal", v)}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            ),
        },
        {
            title: "Preferred Resources",
            subtitle: "Select the resources you use most often.",
            component: (
                <StepResourcePreferences
                    value={formData.resources}
                    onChange={(v) => updateData("resources", v)}
                    onNext={handleSubmit}
                    onBack={handleBack}
                    isSubmitting={isSubmitting}
                />
            ),
        },
    ];

    const current = steps[step];

    return (
        <OnboardingLayout
            currentStep={step}
            totalSteps={steps.length}
            title={current.title}
            subtitle={current.subtitle}
        >
            {current.component}
        </OnboardingLayout>
    );
};

export default OnboardingFlow;
