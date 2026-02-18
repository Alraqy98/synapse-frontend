import React from "react";
import { Outlet } from "react-router-dom";

const AnalyticsHub = () => {
    return (
        <div className="max-w-[1600px] mx-auto">
            <Outlet />
        </div>
    );
};

export default AnalyticsHub;
