import React, { useMemo, useState } from "react";
import { Globe, ChevronDown, Search } from "lucide-react";

const PRIORITY_COUNTRIES = [
    "Kingdom of Saudi Arabia",
    "Turkey",
    "United Arab Emirates",
    "United Kingdom",
    "United States"
];

const ALL_COUNTRIES = [
    "Australia",
    "Canada",
    "France",
    "Germany",
    "India",
    "Italy",
    "Netherlands",
    "Pakistan",
    "Spain",
    "Other"
];

const StepCountry = ({ value, onChange, onNext, onBack }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const countries = useMemo(() => {
        const filtered = ALL_COUNTRIES.filter(c =>
            c.toLowerCase().includes(query.toLowerCase())
        );

        const filteredPriority = PRIORITY_COUNTRIES.filter(c =>
            c.toLowerCase().includes(query.toLowerCase())
        );

        return {
            priority: filteredPriority,
            others: filtered.sort((a, b) => a.localeCompare(b))
        };
    }, [query]);

    return (
        <div className="space-y-6 relative">
            {/* SELECT */}
            <div className="relative">
                <Globe
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    size={20}
                />

                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-12
                     text-left text-white outline-none focus:border-teal
                     focus:shadow-[0_0_15px_rgba(0,200,180,0.15)]
                     hover:border-white/20 transition"
                >
                    {value || "Select your country"}
                </button>

                <ChevronDown
                    size={18}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-muted transition ${open ? "rotate-180" : ""
                        }`}
                />

                {/* DROPDOWN */}
                {open && (
                    <div
                        className="absolute z-20 mt-2 w-full rounded-xl border border-white/10
                       bg-[#0D0F12] shadow-2xl overflow-hidden"
                    >
                        {/* SEARCH */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                            <Search size={16} className="text-muted" />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search country..."
                                className="w-full bg-transparent text-sm text-white outline-none"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {/* PRIORITY */}
                            {countries.priority.length > 0 && (
                                <>
                                    <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted">
                                        Popular
                                    </div>
                                    {countries.priority.map(c => (
                                        <Option
                                            key={c}
                                            label={c}
                                            onSelect={() => {
                                                onChange(c);
                                                setOpen(false);
                                                setQuery("");
                                            }}
                                        />
                                    ))}
                                </>
                            )}

                            {/* OTHERS */}
                            {countries.others.length > 0 && (
                                <>
                                    <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted">
                                        All countries
                                    </div>
                                    {countries.others.map(c => (
                                        <Option
                                            key={c}
                                            label={c}
                                            onSelect={() => {
                                                onChange(c);
                                                setOpen(false);
                                                setQuery("");
                                            }}
                                        />
                                    ))}
                                </>
                            )}

                            {countries.priority.length === 0 &&
                                countries.others.length === 0 && (
                                    <div className="px-4 py-6 text-sm text-muted text-center">
                                        No results found
                                    </div>
                                )}
                        </div>
                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 rounded-xl border border-white/10
                       hover:bg-white/5 text-white font-medium transition"
                    >
                        Back
                    </button>
                )}

                <button
                    onClick={onNext}
                    disabled={!value}
                    className={`${onBack ? "flex-[2]" : "flex-1"}
                     btn-primary py-4 text-lg rounded-xl
                     shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

const Option = ({ label, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        className="w-full text-left px-4 py-3 text-sm text-white
               hover:bg-white/5 transition"
    >
        {label}
    </button>
);

export default StepCountry;
