// src/modules/settings/AnnouncementsPanel.jsx
import React, { useEffect, useState } from "react";
import { fetchAnnouncements } from "./settings.api";
import { Bell } from "lucide-react";

const AnnouncementsPanel = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchAnnouncements().then(setItems);
    }, []);

    return (
        <div className="panel p-6 space-y-6">
            <div className="flex items-center gap-2 text-white">
                <Bell size={18} className="text-teal" />
                <h2 className="text-lg font-bold">Announcements & Updates</h2>
            </div>

            <div className="space-y-5">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="border-l-2 border-teal/40 pl-4 space-y-1"
                    >
                        <div className="text-sm font-semibold text-white">
                            {item.title}
                        </div>
                        <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
                            {item.body}
                        </div>
                        <div className="text-xs text-muted">{item.date}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnnouncementsPanel;
