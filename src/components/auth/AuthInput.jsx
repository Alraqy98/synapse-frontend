import React, { useState } from 'react';

const AuthInput = ({ label, icon: Icon, type = "text", value, onChange, required = false }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="relative mb-5 group">
            <div
                className={`
          absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300
          ${isFocused || value ? 'text-teal' : 'text-muted'}
        `}
            >
                {Icon && <Icon size={18} />}
            </div>

            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                required={required}
                className={`
          w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4
          text-white placeholder-transparent outline-none transition-all duration-300
          focus:border-teal focus:shadow-[0_0_15px_rgba(0,200,180,0.15)]
          ${value ? 'pt-6 pb-2' : 'py-4'}
        `}
                placeholder={label}
            />

            <label
                className={`
          absolute left-12 transition-all duration-300 pointer-events-none
          ${isFocused || value
                        ? 'top-2 text-[10px] text-teal font-bold uppercase tracking-wider'
                        : 'top-1/2 -translate-y-1/2 text-sm text-muted'}
        `}
            >
                {label}
            </label>
        </div>
    );
};

export default AuthInput;
