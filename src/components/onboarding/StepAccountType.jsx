import React from 'react';
import { GraduationCap, Stethoscope, User, Briefcase } from 'lucide-react';

const StepAccountType = ({ value, onChange, onNext }) => {
    const options = [
        { id: 'student', label: 'Medical Student', icon: GraduationCap, desc: 'I am in med school' },
        { id: 'resident', label: 'Resident', icon: Stethoscope, desc: 'I am in residency' },
        { id: 'fellow', label: 'Fellow', icon: Briefcase, desc: 'I am in fellowship' },
        { id: 'physician', label: 'Physician', icon: User, desc: 'I am practicing' },
        { id: 'other', label: 'Other', icon: User, desc: 'Allied health / Other' },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => { onChange(opt.id); }}
                        className={`
              flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group
              ${value === opt.id
                                ? 'bg-teal/10 border-teal shadow-[0_0_15px_rgba(0,200,180,0.15)]'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}
            `}
                    >
                        <div className={`
              w-12 h-12 rounded-lg flex items-center justify-center transition-colors
              ${value === opt.id ? 'bg-teal text-black' : 'bg-black/40 text-muted group-hover:text-white'}
            `}>
                            <opt.icon size={24} />
                        </div>
                        <div>
                            <div className={`font-bold ${value === opt.id ? 'text-teal' : 'text-white'}`}>
                                {opt.label}
                            </div>
                            <div className="text-sm text-muted">{opt.desc}</div>
                        </div>
                    </button>
                ))}
            </div>

            <button
                onClick={onNext}
                disabled={!value}
                className="w-full mt-8 btn-primary py-4 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
                Continue
            </button>
        </div>
    );
};

export default StepAccountType;
