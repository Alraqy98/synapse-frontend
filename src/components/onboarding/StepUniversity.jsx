import React, { useState, useEffect, useRef } from 'react';
import { Building2, Loader2 } from 'lucide-react';

const StepUniversity = ({ value, onChange, onNext, onBack }) => {
    const [searchQuery, setSearchQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLocked, setIsLocked] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Debounced search function
    useEffect(() => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // If locked, don't search
        if (isLocked) {
            return;
        }

        const query = searchQuery.trim();

        // Only search if query length >= 2
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            setHasSearched(false);
            return;
        }

        // Debounce search by 250ms
        debounceTimerRef.current = setTimeout(async () => {
            setIsLoading(true);
            setHasSearched(true);
            
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/onboarding/universities/search?q=${encodeURIComponent(query)}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const data = await response.json();
                
                // Normalize API response to always get an array of universities
                // Supports: direct array, { results: [...] }, { data: [...] }
                let universities = [];
                if (Array.isArray(data)) {
                    universities = data;
                } else if (Array.isArray(data?.results)) {
                    universities = data.results;
                } else if (Array.isArray(data?.data)) {
                    universities = data.data;
                }
                
                setResults(universities);
                setShowDropdown(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('University search error:', error);
                setResults([]);
                setShowDropdown(true); // Show "Use custom entry" option
            } finally {
                setIsLoading(false);
            }
        }, 250);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery, isLocked]);

    // Handle input change
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchQuery(newValue);
        setIsLocked(false);
        setSelectedIndex(-1);
        
        // Update parent immediately for validation
        onChange(newValue);
    };

    // Handle selection from dropdown
    const handleSelect = (university) => {
        if (university === 'custom') {
            // Use custom entry - unlock and keep current query
            setIsLocked(false);
            setShowDropdown(false);
            setResults([]);
            return;
        }

        // Select university
        const universityName = typeof university === 'string' ? university : university.name;
        setSearchQuery(universityName);
        onChange(universityName);
        setIsLocked(true);
        setShowDropdown(false);
        setResults([]);
        setSelectedIndex(-1);
        
        // Focus back on input
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showDropdown || results.length === 0) {
            // If no results but dropdown is shown (custom entry option)
            if (showDropdown && e.key === 'Enter' && selectedIndex === 0) {
                e.preventDefault();
                handleSelect('custom');
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => 
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Handle input focus
    const handleFocus = () => {
        if (searchQuery.trim().length >= 2 && results.length > 0) {
            setShowDropdown(true);
        } else if (hasSearched && results.length === 0) {
            setShowDropdown(true); // Show "Use custom entry"
        }
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sync searchQuery with value prop only on initial mount or when value is reset externally
    useEffect(() => {
        // Only sync if value is empty (form reset case)
        if (value === '' && searchQuery !== '') {
            setSearchQuery('');
            setIsLocked(false);
            setShowDropdown(false);
            setResults([]);
            setHasSearched(false);
        }
        // Don't sync when locked - searchQuery is already set by handleSelect
        // Don't sync when user is typing - searchQuery is updated by handleInputChange
    }, [value]);

    // Use searchQuery as single source of truth for input value
    // When locked (after selection), use value prop; otherwise use searchQuery
    const displayValue = isLocked ? value : searchQuery;

    return (
        <div className="space-y-6">
            <div className="relative" ref={dropdownRef}>
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted z-10" size={20} />
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    placeholder="Enter your university or hospital"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-muted outline-none focus:border-teal focus:shadow-[0_0_15px_rgba(0,200,180,0.15)] transition-all"
                    disabled={isLocked}
                />
                {isLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-muted animate-spin" size={20} />
                )}

                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-muted text-sm">
                                Searching...
                            </div>
                        ) : results.length > 0 ? (
                            results.map((university, index) => {
                                const universityName = typeof university === 'string' ? university : university.name;
                                const country = typeof university === 'object' ? university.country : null;
                                const isSelected = index === selectedIndex;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelect(university)}
                                        className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${
                                            isSelected ? 'bg-white/10' : ''
                                        }`}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className="text-white font-medium">{universityName}</div>
                                        {country && (
                                            <div className="text-xs text-muted mt-1">{country}</div>
                                        )}
                                    </button>
                                );
                            })
                        ) : hasSearched ? (
                            <button
                                type="button"
                                onClick={() => handleSelect('custom')}
                                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${
                                    selectedIndex === 0 ? 'bg-white/10' : ''
                                }`}
                                onMouseEnter={() => setSelectedIndex(0)}
                            >
                                <div className="text-white font-medium">Use custom entry</div>
                                <div className="text-xs text-muted mt-1">Continue with "{searchQuery}"</div>
                            </button>
                        ) : null}
                    </div>
                )}
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
