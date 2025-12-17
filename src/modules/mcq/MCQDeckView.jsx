import { useEffect, useRef, useState, useMemo } from "react";
import { apiMCQ } from "./apiMCQ";
import { Send, ArrowLeft, Clock3, CheckCircle2, XCircle } from "lucide-react";

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
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    // ✅ store by QUESTION ID (not array index)
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);
    const handleRetake = () => {
        setFinished(false);
        setIndex(0);
        setAnswers({});
        setElapsed(0);

        // reset timers cleanly
        startedAtRef.current = null;
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
    };
    const [elapsed, setElapsed] = useState(0);
    const startedAtRef = useRef(null);
    const tickRef = useRef(null);

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
            byTextNorm[normalize(row.option_text)] = row;
        }

        return { byLetter, byTextNorm };
    }, [q?.id, q?.options_full]);

    // ---------------- Load questions ----------------
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                const qs = await apiMCQ.getMCQQuestions(deckId);

                if (!mounted) return;

                setQuestions(qs || []);
                setIndex(0);
                setAnswers({});
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [deckId]);

    // ---------------- Timer ----------------
    useEffect(() => {
        if (!q) return;

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
    }, [q?.id, index, answerState?.timeSpent]);

    function stopTimer() {
        // if timer hasn't started for some reason, fall back to the live elapsed state
        if (!startedAtRef.current) return elapsed || 0;

        return Math.floor((Date.now() - startedAtRef.current) / 1000);
    }

    // ---------------- Answer selection ----------------
    async function handleSelect(optText) {
        if (!q || answerState) return;

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
    }

    // ---------------- UI helpers ----------------
    function optionState(optText, i) {
        if (!answerState) return "idle";

        const letter = LETTERS[i];
        const correctLetter = answerState.correctLetter;

        if (letter === correctLetter) return "correct";
        if (letter === answerState.selectedLetter && answerState.isCorrect === false)
            return "wrong";
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


    // ---------------- Render ----------------
    if (loading) return <div className="text-muted">Loading…</div>;
    if (finished) {
        const stats = calculateStats(answers);

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
                        <div className="flex justify-center gap-4 mt-4">
                            <button className="btn btn-secondary" onClick={goBack}>
                                Back to decks
                            </button>

                            <button className="btn btn-primary" onClick={handleRetake}>
                                Retake MCQ
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
    if (!q) return null;

    return (
        <div className="h-full overflow-y-auto pb-16">
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
                    <div className="text-[1.35rem] font-semibold leading-relaxed">
                        {q.question}
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

                        return (
                            <div
                                key={`${i}-${opt}`}
                                onClick={() => handleSelect(opt)}
                                className={`panel p-5 rounded-xl cursor-pointer transition-all ${optionClass(
                                    opt,
                                    i
                                )}`}
                                style={optionInlineStyle(opt, i)}
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
                        {/* ✅ Backend route is disabled, so don't show this button right now */}
                        {answerState && !answerState.explainAll && (
                            <button
                                className="btn btn-secondary"
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
                            onClick={() => {
                                if (index === questions.length - 1) {
                                    setFinished(true);
                                } else {
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
