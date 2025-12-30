// src/components/SidebarItem.jsx
import { NavLink } from "react-router-dom";

export default function SidebarItem({ icon: Icon, label, to, className = "" }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `group relative flex items-center rounded-lg w-full ${className} ${
                    isActive ? "bg-neutral-800" : ""
                } hover:bg-neutral-800 transition`
            }
        >
            <div className="p-3">
                <Icon size={22} />
            </div>

            <span
                className="
                    absolute left-14
                    whitespace-nowrap
                    rounded-md bg-black px-3 py-1
                    text-sm text-white
                    opacity-0 group-hover:opacity-100
                    transition
                    pointer-events-none
                "
            >
                {label}
            </span>
        </NavLink>
    );
}

