// src/components/AppLogo.jsx
// Reusable Synapse logo component for auth screens and other contexts

import React from "react";
import logo from "../assets/synapse-logo.png";

const AppLogo = ({ size = 24, className = "" }) => {
    return (
        <img
            src={logo}
            alt="Synapse Logo"
            className={`w-auto ${className}`}
            style={{ height: `${size}px` }}
        />
    );
};

export default AppLogo;

