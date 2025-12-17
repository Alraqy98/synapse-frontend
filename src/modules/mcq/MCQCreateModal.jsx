// src/modules/mcq/MCQCreateModal.jsx
import { useState } from "react";
import { api } from "../../lib/api.js";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export default function MCQCreateModal({
    open,
    onOpenChange,
    files,
    onCreated,
}) {
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("standard");
    const [questionCount, setQuestionCount] = useState(15);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const toggleFile = (id) => {
        setSelectedFiles((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
        );
    };

    const handleCreate = async () => {
        if (!title || selectedFiles.length === 0) return;
        setSubmitting(true);
        try {
            const payload = {
                title,
                difficulty,
                question_count_target: questionCount,
                file_ids: selectedFiles,
            };
            const res = await api.post("/mcq/decks", payload);
            onCreated?.(res.data.deck);
            // reset
            setTitle("");
            setDifficulty("standard");
            setQuestionCount(15);
            setSelectedFiles([]);
            onOpenChange(false);
        } catch (err) {
            console.error("Failed to create MCQ deck", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create MCQ Deck</DialogTitle>
                    <DialogDescription>
                        Choose difficulty, number of questions, and source files.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Deck title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. GI Bleeding — MCQs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">
                                Difficulty
                            </label>
                            <Select
                                value={difficulty}
                                onValueChange={(v) => setDifficulty(v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">
                                Question count
                            </label>
                            <Select
                                value={String(questionCount)}
                                onValueChange={(v) => setQuestionCount(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="45">45</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">
                            Source files
                        </label>
                        <ScrollArea className="h-48 border rounded-md p-2">
                            {files.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No files found. Upload lectures to the Library first.
                                </p>
                            )}

                            <div className="space-y-2">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent cursor-pointer"
                                        onClick={() => toggleFile(file.id)}
                                    >
                                        <Checkbox
                                            checked={selectedFiles.includes(file.id)}
                                            onCheckedChange={() => toggleFile(file.id)}
                                        />
                                        <span className="text-sm">{file.title}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={
                                submitting || !title || selectedFiles.length === 0
                            }
                        >
                            {submitting ? "Creating…" : "Create deck"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
