import React, { useState } from "react";
import GenerateFlashcardsModal from "./GenerateFlashcardsModal";
import DeckList from "./DeckList";
import PopupDialog from "../../components/PopupDialog";

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
        <div className="w-full h-full space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Flashcards</h1>
                    <p className="text-xs text-muted">
                        AI-generated decks from your uploaded materials.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="px-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 hover:border-teal/60 transition"
                        onClick={handleImport}
                    >
                        Import Deck
                    </button>

                    <button
                        className="btn btn-primary px-6 py-2"
                        onClick={() => setShowGenerateModal(true)}
                    >
                        Generate Flashcards
                    </button>
                </div>
            </div>

            {/* SEARCH + SORT */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-muted text-sm">🔍</span>
                        <input
                            className="bg-transparent outline-none w-full text-sm"
                            placeholder="Search decks…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu((p) => !p)}
                        className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:border-teal/60 transition"
                    >
                        Sort by: {sortMode === "date" ? "Date" : "Name"} ▾
                    </button>

                    {showSortMenu && (
                        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-void border border-white/10 shadow-xl z-50 overflow-hidden">
                            <div
                                className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                                onClick={() => {
                                    setSortMode("date");
                                    setShowSortMenu(false);
                                }}
                            >
                                Date
                            </div>
                            <div
                                className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                                onClick={() => {
                                    setSortMode("name");
                                    setShowSortMenu(false);
                                }}
                            >
                                Name
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* GENERATE MODAL */}
            {showGenerateModal && (
                <GenerateFlashcardsModal
                    onCancel={() => setShowGenerateModal(false)}
                    onSuccess={() => setShowGenerateModal(false)}
                />
            )}

            {/* CLEAN DECK LIST */}
            <DeckList openDeck={openDeck} search={search} />

            {/* GLOBAL POPUP */}
            {popup.open && (
                <PopupDialog {...popup} onClose={closePopup} />
            )}
        </div>
    );
}
