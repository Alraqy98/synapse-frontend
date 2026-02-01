import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiMCQ } from "./apiMCQ";
import { Send, ArrowLeft, Clock3, CheckCircle2, XCircle } from "lucide-react";
import MCQEntryModal from "./MCQEntryModal";
import { useDemo } from "../demo/DemoContext";
import { DEMO_MCQ_DECK_ID } from "../demo/demoData/demoMcq";
import SourceAttribution from "../../components/SourceAttribution";

const LETTERS = ["A", "B", "C", "D", "E"];

const neonGreen =
    "border-teal bg-teal/10 shadow-[0_0_22px_rgba(0,245,204,0.45)]";
const neonRed =
    "border-red-400 bg-red-500/10 shadow-[0_0_22px_rgba(248,113,113,0.45)]";

// ---------- normalization ----------
function normalize(str) {
    return (str ?? "")
        .toString()
        .trim()
        .replace(/\s+/g, " ")
        .normalize("NFKC");
}

function formatSeconds(sec = 0) {
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

// Strip echoed option text if the model repeats it
function stripQuotedOption(text = "", option = "") {
    if (!text) return "";
    const opt = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text
        .replace(new RegExp(`["“”']?\\s*${opt}\\s*["“”']?`, "gi"), "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function buildCorrectExplanation({ base }) {
    if (!base) return null;
    return `Why this is correct:\n${base.trim()}`;
}

function buildWrongExplanation({ optionBase }) {
    if (!optionBase) return null;
    return `Why this is wrong:\n${optionBase.trim()}`;
}

function isSingleBestAnswerQuestion(text = "") {
    const t = text.toLowerCase();
    return (
        t.includes("most") ||
        t.includes("best") ||
        t.includes("primary") ||
        t.includes("main")
    );
}
function calculateStats(answers = {}) {
    const list = Object.values(answers);
    const total = list.length;
    const correct = list.filter(a => a.isCorrect).length;
    const totalTime = list.reduce((s, a) => s + (a.timeSpent || 0), 0);
    const avgTime = total ? Math.round(totalTime / total) : 0;

    return {
        total,
        correct,
        percent: total ? Math.round((correct / total) * 100) : 0,
        totalTime,
        avgTime,
    };
}

export default function MCQDeckView({ deckId, goBack }) {
    const { isDemo } = useDemo() || {};
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    // ✅ store by QUESTION ID (not array index)
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);
    const [progress, setProgress] = useState(null);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [reviewScope, setReviewScope] = useState(null); // "wrong" | "all"
    
    const handleRetake = async () => {
        try {
            await apiMCQ.resetMCQDeck(deckId);
            const startResponse = await apiMCQ.startMCQDeck(deckId);
            setFinished(false);
            setReviewMode(false);
            setReviewScope(null);
            await loadQuestionsAndResume(deckId, startResponse?.progress);
        } catch (err) {
            console.error("Failed to retake:", err);
        }
    };
    const [elapsed, setElapsed] = useState(0);
    const startedAtRef = useRef(null);
    const tickRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const q = questions[index];

    // ✅ current answer state by question id
    const answerState = q ? answers[q.id] : null;

    // A quick lookup to access options_full by letter/text safely
    const optionLookup = useMemo(() => {
        if (!q?.options_full?.length) return null;

        const byLetter = {};
        const byTextNorm = {};

        for (const row of q.options_full) {
            byLetter[row.letter] = row;
            // Handle both option_text (from backend) and text (from demo data)
            const optionText = row.option_text || row.text || "";
            byTextNorm[normalize(optionText)] = row;
        }

        return { byLetter, byTextNorm };
    }, [q?.id, q?.options_full]);

    // ---------------- Entry Flow: Start deck and check progress ----------------
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                
                // Demo Mode: Skip progress restore - always start fresh
                if (isDemo) {
                    const qs = await apiMCQ.getMCQQuestions(deckId);
                    if (!mounted) return;
                    setQuestions(qs || []);
                    setIndex(0);
                    setProgress(null);
                    setLoading(false);
                    return;
                }
                
                // Step 1: Call /start to initialize or get existing progress
                const startResponse = await apiMCQ.startMCQDeck(deckId);
                
                if (!mounted) return;

                const progressData = startResponse?.progress;
                setProgress(progressData);

                // Step 2: Check progress status and show modal if needed
                if (progressData?.status === "in_progress" || progressData?.status === "completed") {
                    setShowEntryModal(true);
                    // Don't load questions yet - wait for user decision
                    setLoading(false);
                    return;
                }

                // Step 3: No progress - start normally
                await loadQuestionsAndResume(deckId, progressData);
            } catch (err) {
                console.error("Failed to start MCQ deck:", err);
                // Fallback: try to load questions anyway
                if (mounted) {
                    await loadQuestionsAndResume(deckId, null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [deckId, isDemo]);

    // Helper: Load questions and resume at correct index
    const loadQuestionsAndResume = async (deckId, progressData) => {
        const qs = await apiMCQ.getMCQQuestions(deckId);
        setQuestions(qs || []);

        // Resume at last_question_index + 1 if progress exists
        if (progressData?.last_question_index != null) {
            const resumeIndex = Math.min(
                progressData.last_question_index + 1,
                (qs || []).length - 1
            );
            setIndex(resumeIndex);
        } else {
            setIndex(0);
        }

        // Load existing answers from questions (if user_answer exists)
        const existingAnswers = {};
        (qs || []).forEach((q) => {
            if (q.user_answer) {
                existingAnswers[q.id] = {
                    selectedText: q.options?.find((opt, i) => LETTERS[i] === q.user_answer.selected_option_letter) || "",
                    selectedLetter: q.user_answer.selected_option_letter,
                    isCorrect: q.user_answer.is_correct,
                    correctLetter: q.correct_option_letter,
                    explanationSelected: "",
                    timeSpent: q.user_answer.time_ms ? Math.floor(q.user_answer.time_ms / 1000) : 0,
                    explainAll: false,
                };
            }
        });
        setAnswers(existingAnswers);

        // Check if finished
        if (progressData?.status === "completed") {
            setFinished(true);
        }
    };

    // Entry modal handlers
    const handleContinue = async () => {
        setShowEntryModal(false);
        await loadQuestionsAndResume(deckId, progress);
    };

    const handleStartOver = async () => {
        setShowEntryModal(false);
        try {
            await apiMCQ.resetMCQDeck(deckId);
            const startResponse = await apiMCQ.startMCQDeck(deckId);
            await loadQuestionsAndResume(deckId, startResponse?.progress);
        } catch (err) {
            console.error("Failed to start over:", err);
        }
    };

    const handleReview = async (scope = "all") => {
        setShowEntryModal(false);
        setReviewMode(true);
        setReviewScope(scope);
        try {
            const reviewQuestions = await apiMCQ.getMCQReview(deckId, scope);
            setQuestions(reviewQuestions || []);
            setIndex(0);
            setFinished(false);
            
            // Load existing answers from review questions (read-only)
            const reviewAnswers = {};
            (reviewQuestions || []).forEach((q) => {
                if (q.user_answer) {
                    reviewAnswers[q.id] = {
                        selectedText: q.options?.find((opt, i) => LETTERS[i] === q.user_answer.selected_option_letter) || "",
                        selectedLetter: q.user_answer.selected_option_letter,
                        isCorrect: q.user_answer.is_correct,
                        correctLetter: q.correct_option_letter,
                        explanationSelected: "",
                        timeSpent: q.user_answer.time_ms ? Math.floor(q.user_answer.time_ms / 1000) : 0,
                        explainAll: false,
                    };
                }
            });
            setAnswers(reviewAnswers);
        } catch (err) {
            console.error("Failed to load review:", err);
        }
    };

    const handleRetakeWrong = async () => {
        setShowEntryModal(false);
        try {
            const retakeResponse = await apiMCQ.retakeWrongMCQ(deckId);
            await loadQuestionsAndResume(deckId, retakeResponse?.progress);
        } catch (err) {
            console.error("Failed to retake wrong:", err);
        }
    };

    const handleRestart = async () => {
        setShowEntryModal(false);
        try {
            await apiMCQ.resetMCQDeck(deckId);
            const startResponse = await apiMCQ.startMCQDeck(deckId);
            await loadQuestionsAndResume(deckId, startResponse?.progress);
        } catch (err) {
            console.error("Failed to restart:", err);
        }
    };

    // ---------------- Timer ----------------
    useEffect(() => {
        if (!q) return;

        // In review mode, show time from backend, don't run timer
        if (reviewMode) {
            if (answerState?.timeSpent != null) {
                setElapsed(answerState.timeSpent);
            }
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = null;
            return;
        }

        if (answerState?.timeSpent != null) {
            setElapsed(answerState.timeSpent);
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = null;
            return;
        }

        startedAtRef.current = Date.now();
        setElapsed(0);

        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }, 250);

        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
            tickRef.current = null;
        };
    }, [q?.id, index, answerState?.timeSpent, reviewMode]);

    // ---------------- Scroll Reset ----------------
    // Reset scroll position to top whenever question index or review mode changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "auto" });
        }
    }, [index, reviewMode]);

    function stopTimer() {
        // if timer hasn't started for some reason, fall back to the live elapsed state
        if (!startedAtRef.current) return elapsed || 0;

        return Math.floor((Date.now() - startedAtRef.current) / 1000);
    }

    // ---------------- Answer selection ----------------
    function handleSelect(optText) {
        if (!q || answerState || reviewMode) return; // Guard: no answering in review mode

        const timeSpent = stopTimer();
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
        setElapsed(timeSpent);

        // ✅ Get selected option from backend-provided options_full
        // Prefer matching by normalized text
        const selectedRow =
            optionLookup?.byTextNorm?.[normalize(optText)] || null;

        if (!selectedRow) {
            console.error("Selected option not found in options_full", {
                questionId: q.id,
                optText,
                options_full: q.options_full,
            });
            return;
        }

        const selectedLetter = selectedRow.letter;
        const isCorrect = !!selectedRow.is_correct;

        // ✅ explanation is coming from DB already (mcq_option_explanations merged into options_full)
        const explanationSelected = selectedRow.explanation || "";

        // STEP A: Immediate UI update (optimistic)
        // Update local state FIRST - don't wait for backend
        setAnswers((prev) => ({
            ...prev,
            [q.id]: {
                selectedText: optText,
                selectedLetter,
                isCorrect,
                correctLetter: q.correct_option_letter ?? null,
                explanationSelected,
                timeSpent,
                explainAll: false,
            },
        }));

        // STEP B: Background backend sync (non-blocking)
        // In demo mode, skip backend call
        if (isDemo && deckId === DEMO_MCQ_DECK_ID) {
            return; // Skip backend sync in demo mode
        }

        // Fire backend call asynchronously - don't await
        const timeMs = timeSpent * 1000; // Convert seconds to milliseconds
        apiMCQ.answerMCQQuestion(q.id, selectedLetter, timeMs)
            .then((answerResponse) => {
                // Reconcile progress from backend response
                if (answerResponse?.progress) {
                    setProgress(answerResponse.progress);
                    // Note: Don't auto-advance or show results here
                    // User must explicitly click "Next" to advance
                }
            })
            .catch((err) => {
                // Error handling: log but don't rollback UI
                console.error("Failed to submit answer (background sync):", err);
                // Optionally retry once
                setTimeout(() => {
                    apiMCQ.answerMCQQuestion(q.id, selectedLetter, timeMs)
                        .then((retryResponse) => {
                            if (retryResponse?.progress) {
                                setProgress(retryResponse.progress);
                            }
                        })
                        .catch((retryErr) => {
                            console.error("Retry also failed:", retryErr);
                        });
                }, 1000);
            });
    }

    // ---------------- UI helpers ----------------
    function optionState(optText, i) {
        if (!answerState) return "idle";

        const letter = LETTERS[i];
        const correctLetter = answerState.correctLetter;

        // Always show correct option in green when answer exists
        if (letter === correctLetter) return "correct";
        
        // Show selected wrong option in red
        if (letter === answerState.selectedLetter && answerState.isCorrect === false) {
            return "wrong";
        }
        
        return "idle";
    }

    function optionInlineStyle(optText, i) {
        const st = optionState(optText, i);
        if (st === "correct") {
            return {
                borderColor: "rgba(0,245,204,0.95)",
                boxShadow: "0 0 26px rgba(0,245,204,0.45)",
            };
        }
        if (st === "wrong") {
            return {
                borderColor: "rgba(248,113,113,0.95)",
                boxShadow: "0 0 26px rgba(248,113,113,0.45)",
            };
        }
        return {};
    }

    function optionClass(optText, i) {
        if (!answerState)
            return "border-white/10 hover:border-white/30 hover:bg-white/[0.03]";
        const st = optionState(optText, i);
        if (st === "correct") return neonGreen;
        if (st === "wrong") return neonRed;
        return "border-white/10 opacity-70";
    }

    function explanationFor(optText, i) {
        if (!answerState) return null;

        const letter = LETTERS[i];
        const row = optionLookup?.byLetter?.[letter];
        const optionSpecific = row?.explanation || null;

        // ===============================
        // ✅ EXPLAIN ALL MODE
        // ===============================
        if (answerState.explainAll) {
            if (!optionSpecific) return null;

            if (letter === answerState.correctLetter) {
                return buildCorrectExplanation({ base: optionSpecific });
            }

            return buildWrongExplanation({ optionBase: optionSpecific });
        }

        // ===============================
        // NORMAL FLOW (single selection)
        // ===============================

        // Selected option
        if (letter === answerState.selectedLetter) {
            const base =
                optionSpecific || answerState.explanationSelected || null;

            if (answerState.isCorrect) {
                return buildCorrectExplanation({ base });
            }

            return buildWrongExplanation({ optionBase: base });
        }

        // Show correct explanation when user is wrong
        if (!answerState.isCorrect && letter === answerState.correctLetter) {
            if (!optionSpecific) return null;
            return buildCorrectExplanation({ base: optionSpecific });
        }

        return null;
    }

    // Expose handlers for demo mode programmatic triggering
    useEffect(() => {
        if (!isDemo || deckId !== DEMO_MCQ_DECK_ID) {
            // Clean up window globals when not in demo mode
            if (typeof window !== "undefined") {
                delete window.demoMcqSelectOption;
                delete window.demoMcqExplainAll;
            }
            return;
        }

        if (typeof window !== "undefined") {
            // Expose handleSelect for Step 10
            window.demoMcqSelectOption = (optText) => {
                if (!q || answerState || reviewMode) return;
                
                // Try to use the real handleSelect first
                // But if it fails (e.g., option not found in lookup), directly seed state
                const selectedRow = optionLookup?.byTextNorm?.[normalize(optText)] || 
                                  q.options_full?.find(opt => {
                                      const optTextNorm = normalize(opt.text || opt.option_text || "");
                                      return optTextNorm === normalize(optText);
                                  });
                
                if (selectedRow) {
                    // Directly set answer state - this ensures state is always set in demo
                    setAnswers((prev) => ({
                        ...prev,
                        [q.id]: {
                            selectedText: optText,
                            selectedLetter: selectedRow.letter,
                            isCorrect: !!selectedRow.is_correct,
                            correctLetter: q.correct_option_letter ?? null,
                            explanationSelected: selectedRow.explanation || "",
                            timeSpent: 0,
                            explainAll: false,
                        },
                    }));
                } else {
                    // Fallback: try handleSelect if direct lookup fails
                    try {
                        handleSelect(optText);
                    } catch (err) {
                        console.warn("[Demo] Failed to select option:", err);
                    }
                }
            };

            // Expose explain all handler for Step 11
            window.demoMcqExplainAll = () => {
                if (q && answerState && !answerState.explainAll) {
                    setAnswers((prev) => ({
                        ...prev,
                        [q.id]: {
                            ...prev[q.id],
                            explainAll: true,
                        },
                    }));
                }
            };
        }

        return () => {
            if (typeof window !== "undefined") {
                delete window.demoMcqSelectOption;
                delete window.demoMcqExplainAll;
            }
        };
    }, [isDemo, deckId, q, answerState, reviewMode]);

    // ---------------- Render ----------------
    if (loading) return <div className="text-muted">Loading…</div>;
    
    // Show entry modal if needed
    if (showEntryModal && progress) {
        return (
            <MCQEntryModal
                status={progress.status}
                onContinue={handleContinue}
                onStartOver={handleStartOver}
                onReview={() => handleReview("all")}
                onRetakeWrong={handleRetakeWrong}
                onRestart={handleRestart}
            />
        );
    }
    
    if (finished) {
        // Use backend progress stats if available, otherwise calculate from local answers
        const stats = progress ? {
            total: progress.questions_answered || 0,
            correct: progress.questions_correct || 0,
            percent: progress.questions_answered 
                ? Math.round((progress.questions_correct / progress.questions_answered) * 100)
                : 0,
            totalTime: Object.values(answers).reduce((s, a) => s + (a.timeSpent || 0), 0),
            avgTime: progress.questions_answered && progress.questions_answered > 0
                ? Math.round(Object.values(answers).reduce((s, a) => s + (a.timeSpent || 0), 0) / progress.questions_answered)
                : 0,
        } : calculateStats(answers);

        return (
            <div className="h-full w-full overflow-y-auto pb-16">
                <div className="flex items-center justify-between mb-6">
                    <button className="btn btn-secondary" onClick={goBack}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="flex items-center gap-2 text-xs text-muted">
                        <Clock3 size={14} />
                        {formatSeconds(stats.totalTime)}
                    </div>
                </div>

                <div className="panel p-8 max-w-4xl mx-auto rounded-2xl mb-16">
                    <div className="text-2xl font-semibold mb-2">Deck complete</div>
                    <div className="text-sm text-muted mb-8">
                        (We’ll style this and add actions next.)
                    </div>

                    <div className="flex flex-col items-center gap-10">

                        {/* HERO SCORE */}
                        <div className="panel px-12 py-10 rounded-2xl text-center
        border border-teal/40 bg-teal/5
        shadow-[0_0_45px_rgba(0,245,204,0.25)]">

                            <div className="text-sm uppercase tracking-wider text-teal/80 mb-2">
                                Score
                            </div>

                            <div className="text-5xl font-bold text-white">
                                {stats.correct} / {stats.total}
                            </div>

                            <div className="text-sm text-muted mt-2">
                                {stats.percent}% correct
                            </div>
                        </div>

                        {/* SUPPORTING STATS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                            <div className="panel p-4 rounded-xl border border-white/10 text-center">
                                <div className="text-xs text-muted mb-1">Total time</div>
                                <div className="text-xl font-semibold">
                                    {formatSeconds(stats.totalTime)}
                                </div>
                            </div>

                            <div className="panel p-4 rounded-xl border border-white/10 text-center">
                                <div className="text-xs text-muted mb-1">Avg / question</div>
                                <div className="text-xl font-semibold">
                                    {formatSeconds(stats.avgTime)}
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-col items-center gap-3 mt-4">
                            <div className="flex justify-center gap-3 flex-wrap">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => handleReview("wrong")}
                                >
                                    Review Mistakes
                                </button>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => handleReview("all")}
                                >
                                    Review All
                                </button>
                            </div>
                            <div className="flex justify-center gap-3 flex-wrap">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={handleRetakeWrong}
                                    disabled={progress?.status !== "completed"}
                                >
                                    Retake Mistakes
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleRestart}
                                >
                                    Restart Deck
                                </button>
                            </div>
                            <button className="btn btn-secondary mt-2" onClick={goBack}>
                                Back to decks
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
    if (!q) return null;

    return (
        <div ref={scrollContainerRef} className="h-full overflow-y-auto pb-16">
            <div className="flex items-center justify-between mb-6">
                <button className="btn btn-secondary" onClick={goBack}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-2 text-xs text-muted">
                    <Clock3 size={14} />
                    {formatSeconds(elapsed)}
                </div>
            </div>

            <div className="panel p-8 max-w-4xl mx-auto rounded-2xl mb-16">
                {reviewMode && (
                    <div className="mb-4 p-3 rounded-lg bg-teal/10 border border-teal/30">
                        <p className="text-sm text-teal">
                            {reviewScope === "wrong" ? "Reviewing mistakes only" : "Reviewing all questions"}
                        </p>
                    </div>
                )}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted mb-1">
                        <span>Question {index + 1} of {questions.length}</span>
                        <span>
                            {Math.round(((index + 1) / questions.length) * 100)}%
                        </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/10">
                        <div
                            className="h-full bg-teal-400"
                            style={{
                                width: `${((index + 1) / questions.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
                <div className="flex items-start justify-between gap-6 mb-3">
                    <div className="flex-1 flex items-start gap-3">
                        <div className="text-[1.35rem] font-semibold leading-relaxed flex-1" data-demo="mcq-question-text">
                            {q.question}
                        </div>
                        <SourceAttribution
                            sourceFileId={q.source_file_id}
                            sourceFileTitle={q.source_file_title}
                            sourcePageNumbers={q.source_page_numbers}
                            className="mt-1 shrink-0"
                            position="bottom"
                        />
                    </div>
                    <button className="btn btn-secondary shrink-0">
                        <Send size={16} /> Astra
                    </button>
                </div>

                {isSingleBestAnswerQuestion(q.question) && (
                    <div className="text-xs text-muted mb-6">Select the single best answer.</div>
                )}

                <div className="space-y-4">
                    {(q.options || []).slice(0, 5).map((opt, i) => {
                        const st = optionState(opt, i);
                        let explanation = explanationFor(opt, i);

                        if (explanation) explanation = stripQuotedOption(explanation, opt);

                        // In review mode, show all answers but disable interaction
                        const isReviewMode = reviewMode;
                        const isAnswered = !!answerState;

                        return (
                            <div
                                key={`${i}-${opt}`}
                                onClick={() => !isReviewMode && !isAnswered && handleSelect(opt)}
                                className={`panel p-5 rounded-xl transition-all ${optionClass(
                                    opt,
                                    i
                                )} ${isReviewMode || isAnswered ? "cursor-default" : "cursor-pointer"}`}
                                style={optionInlineStyle(opt, i)}
                                data-demo="mcq-option"
                                data-demo-index={i}
                            >
                                <div className="flex gap-4 items-start">
                                    <div className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center text-sm font-semibold">
                                        {LETTERS[i]}
                                    </div>

                                    <div className="flex-1 text-base leading-relaxed">{opt}</div>

                                    {answerState && st === "correct" && (
                                        <CheckCircle2 className="text-teal mt-1" />
                                    )}
                                    {answerState && st === "wrong" && (
                                        <XCircle className="text-red-400 mt-1" />
                                    )}
                                </div>

                                {explanation && (
                                    <div
                                        className={`mt-4 rounded-xl p-4 border text-sm leading-relaxed ${st === "correct"
                                            ? "bg-teal/10 border-teal/30"
                                            : "bg-red-500/10 border-red-400/30"
                                            }`}
                                        data-demo="mcq-explanation-container"
                                    >
                                        <div className="text-muted whitespace-pre-line">
                                            {explanation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between mt-10">
                    <button
                        className="btn btn-secondary"
                        disabled={index === 0}
                        onClick={() => setIndex((i) => i - 1)}
                    >
                        Previous
                    </button>

                    <div className="flex gap-3">
                        {/* PRIMARY Explain All button - ONLY button with data-demo="mcq-explain-all-button" */}
                        {/* This button is in the MCQ action bar and only renders when answerState exists and explainAll is false */}
                        {/* No other element in the DOM should have this selector */}
                        {answerState && !answerState.explainAll && (
                            <button
                                className="btn btn-secondary"
                                data-demo="mcq-explain-all-button"
                                onClick={() =>
                                    setAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: {
                                            ...prev[q.id],
                                            explainAll: true,
                                        },
                                    }))
                                }
                            >
                                Explain All
                            </button>
                        )}

                        <button
                            className="btn btn-secondary"
                            data-demo="mcq-next-button"
                            onClick={() => {
                                // Manual navigation - user must explicitly click Next to advance
                                if (index === questions.length - 1) {
                                    // On last question, show results screen
                                    // Backend may have confirmed completion via background sync
                                    setFinished(true);
                                } else {
                                    // Advance to next question
                                    setIndex((i) => i + 1);
                                }
                            }}
                        >
                            Next
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}
