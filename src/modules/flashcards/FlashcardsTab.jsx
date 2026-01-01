import React, { useState } from "react";
import GenerateFlashcardsModal from "./GenerateFlashcardsModal";
import DeckList from "./DeckList";
import PopupDialog from "../../components/PopupDialog";
import { Search, Plus, Upload } from "lucide-react";

export default function FlashcardsTab({ openDeck }) {
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [sortMode, setSortMode] = useState("date");
    const [search, setSearch] = useState("");
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Global popup system
    const [popup, setPopup] = useState({
        open: false,
        title: "",
        message: "",
        input: false,
        placeholder: "",
        onConfirm: null,
        onCancel: null,
    });

    const openPopup = (opts) =>
        setPopup({ open: true, onCancel: () => setPopup({ open: false }), ...opts });

    const closePopup = () => setPopup({ open: false });

    // IMPORT — popup for entering share code
    function handleImport() {
        openPopup({
            title: "Import Deck",
            message: "Enter the share code:",
            input: true,
            placeholder: "XYZ123AB",
            onConfirm: async (code) => {
                if (!code) return;
                try {
                    const res = await importDeck(code.trim());
                    if (!res.deck) {
                        openPopup({
                            title: "Not Found",
                            message: "Invalid share code.",
                        });
                        return;
                    }
                    openPopup({ title: "Success", message: "Deck imported!" });
                } catch (err) {
                    openPopup({
                        title: "Error",
                        message: "Failed to import deck.",
                    });
                }
            },
        });
    }

    return (
        <div className="h-full w-full">
            <div className="max-w-7xl mx-auto px-6 pb-28">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8">
                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-white">
                                Flashcards
                            </h1>
                            <p className="text-sm text-muted mt-1">
                                AI-generated flashcard decks from your uploaded materials
                            </p>
                        </div>

                        <button
                            className="btn btn-primary gap-2"
                            onClick={() => setShowGenerateModal(true)}
                        >
                            <Plus size={16} />
                            Generate Flashcards
                        </button>
                    </div>

                    {/* COMMAND BAR */}
                    <div className="flex flex-wrap items-center gap-3 mb-10 p-3 rounded-2xl bg-black/40 border border-white/10">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                            />
                            <input
                                type="text"
                                placeholder="Search flashcard decks…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                            />
                        </div>

                        <select
                            className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value)}
                        >
                            <option value="date">Newest</option>
                            <option value="name">Name</option>
                        </select>

                        <div className="flex gap-2 ml-auto">
                            <button 
                                className="btn btn-secondary gap-2"
                                onClick={handleImport}
                            >
                                <Upload size={14} /> Import
                            </button>
                        </div>
                    </div>

                    {/* DECK LIST */}
                    <DeckList openDeck={openDeck} search={search} sortMode={sortMode} />
                </div>
            </div>

            {/* GENERATE MODAL */}
            {showGenerateModal && (
                <GenerateFlashcardsModal
                    onCancel={() => setShowGenerateModal(false)}
                    onSuccess={() => setShowGenerateModal(false)}
                />
            )}

            {/* GLOBAL POPUP */}
            {popup.open && (
                <PopupDialog {...popup} onClose={closePopup} />
            )}
        </div>
    );
}
