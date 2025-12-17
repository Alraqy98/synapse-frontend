import React, { useState } from "react";
import { Calendar, BookOpen, ChevronDown, Search } from "lucide-react";

const FIELD_OPTIONS = [
    { label: "Dentistry", value: "dentistry" },
    { label: "Medicine", value: "medicine" },
    { label: "Nursing", value: "nursing" },
    { label: "Pharmacy", value: "pharmacy" },
    { label: "Physiotherapy", value: "physiotherapy" },
    { label: "Other", value: "other" },
];

const YEAR_OPTIONS = ["1", "2", "3", "4", "5", "6"];

const Dropdown = ({
    icon: Icon,
    placeholder,
    value,
    options,
    onSelect,
    searchable = false,
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = options.find((o) => o.value === value);
    const filtered = searchable
        ? options.filter((o) =>
            o.label.toLowerCase().includes(query.toLowerCase())
        )
        : options;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`
          w-full flex items-center gap-3 py-4 px-4 rounded-xl
          bg-black/20 border border-white/10 text-white
          hover:border-white/20 transition-all
          ${open ? "border-teal shadow-[0_0_15px_rgba(0,200,180,0.15)]" : ""}
        `}
            >
                <Icon size={20} className="text-muted" />
                <span className={`flex-1 text-left ${!selected && "text-muted"}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-[#0D0F12] shadow-2xl overflow-hidden">
                    {searchable && (
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                            <Search size={16} className="text-muted" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-transparent outline-none text-sm text-white placeholder-muted"
                            />
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto">
                        {filtered.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onSelect(opt.value);
                                    setOpen(false);
                                    setQuery("");
                                }}
                                className={`
                  w-full px-4 py-3 text-left text-sm transition-colors
                  hover:bg-white/5
                  ${value === opt.value ? "bg-teal/10 text-teal" : "text-white"}
                `}
                            >
                                {opt.label}
                            </button>
                        ))}

                        {filtered.length === 0 && (
                            <div className="px-4 py-3 text-sm text-muted">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StepYearOrSpecialty = ({
    fieldOfStudy,
    yearOfStudy,
    onChangeField,
    onChangeYear,
    onNext,
    onBack,
}) => {
    const canContinue = fieldOfStudy && yearOfStudy;

    return (
        <div className="space-y-6">
            {/* Field of study */}
            <Dropdown
                icon={BookOpen}
                placeholder="Select field of study"
                value={fieldOfStudy}
                options={FIELD_OPTIONS}
                onSelect={onChangeField}
                searchable
            />

            {/* Year of study */}
            <Dropdown
                icon={Calendar}
                placeholder="Select year of study"
                value={yearOfStudy}
                options={YEAR_OPTIONS.map((y) => ({
                    label: `Year ${y}`,
                    value: y,
                }))}
                onSelect={onChangeYear}
            />

            {/* Navigation */}
            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium UI transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    className="flex-[2] btn-primary py-4 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default StepYearOrSpecialty;
