// src/components/SidebarItem.jsx
import React from "react";

export default function SidebarItem({ icon: Icon, label, onClick, isActive = false, className = "" }) {
    return (
        <div className={`group relative flex items-center ${className}`}>
            <button
                onClick={onClick}
                className={`
                    nav-item w-full flex items-center justify-center
                    ${isActive ? "active" : ""}
                `}
            >
                <Icon size={20} />
            </button>

            <span
                className="
                    absolute left-14
                    whitespace-nowrap
                    rounded-md bg-black px-3 py-1
                    text-sm text-white
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    pointer-events-none
                    z-50
                    shadow-lg
                "
            >
                {label}
            </span>
        </div>
    );
}

