import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import api from "../../lib/api";

export default function ReinforcementSession({ sessionData, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(sessionData.duration_minutes * 60);
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentQuestion = sessionData.questions[currentIndex];
  const totalQuestions = sessionData.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Timer countdown
  useEffect(() => {
    if (sessionComplete || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionComplete, timeLeft]);

  // Format timer MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!selectedOptionId) return;

    const selectedOption = currentQuestion.options.find(
      (opt) => opt.id === selectedOptionId
    );
    const isCorrect = selectedOption?.is_correct || false;

    // Update local state
    setShowFeedback(true);
    setAnswers((prev) => [
      ...prev,
      {
        question_id: currentQuestion.id,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
      },
    ]);

    // Send answer to backend
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      await api.post(
        "/api/learning/mcq/answer",
        {
          question_id: currentQuestion.id,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
          reinforcement_session_id: sessionData.session_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Failed to save answer:", err);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSessionComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setShowFeedback(false);
    }
  };

  const handleSessionComplete = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      await api.patch(
        `/api/learning/reinforcement-session/${sessionData.session_id}`,
        {
          status: "completed",
          ended_at: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Failed to complete session:", err);
    }

    setSessionComplete(true);
  };

  // Completion screen
  if (sessionComplete) {
    const correctCount = answers.filter((a) => a.is_correct).length;
    const totalAnswered = answers.length;
    const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const timeUsed = sessionData.duration_minutes * 60 - timeLeft;
    const timeUsedMins = Math.floor(timeUsed / 60);
    const timeUsedSecs = timeUsed % 60;

    // Extract unique concepts from answered questions
    const conceptsSet = new Set();
    sessionData.questions.slice(0, totalAnswered).forEach((q) => {
      if (q.concept_name) conceptsSet.add(q.concept_name);
    });
    const conceptsCovered = Array.from(conceptsSet);

    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="panel p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4E9E7A]/10 border border-[#4E9E7A]/25 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#4E9E7A]" />
              <span className="font-mono text-xs text-[#4E9E7A] tracking-wider">
                SESSION COMPLETE
              </span>
            </div>
            <h2 className="text-3xl font-semibold text-white mb-2">
              Session Complete
            </h2>
          </div>

          {/* Score */}
          <div className="text-center mb-8 pb-8 border-b border-white/[0.07]">
            <div className="text-6xl font-bold text-white mb-2">
              {correctCount} / {totalAnswered}
            </div>
            <div className="text-2xl text-[#4E9E7A] font-semibold mb-4">
              {percentage}% Correct
            </div>
            <div className="text-sm text-white/50">
              Time used: {timeUsedMins}m {timeUsedSecs}s
            </div>
          </div>

          {/* Concepts Covered */}
          {conceptsCovered.length > 0 && (
            <div className="mb-8">
              <div className="font-mono text-xs text-white/40 mb-3 tracking-wider">
                CONCEPTS COVERED
              </div>
              <div className="flex flex-wrap gap-2">
                {conceptsCovered.map((concept, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm text-white/70"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Return Button */}
          <button
            onClick={onComplete}
            className="w-full px-6 py-4 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-semibold text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            Return to Learning
          </button>
        </div>
      </div>
    );
  }

  // Session in progress
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="panel overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#111114]/50 border-b border-white/[0.07] flex items-center justify-between">
          {/* Left: Title + Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              Reinforcement Session
            </span>
            <span className="px-2 py-1 rounded-lg bg-[#4E9E7A]/10 border border-[#4E9E7A]/25 text-xs font-mono text-[#4E9E7A]">
              {sessionData.primary_concept_name}
            </span>
          </div>

          {/* Center: Progress */}
          <div className="font-mono text-sm text-white/70">
            {currentIndex + 1} / {totalQuestions}
          </div>

          {/* Right: Timer */}
          <div
            className={`font-mono text-sm font-semibold ${
              timeLeft < 60 ? "text-[#E55A4E]" : "text-white/70"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Card */}
        <div className="px-6 py-6 bg-[#111114]/30">
          {/* Question Text */}
          <div className="mb-6">
            <div className="font-mono text-xs text-white/30 mb-3 tracking-wider">
              QUESTION {currentIndex + 1}
            </div>
            <p className="text-lg text-white leading-relaxed">
              {currentQuestion.question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D, E
              const isSelected = option.id === selectedOptionId;
              const isCorrect = option.is_correct;

              let bgColor = "rgba(255, 255, 255, 0.03)";
              let borderColor = "rgba(255, 255, 255, 0.08)";
              let textColor = "var(--text-main)";

              if (showFeedback) {
                if (isCorrect) {
                  bgColor = "rgba(78, 158, 122, 0.15)";
                  borderColor = "#4E9E7A";
                  textColor = "#4E9E7A";
                } else if (isSelected) {
                  bgColor = "rgba(229, 90, 78, 0.15)";
                  borderColor = "#E55A4E";
                  textColor = "#E55A4E";
                } else {
                  textColor = "rgba(255, 255, 255, 0.3)";
                }
              } else if (isSelected) {
                bgColor = "rgba(63, 124, 255, 0.15)";
                borderColor = "#3F7CFF";
                textColor = "var(--text-main)";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (!showFeedback) {
                      setSelectedOptionId(option.id);
                    }
                  }}
                  disabled={showFeedback}
                  className="w-full px-4 py-3 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                    cursor: showFeedback ? "default" : "pointer",
                  }}
                >
                  <span className="font-mono text-sm font-semibold mr-3">
                    {optionLabel}.
                  </span>
                  <span className="text-sm">{option.option_text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation (after submit) */}
          {showFeedback && currentQuestion.explanation && (
            <div
              className="mt-6 p-4 rounded-lg border"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <div className="font-mono text-xs text-white/40 mb-2 tracking-wider">
                EXPLANATION
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-5 bg-[#0F1612] border-t border-white/[0.07] flex gap-3">
          {!showFeedback ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
              style={{
                backgroundColor: selectedOptionId ? "#3F7CFF" : "rgba(255, 255, 255, 0.05)",
                color: selectedOptionId ? "#FFF" : "rgba(255, 255, 255, 0.3)",
                cursor: selectedOptionId ? "pointer" : "not-allowed",
              }}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLastQuestion ? "Finish" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
