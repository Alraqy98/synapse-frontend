import React from 'react';
import { Building2 } from 'lucide-react';

const StepUniversity = ({ value, onChange, onNext, onBack }) => {
    return (
        <div className="space-y-6">
            <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter your university or hospital"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-muted outline-none focus:border-teal focus:shadow-[0_0_15px_rgba(0,200,180,0.15)] transition-all"
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!value.trim()}
                    className="flex-[2] btn-primary py-4 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default StepUniversity;
