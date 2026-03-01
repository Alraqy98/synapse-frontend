// src/modules/settings/AnnouncementsPanel.jsx
import React, { useEffect, useState } from "react";
import { fetchAnnouncements } from "./settings.api";

const AnnouncementsPanel = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchAnnouncements().then(setItems);
    }, []);

    return (
        <div className="bg-[#0D0F12]/60 border border-white/[0.06] rounded-2xl backdrop-blur-sm p-6 space-y-6">
            <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-mono">Updates</div>
                <h2 className="text-base font-semibold text-white">Announcements & Updates</h2>
            </div>

            <div className="space-y-5">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="border-l-2 border-white/20 pl-4 space-y-1"
                    >
                        <div className="text-sm font-semibold text-white">
                            {item.title}
                        </div>
                        <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                            {item.body}
                        </div>
                        <div className="text-xs text-white/40">{item.date}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnnouncementsPanel;
