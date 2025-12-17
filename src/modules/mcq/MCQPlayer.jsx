import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// =============================
// schema version (IMPORTANT)
// =============================
const MCQ_SCHEMA_VERSION = 2;

// =============================
// local persistence
// =============================
function loadSavedState(deckId) {
    try {
        const raw = localStorage.getItem(`synapse_mcq_${deckId}`);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (parsed.version !== MCQ_SCHEMA_VERSION) return null;

        return parsed;
    } catch {
        return null;
    }
}

function saveState(deckId, state) {
    try {
        localStorage.setItem(
            `synapse_mcq_${deckId}`,
            JSON.stringify({
                version: MCQ_SCHEMA_VERSION,
                ...state,
            })
        );
    } catch { }
}

export default function MCQPlayer({ deckId }) {
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [explanation, setExplanation] = useState("");

    // =============================
    // load questions
    // =============================
    const load = async () => {
        const res = await api.get(`/mcq/decks/${deckId}/questions`);
        const qs = res.data.questions || [];
        setQuestions(qs);

        const saved = loadSavedState(deckId);
        if (saved?.answers) {
            setAnswers(saved.answers);
            if (saved.index < qs.length) {
                setIndex(saved.index);
            }
        }
    };

    useEffect(() => {
        load();
    }, [deckId]);

    useEffect(() => {
        saveState(deckId, { index, answers });
    }, [deckId, index, answers]);

    if (!questions.length) {
        return (
            <div className="px-6 py-8">
                <p className="text-sm text-muted-foreground">
                    Loading questions…
                </p>
            </div>
        );
    }

    const q = questions[index];
    const currentAnswer = answers[q.id];

    // =============================
    // restore explanation on revisit
    // =============================
    useEffect(() => {
        const ans = answers[q.id];
        if (!ans || !q.options_full) {
            setExplanation("");
            return;
        }

        const opt = q.options_full.find(
            (o) => o.letter === ans.selected
        );

        setExplanation(opt?.explanation || "");
    }, [index, answers, questions]);

    const progress =
        (Object.keys(answers).length / questions.length) * 100 || 0;

    // =============================
    // CLICK OPTION = FINAL ANSWER
    // =============================
    const handleSelect = (letter) => {
        if (answers[q.id]) return; // locked after answer

        if (!q.options_full) {
            console.error("options_full missing for question", q.id);
            return;
        }

        const selectedOption = q.options_full.find(
            (o) => o.letter === letter
        );

        if (!selectedOption) return;

        setAnswers((prev) => ({
            ...prev,
            [q.id]: {
                selected: letter,
                correct: selectedOption.is_correct,
            },
        }));

        setExplanation(selectedOption.explanation || "");
    };

    const moveTo = (newIndex) => {
        setIndex(newIndex);
    };

    const correctCount = Object.values(answers).filter(
        (a) => a.correct
    ).length;

    // =============================
    // RENDER
    // =============================
    return (
        <div className="flex gap-6 p-6">
            {/* LEFT NAV */}
            <aside className="w-20">
                <ScrollArea className="h-[80vh] border rounded-md p-2">
                    <div className="grid gap-2">
                        {questions.map((question, i) => {
                            const ans = answers[question.id];
                            const stateClass = ans
                                ? ans.correct
                                    ? "bg-emerald-500 text-white"
                                    : "bg-red-500 text-white"
                                : i === index
                                    ? "bg-blue-600 text-white"
                                    : "bg-muted text-foreground";

                            return (
                                <button
                                    key={question.id}
                                    className={cn(
                                        "rounded-full w-10 h-10 text-xs flex items-center justify-center transition border",
                                        stateClass
                                    )}
                                    onClick={() => moveTo(i)}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </aside>

            {/* CENTER */}
            <main className="flex-1">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                Question {index + 1} / {questions.length}
                            </h2>
                            <div className="w-48">
                                <Progress value={progress} />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    {Math.round(progress)}% answered
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="mb-4 whitespace-pre-line">
                            {q.question}
                        </div>

                        <div className="flex flex-col gap-3">
                            {(q.options_full || []).map((opt) => {
                                const ans = currentAnswer;

                                let cls = "";
                                if (ans && ans.selected === opt.letter) {
                                    cls = ans.correct
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-red-500 bg-red-50";
                                }

                                return (
                                    <Card
                                        key={opt.letter}
                                        className={cn(
                                            "cursor-pointer p-3 border flex gap-2",
                                            cls
                                        )}
                                        onClick={() =>
                                            handleSelect(opt.letter)
                                        }
                                    >
                                        <strong>{opt.letter}.</strong>
                                        <span>{opt.option_text}</span>
                                    </Card>
                                );
                            })}
                        </div>

                        {explanation && (
                            <Card
                                className={cn(
                                    "mt-6 p-4",
                                    currentAnswer?.correct
                                        ? "bg-emerald-50 border-emerald-500"
                                        : "bg-red-50 border-red-500"
                                )}
                            >
                                <div className="text-xs font-semibold mb-2">
                                    {currentAnswer?.correct
                                        ? "Why this is correct:"
                                        : "Why this is wrong:"}
                                </div>
                                <div className="whitespace-pre-line text-sm">
                                    {explanation}
                                </div>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                <Card className="mt-4 p-4 border-emerald-500">
                    Correct: {correctCount} / {questions.length}
                </Card>
            </main>
        </div>
    );
}
