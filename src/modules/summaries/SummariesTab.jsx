// src/modules/summaries/SummariesTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { apiSummaries } from "./apiSummaries";
import SummaryCard from "./SummaryCard";
import GenerateSummaryModal from "./GenerateSummaryModal";
import SummaryViewer from "./SummaryViewer";

export default function SummariesTab() {
    const [view, setView] = useState("list");
    const [summaryId, setSummaryId] = useState(null);
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Load summaries
    // Note: Only confirmed endpoints are used. No file context = empty state.
    const loadSummaries = async () => {
        setLoading(true);
        // No speculative API calls - only use confirmed endpoints
        // Without file context, show empty state
        setSummaries([]);
        setLoading(false);
    };

    useEffect(() => {
        loadSummaries();
    }, []);

    const openSummary = (id) => {
        setSummaryId(id);
        setView("viewer");
    };

    // Filtered and sorted summaries
    const visibleSummaries = useMemo(() => {
        let list = [...summaries];

        if (search) {
            list = list.filter((s) =>
                s.title?.toLowerCase().includes(search.toLowerCase()) ||
                s.file_name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (sort === "newest") {
            list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        if (sort === "oldest") {
            list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }

        return list;
    }, [summaries, search, sort]);

    const handleDelete = async () => {
        if (!confirmDelete) return;

        const id = confirmDelete.id;
        setSummaries((prev) => prev.filter((s) => s.id !== id));
        setConfirmDelete(null);

        try {
            await apiSummaries.deleteSummary(id);
        } catch (err) {
            console.error("Delete failed", err);
            loadSummaries();
        }
    };

    return (
        <div className="h-full w-full">
            {view === "viewer" ? (
                <SummaryViewer
                    summaryId={summaryId}
                    goBack={() => {
                        setView("list");
                        setSummaryId(null);
                        loadSummaries();
                    }}
                />
            ) : (
                <>
                    <div className="max-w-7xl mx-auto px-6 pb-28">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8">
                            {/* HEADER */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight text-white">
                                        Summaries
                                    </h1>
                                    <p className="text-sm text-muted mt-1">
                                        AI-generated summaries from your library files
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary gap-2"
                                    onClick={() => setOpenModal(true)}
                                >
                                    <Plus size={16} />
                                    Generate Summary
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
                                        placeholder="Search summaries…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                                    />
                                </div>

                                <select
                                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                </select>
                            </div>

                            {/* GRID */}
                            {loading ? (
                                <div className="text-sm text-muted">Loading summaries…</div>
                            ) : visibleSummaries.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-muted mb-4">
                                        {search
                                            ? "No summaries match your search."
                                            : "No summaries available. Generate a summary from a file to get started."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {visibleSummaries.map((summary) => (
                                        <SummaryCard
                                            key={summary.id}
                                            summary={summary}
                                            onClick={() => openSummary(summary.id)}
                                            onDelete={(id) =>
                                                setConfirmDelete({ id, title: summary.title })
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DELETE CONFIRM */}
                    {confirmDelete && (
                        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                            <div className="w-full max-w-md rounded-2xl bg-black border border-red-500/20 p-6">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Delete summary
                                </h3>
                                <p className="text-sm text-muted mb-6">
                                    This action cannot be undone.
                                </p>

                                <div className="flex justify-end gap-2">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setConfirmDelete(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleDelete}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <GenerateSummaryModal
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        onCreated={() => {
                            setOpenModal(false);
                            loadSummaries();
                        }}
                    />
                </>
            )}
        </div>
    );
}

