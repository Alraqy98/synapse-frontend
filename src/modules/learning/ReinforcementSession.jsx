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
  const [aiTeaching, setAiTeaching] = useState(null);
  const [loadingAiTeaching, setLoadingAiTeaching] = useState(false);

  const currentQuestion = sessionData.questions[currentIndex];
  const totalQuestions = sessionData.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Save sessionData to sessionStorage on mount (for full page refresh recovery)
  useEffect(() => {
    try {
      sessionStorage.setItem('activeReinforcementSession', JSON.stringify(sessionData));
    } catch (err) {
      console.error("Failed to save session to storage:", err);
    }
  }, [sessionData]);

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
    const isCorrect = selectedOption?.is_correct ?? false;

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
    
    // Generate AI teaching summary
    generateAiTeachingSummary();
  };

  const generateAiTeachingSummary = async () => {
    setLoadingAiTeaching(true);

    try {
      // Build question review data
      const wrongQuestions = [];
      const rightQuestions = [];

      sessionData.questions.forEach((question, index) => {
        const answer = answers.find((a) => a.question_id === question.id);
        const selectedOption = question.options.find(
          (opt) => opt.id === answer?.selected_option_id
        );
        const correctOption = question.options.find((opt) => opt.is_correct);
        const isCorrect = answer?.is_correct ?? false;

        const questionData = {
          question_id: question.id,
          question_text: question.question_text,
          concept_name: question.concept_name,
          selected_answer: selectedOption?.option_text || "Not answered",
          correct_answer: correctOption?.option_text || "Unknown",
        };

        if (isCorrect) {
          rightQuestions.push(questionData);
        } else {
          wrongQuestions.push(questionData);
        }
      });

      // Get auth token
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      // Call backend endpoint
      const response = await api.post(
        "/api/ai/teaching-summary",
        {
          session_id: sessionData.session_id,
          primary_concept_name: sessionData.primary_concept_name,
          questions: [
            ...rightQuestions.map(q => ({ ...q, is_correct: true })),
            ...wrongQuestions.map(q => ({ ...q, is_correct: false }))
          ],
          score: answers.filter((a) => a.is_correct).length,
          total: sessionData.questions.length,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        setAiTeaching({
          performance_summary: response.data.data.performance_summary,
          focus_tip: response.data.data.focus_tip,
          question_teachings: response.data.data.question_teachings,
        });
      }
    } catch (err) {
      console.error("Failed to generate AI teaching summary:", err);
      // Fail silently - will use static explanations as fallback
    } finally {
      setLoadingAiTeaching(false);
    }
  };

  // Completion screen
  if (sessionComplete) {
    const correctCount = answers.filter((a) => a.is_correct).length;
    const totalAnswered = sessionData.questions.length;
    const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="panel p-8">
          {/* Score Header */}
          <div className="text-center mb-8 pb-6 border-b border-white/[0.07]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4E9E7A]/10 border border-[#4E9E7A]/25 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#4E9E7A]" />
              <span className="font-mono text-xs text-[#4E9E7A] tracking-wider">
                SESSION COMPLETE
              </span>
            </div>
            <div className="text-5xl font-bold text-white mb-2">
              {correctCount} / {totalAnswered} Correct
            </div>
            <div className="text-2xl text-[#4E9E7A] font-semibold">
              {percentage}%
            </div>
          </div>

          {/* AI Teaching Summary */}
          {loadingAiTeaching && (
            <div className="mb-8 p-6 rounded-lg border border-[#4E9E7A]/20 bg-[#111114]/30">
              <div className="flex items-center gap-3 text-sm text-white/50">
                <div className="w-4 h-4 rounded-full border-2 border-[#4E9E7A] border-t-transparent animate-spin" />
                <span>Generating personalized teaching summary...</span>
              </div>
            </div>
          )}

          {aiTeaching && (
            <div className="mb-8 p-6 rounded-lg border border-[#4E9E7A]/20 bg-[#111114]/30">
              <div className="font-mono text-xs text-[#4E9E7A]/60 mb-3 tracking-wider">
                AI TEACHING SUMMARY
              </div>
              
              {/* Performance Summary */}
              {aiTeaching.performance_summary && (
                <p className="text-sm text-white/80 leading-relaxed mb-5">
                  {aiTeaching.performance_summary}
                </p>
              )}

              {/* Focus Tip */}
              {aiTeaching.focus_tip && (
                <div className="mt-4 p-3 rounded-lg bg-[#4E9E7A]/5 border border-[#4E9E7A]/15">
                  <div className="font-mono text-xs text-[#4E9E7A]/60 mb-1 tracking-wider">
                    RECOMMENDED FOCUS
                  </div>
                  <p className="text-sm text-white/70">
                    {aiTeaching.focus_tip}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Per-Question Review */}
          <div className="space-y-6 mb-8">
            {sessionData.questions.slice(0, totalAnswered).map((question, qIndex) => {
              const answer = answers.find((a) => a.question_id === question.id);
              const selectedOption = question.options.find(
                (opt) => opt.id === answer?.selected_option_id
              );
              const correctOption = question.options.find((opt) => opt.is_correct);
              const wasCorrect = answer?.is_correct ?? false;

              // Get AI teaching explanation if available, else use static
              const aiExplanation = aiTeaching?.question_teachings?.find(
                (qt) => qt.question_id === question.id
              )?.teaching;
              const explanationText = aiExplanation || question.explanation;

              return (
                <div
                  key={question.id}
                  className="p-5 rounded-lg border border-white/[0.07] bg-[#111114]/30"
                >
                  {/* Question Number + Text */}
                  <div className="mb-4">
                    <div className="font-mono text-xs text-white/30 mb-2 tracking-wider">
                      QUESTION {qIndex + 1}
                    </div>
                    <p className="text-base text-white leading-relaxed">
                      {question.question_text}
                    </p>
                  </div>

                  {/* User's Answer */}
                  {selectedOption && (
                    <div
                      className="mb-3 p-3 rounded-lg border"
                      style={{
                        backgroundColor: wasCorrect
                          ? "rgba(78, 158, 122, 0.15)"
                          : "rgba(229, 90, 78, 0.15)",
                        borderColor: wasCorrect ? "#4E9E7A" : "#E55A4E",
                      }}
                    >
                      <div className="font-mono text-xs mb-1 tracking-wider"
                        style={{ color: wasCorrect ? "#4E9E7A" : "#E55A4E" }}
                      >
                        YOUR ANSWER {wasCorrect ? "✓" : "✗"}
                      </div>
                      <p className="text-sm" style={{ color: wasCorrect ? "#4E9E7A" : "#E55A4E" }}>
                        {selectedOption.option_text}
                      </p>
                    </div>
                  )}

                  {/* Correct Answer (if user was wrong) */}
                  {!wasCorrect && correctOption && (
                    <div
                      className="mb-3 p-3 rounded-lg border"
                      style={{
                        backgroundColor: "rgba(78, 158, 122, 0.15)",
                        borderColor: "#4E9E7A",
                      }}
                    >
                      <div className="font-mono text-xs text-[#4E9E7A] mb-1 tracking-wider">
                        CORRECT ANSWER
                      </div>
                      <p className="text-sm text-[#4E9E7A]">
                        {correctOption.option_text}
                      </p>
                    </div>
                  )}

                  {/* Explanation - AI teaching if available, else static */}
                  {explanationText && (
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <div className="font-mono text-xs text-white/40 mb-1 tracking-wider">
                        {aiExplanation ? "AI TEACHING" : "EXPLANATION"}
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {explanationText}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Return Button */}
          <button
            onClick={() => {
              // Clear session persistence
              try {
                sessionStorage.removeItem('activeReinforcementSession');
              } catch (err) {
                console.error("Failed to clear session storage:", err);
              }
              onComplete();
            }}
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
            {currentQuestion.options.map((option) => {
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
