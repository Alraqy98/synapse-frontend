import React, { useState, useRef } from "react";
import GenerateFlashcardsModal from "./GenerateFlashcardsModal";
import DeckList from "./DeckList";
import { Search, Plus, Upload } from "lucide-react";

export default function FlashcardsTab({ openDeck }) {
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [sortMode, setSortMode] = useState("date");
    const [search, setSearch] = useState("");
    const [showSortMenu, setShowSortMenu] = useState(false);
    
    // Ref to trigger import modal from DeckList
    const showImportRef = useRef(null);

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
                            data-demo="flashcards-generate"
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
                                onClick={() => {
                                    if (showImportRef.current) {
                                        showImportRef.current();
                                    }
                                }}
                            >
                                <Upload size={14} /> Import
                            </button>
                        </div>
                    </div>

                    {/* DECK LIST */}
                    <DeckList 
                        openDeck={openDeck} 
                        search={search} 
                        sortMode={sortMode}
                        onShowImport={(fn) => {
                            showImportRef.current = fn;
                        }}
                    />
                </div>
            </div>

            {/* GENERATE MODAL */}
            {showGenerateModal && (
                <GenerateFlashcardsModal
                    open={true}
                    onClose={() => setShowGenerateModal(false)}
                    onCreated={() => setShowGenerateModal(false)}
                />
            )}
        </div>
    );
}
