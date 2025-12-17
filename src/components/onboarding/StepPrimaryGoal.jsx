import React from 'react';
import { Target, BookOpen, Zap, Activity, CheckSquare, Search } from 'lucide-react';

const StepPrimaryGoal = ({ value = [], onChange, onNext, onBack }) => {
    const goals = [
        { id: 'exams', label: 'Pass Exams', icon: Target },
        { id: 'summaries', label: 'Study Summaries', icon: BookOpen },
        { id: 'flashcards', label: 'Flashcards', icon: Zap },
        { id: 'clinical', label: 'Clinical Cases', icon: Activity },
        { id: 'osce', label: 'OSCE Prep', icon: Activity },
        { id: 'mcqs', label: 'Question Bank', icon: CheckSquare },
        { id: 'research', label: 'Research Help', icon: Search },
    ];

    const toggleGoal = (id) => {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => {
                    const isSelected = value.includes(goal.id);
                    return (
                        <button
                            key={goal.id}
                            onClick={() => toggleGoal(goal.id)}
                            className={`
                flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all duration-200 text-center
                ${isSelected
                                    ? 'bg-teal/10 border-teal shadow-[0_0_15px_rgba(0,200,180,0.15)] scale-105'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}
              `}
                        >
                            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isSelected ? 'bg-teal text-black' : 'bg-black/40 text-muted'}
              `}>
                                <goal.icon size={20} />
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-teal' : 'text-white'}`}>
                                {goal.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-4 mt-8">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={value.length === 0}
                    className="flex-[2] btn-primary py-4 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default StepPrimaryGoal;
