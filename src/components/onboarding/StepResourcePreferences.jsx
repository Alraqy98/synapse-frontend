import React from 'react';
import { Book, Check } from 'lucide-react';

const StepResourcePreferences = ({ value = [], onChange, onNext, onBack, isSubmitting }) => {
    const resources = [
        "Harrison's Principles", "Robbins Pathology", "AMBOSS", "First Aid",
        "UWorld", "Osmosis", "Sketchy Medical", "Lecture Notes", "Research Papers"
    ];

    const toggleResource = (res) => {
        if (value.includes(res)) {
            onChange(value.filter(v => v !== res));
        } else {
            onChange([...value, res]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map((res) => {
                    const isSelected = value.includes(res);
                    return (
                        <button
                            key={res}
                            onClick={() => toggleResource(res)}
                            className={`
                flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left
                ${isSelected
                                    ? 'bg-teal/10 border-teal shadow-[0_0_10px_rgba(0,200,180,0.1)]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}
              `}
                        >
                            <div className={`
                w-6 h-6 rounded flex items-center justify-center border transition-colors
                ${isSelected ? 'bg-teal border-teal text-black' : 'border-white/30 text-transparent'}
              `}>
                                <Check size={14} strokeWidth={4} />
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-teal' : 'text-white'}`}>
                                {res}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-4 mt-8">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={isSubmitting}
                    className="flex-[2] btn-primary rounded-xl px-10 py-5 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            Setting up...
                        </>
                    ) : (
                        value.length > 0 ? 'Finish Setup' : 'Skip & Finish'
                    )}
                </button>
            </div>
        </div>
    );
};

export default StepResourcePreferences;
