import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import api from "../../lib/api";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPES,
  KEY_DATE_TYPES,
  PERIOD_TYPES,
  COLOR_SWATCHES,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from "./apiPlanner";

// ─── HELPERS ────────────────────────────────────────────────────────────────
function toISODate(val) {
  if (!val) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
    const [d, m, y] = val.split(".");
    return `${y}-${m}-${d}`;
  }
  // Fallback: let Date parse it
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return null;
}

function getEventColor(event) {
  return event.color ?? EVENT_TYPE_COLORS[event.event_type] ?? "#6B7280";
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days = last.getDate();
  return { startPad, days };
}

function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getEventsForDate(events, dateKey) {
  return (events || []).filter((e) => {
    const d = e.date ?? e.start_date ?? e.start;
    const k = typeof d === "string" ? d.split("T")[0] : formatDateKey(new Date(d));
    return k === dateKey;
  });
}

function getUpcomingEvents(events, days = 14) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return (events || [])
    .filter((e) => {
      const d = e.date ?? e.start_date ?? e.start;
      const t = d ? new Date(d) : null;
      return t && t >= now && t <= end;
    })
    .sort((a, b) => {
      const ta = new Date(a.date ?? a.start_date ?? a.start).getTime();
      const tb = new Date(b.date ?? b.start_date ?? b.start).getTime();
      return ta - tb;
    });
}

function getExamCountdown(examDate) {
  if (!examDate) return null;
  const exam = new Date(examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam - today) / (24 * 60 * 60 * 1000));
  if (diff < 0) return null;
  if (diff > 30) return null;
  return diff;
}

/** Returns all periods where start_date <= date <= end_date */
function getPeriodsForDate(date, periods) {
  if (!date || !periods?.length) return [];
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dTime = d.getTime();
  return periods.filter((p) => {
    const startStr = p.start_date ?? p.startDate;
    const endStr = p.end_date ?? p.endDate;
    if (!startStr) return false;
    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0);
    if (dTime < start.getTime()) return false;
    if (endStr) {
      const end = new Date(endStr);
      end.setHours(0, 0, 0, 0);
      if (dTime > end.getTime()) return false;
    }
    return true;
  });
}

/** Returns true if dateKey matches period's start_date (first day of period) */
function isPeriodStartDate(dateKey, period) {
  const startStr = period.start_date ?? period.startDate;
  if (!startStr) return false;
  const k = typeof startStr === "string" ? startStr.split("T")[0] : formatDateKey(new Date(startStr));
  return k === dateKey;
}

/** Returns true if dateKey matches period's end_date */
function isPeriodEndDate(dateKey, period) {
  const endStr = period.end_date ?? period.endDate;
  if (!endStr) return false;
  const k = typeof endStr === "string" ? endStr.split("T")[0] : formatDateKey(new Date(endStr));
  return k === dateKey;
}

/** Returns true if dateKey matches period's exam_date */
function isPeriodExamDate(dateKey, period) {
  const examStr = period.exam_date ?? period.examDate;
  if (!examStr) return false;
  const k = typeof examStr === "string" ? examStr.split("T")[0] : formatDateKey(new Date(examStr));
  return k === dateKey;
}

/** Returns array of YYYY-MM strings for each month between start and end (inclusive) */
function getMonthsBetween(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) return [];
  const months = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endMonth) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── EVENT DRAWER ──────────────────────────────────────────────────────────
function EventDrawer({ open, onClose, event, date, periods, onSaved, onDeleted }) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("lecture");
  const [dateVal, setDateVal] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [description, setDescription] = useState("");
  const [colorOverride, setColorOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEdit = !!event?.id;

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title ?? "");
      setEventType(event.event_type ?? "lecture");
      const d = event.date ?? event.start_date ?? event.start;
      setDateVal(d ? (typeof d === "string" ? d.split("T")[0] : formatDateKey(new Date(d))) : "");
      setStartTime(event.start_time ?? event.startTime ?? "");
      setEndTime(event.end_time ?? event.endTime ?? "");
      setPeriodId(event.period_id ?? event.periodId ?? "");
      setDescription(event.description ?? "");
      setColorOverride(event.color ?? "");
    } else {
      setTitle("");
      setEventType("lecture");
      setDateVal(date ? formatDateKey(date) : "");
      setStartTime("");
      setEndTime("");
      setPeriodId("");
      setDescription("");
      setColorOverride("");
    }
  }, [open, event, date]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const isoDate = toISODate(dateVal);
      const payload = {
        title,
        event_type: eventType,
        date: isoDate ?? dateVal,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        period_id: periodId || undefined,
        description: description || undefined,
        color: colorOverride || undefined,
      };
      if (isEdit) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Event save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error("Event delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 bg-[#1A1A1F] border-l border-[rgba(255,255,255,0.06)] shadow-2xl overflow-y-auto"
        style={{ background: "#1A1A1F" }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? "Edit Event" : "New Event"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                placeholder="Event title"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Date</label>
              <input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs text-white/50 block mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-white/50 block mb-1.5">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Link to Period</label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
              >
                <option value="">None</option>
                {(periods || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm resize-none"
                placeholder="Optional notes"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Color Override</label>
              <input
                type="text"
                value={colorOverride}
                onChange={(e) => setColorOverride(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                placeholder="#hex (optional)"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs hover:bg-red-500/30 disabled:opacity-50 transition"
              >
                {deleting ? "…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PERIOD DRAWER ─────────────────────────────────────────────────────────
function PeriodDrawer({ open, onClose, period, events = [], onSaved, onDeleted }) {
  const [name, setName] = useState("");
  const [periodType, setPeriodType] = useState("rotation");
  const [specialty, setSpecialty] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [examDate, setExamDate] = useState("");
  const [color, setColor] = useState("#4E9E7A");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showAddKeyDate, setShowAddKeyDate] = useState(false);
  const [keyDateTitle, setKeyDateTitle] = useState("");
  const [keyDateDate, setKeyDateDate] = useState("");
  const [keyDateType, setKeyDateType] = useState("exam");
  const [savingKeyDate, setSavingKeyDate] = useState(false);
  const [periodKeyDates, setPeriodKeyDates] = useState([]);

  const isEdit = !!period?.id;

  const loadKeyDatesForPeriod = useCallback(async () => {
    if (!period?.id) return;
    const startStr = period.start_date ?? period.startDate;
    const endStr = period.end_date ?? period.endDate;
    let months = [];
    if (startStr && endStr) {
      months = getMonthsBetween(startStr, endStr);
    } else {
      const now = new Date();
      months = [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`];
    }
    try {
      const results = await Promise.all(months.map((m) => fetchEvents(m)));
      const merged = results.flat();
      const filtered = merged.filter(
        (e) => (e.academic_period_id ?? e.academicPeriodId ?? e.period_id ?? e.periodId) === period.id
      );
      setPeriodKeyDates(filtered);
    } catch (err) {
      console.error("Failed to load key dates:", err);
      setPeriodKeyDates([]);
    }
  }, [period?.id, period?.start_date, period?.end_date, period?.startDate, period?.endDate]);

  useEffect(() => {
    if (open && period?.id) {
      loadKeyDatesForPeriod();
    } else {
      setPeriodKeyDates([]);
    }
  }, [open, period?.id, loadKeyDatesForPeriod]);

  const keyDates = period?.id ? periodKeyDates : [];

  useEffect(() => {
    if (!open) return;
    if (period) {
      setName(period.name ?? "");
      setPeriodType(period.period_type ?? period.periodType ?? "rotation");
      setSpecialty(period.specialty ?? "");
      setStartDate(period.start_date ? (typeof period.start_date === "string" ? period.start_date.split("T")[0] : formatDateKey(new Date(period.start_date))) : "");
      setEndDate(period.end_date ? (typeof period.end_date === "string" ? period.end_date.split("T")[0] : formatDateKey(new Date(period.end_date))) : "");
      setExamDate(period.exam_date ? (typeof period.exam_date === "string" ? period.exam_date.split("T")[0] : formatDateKey(new Date(period.exam_date))) : "");
      setColor(period.color ?? "#4E9E7A");
      setNotes(period.notes ?? "");
      setIsActive(!!(period.is_active ?? period.isActive));
    } else {
      setName("");
      setPeriodType("rotation");
      setSpecialty("");
      setStartDate("");
      setEndDate("");
      setExamDate("");
      setColor("#4E9E7A");
      setNotes("");
      setIsActive(false);
    }
  }, [open, period]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        period_type: periodType,
        specialty: specialty || undefined,
        start_date: (toISODate(startDate) ?? startDate) || undefined,
        end_date: (toISODate(endDate) ?? endDate) || undefined,
        exam_date: (toISODate(examDate) ?? examDate) || undefined,
        color: color || undefined,
        notes: notes || undefined,
        is_active: isActive,
      };
      if (isEdit) {
        await updatePeriod(period.id, payload);
      } else {
        await createPeriod(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Period save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setDeleting(true);
    try {
      await deletePeriod(period.id);
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error("Period delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddKeyDate = async () => {
    const periodId = period?.id;
    if (!periodId || !keyDateTitle.trim() || !keyDateDate) return;
    setSavingKeyDate(true);
    try {
      const isoDate = toISODate(keyDateDate);
      const payload = {
        title: keyDateTitle.trim(),
        event_date: isoDate ?? keyDateDate,
        event_type: keyDateType,
        academic_period_id: periodId,
        is_all_day: true,
      };
      console.log("[Key Date] academic_period_id before POST:", payload.academic_period_id);
      await createEvent(payload);
      setKeyDateTitle("");
      setKeyDateDate("");
      setKeyDateType("exam");
      setShowAddKeyDate(false);
      onSaved?.();
      await loadKeyDatesForPeriod();
    } catch (err) {
      console.error("Key date add failed:", err);
    } finally {
      setSavingKeyDate(false);
    }
  };

  const handleDeleteKeyDate = async (e, eventId) => {
    e?.stopPropagation?.();
    if (!eventId) return;
    try {
      await deleteEvent(eventId);
      onSaved?.();
      await loadKeyDatesForPeriod();
    } catch (err) {
      console.error("Key date delete failed:", err);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 bg-[#1A1A1F] border-l border-[rgba(255,255,255,0.06)] shadow-2xl overflow-y-auto"
        style={{ background: "#1A1A1F" }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? "Edit Period" : "New Period"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                placeholder="e.g. Cardiology Rotation"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Period Type</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
              >
                {PERIOD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Specialty</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                placeholder="e.g. Cardiology"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg border-2 transition ${
                      color === c ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-white/50 block mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] text-white text-sm resize-none"
                placeholder="Optional notes"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-white/30 bg-[#0C0C0E] text-[#4E9E7A] focus:ring-[#4E9E7A]"
              />
              <label htmlFor="isActive" className="font-mono text-xs text-white/50">
                Set as active period
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <div className="font-mono text-xs text-white/50 tracking-wider mb-3">KEY DATES</div>
            {!period?.id && (
              <p className="text-xs text-white/40 mb-3">Save the period first to add key dates.</p>
            )}
            {period?.id ? (
              <div className="space-y-2 mb-3">
                {keyDates.map((kd) => {
                  const d = kd.date ?? kd.event_date ?? kd.start_date ?? kd.start;
                  const dateStr = d ? (typeof d === "string" ? d.split("T")[0] : formatDateKey(new Date(d))) : "—";
                  const typeVal = kd.event_type ?? kd.eventType ?? "other";
                  return (
                    <div
                      key={kd.id}
                      className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)]"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-white truncate block">{kd.title || "Untitled"}</span>
                        <span className="font-mono text-xs text-white/40">{dateStr}</span>
                      </div>
                      <span
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          background: (EVENT_TYPE_COLORS[typeVal] || "#6B7280") + "30",
                          color: EVENT_TYPE_COLORS[typeVal] || "#6B7280",
                        }}
                      >
                        {typeVal.replace(/-/g, " ")}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteKeyDate(e, kd.id)}
                        className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        aria-label="Delete"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {!showAddKeyDate ? (
              <button
                type="button"
                onClick={() => period?.id && setShowAddKeyDate(true)}
                disabled={!period?.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] text-white/50 hover:text-white/70 hover:bg-white/[0.03] font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-white/50"
              >
                <Plus size={12} />
                Add Key Date
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-[#0C0C0E] border border-[rgba(255,255,255,0.06)] space-y-3">
                <input
                  type="text"
                  value={keyDateTitle}
                  onChange={(e) => setKeyDateTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A1F] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                />
                <input
                  type="date"
                  value={keyDateDate}
                  onChange={(e) => setKeyDateDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A1F] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                />
                <select
                  value={keyDateType}
                  onChange={(e) => setKeyDateType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A1F] border border-[rgba(255,255,255,0.06)] text-white text-sm"
                >
                  {KEY_DATE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddKeyDate}
                    disabled={savingKeyDate || !keyDateTitle.trim() || !keyDateDate}
                    className="px-3 py-1.5 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-mono text-xs font-semibold disabled:opacity-50"
                  >
                    {savingKeyDate ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddKeyDate(false);
                      setKeyDateTitle("");
                      setKeyDateDate("");
                      setKeyDateType("exam");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] text-white/50 font-mono text-xs hover:bg-white/[0.03]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs hover:bg-red-500/30 disabled:opacity-50 transition"
              >
                {deleting ? "…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [events, setEvents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewDate, setViewDate] = useState(() => new Date());
  const [eventDrawer, setEventDrawer] = useState({ open: false, event: null, date: null });
  const [periodDrawer, setPeriodDrawer] = useState({ open: false, period: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const viewedMonth = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const monthsToFetch = viewedMonth === currentMonth ? [viewedMonth] : [viewedMonth, currentMonth];
      const [evResults, perRes] = await Promise.all([
        Promise.all(monthsToFetch.map((m) => fetchEvents(m).catch(() => []))),
        api.get("/api/planner/periods").catch(() => ({ data: { data: [] } })),
      ]);
      const merged = evResults.flat();
      const seen = new Set();
      const deduped = merged.filter((e) => {
        const id = e.id ?? e.event_id;
        if (id && seen.has(id)) return false;
        if (id) seen.add(id);
        return true;
      });
      setEvents(deduped);
      setPeriods(perRes.data?.data ?? perRes.data ?? []);
    } catch (err) {
      setError(err.message || "Failed to load planner data");
      setEvents([]);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [viewDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { startPad, days } = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const totalCells = Math.ceil((startPad + days) / 7) * 7;
  const monthLabel = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  const prevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  };
  const nextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  };

  const openAddEvent = (date) => {
    setEventDrawer({ open: true, event: null, date });
  };
  const openEditEvent = (event, e) => {
    e?.stopPropagation?.();
    setEventDrawer({ open: true, event, date: null });
  };
  const closeEventDrawer = () => {
    setEventDrawer({ open: false, event: null, date: null });
  };

  const openAddPeriod = () => {
    setPeriodDrawer({ open: true, period: null });
  };
  const openEditPeriod = (period) => {
    setPeriodDrawer({ open: true, period });
  };
  const closePeriodDrawer = () => {
    setPeriodDrawer({ open: false, period: null });
  };

  const upcomingEvents = getUpcomingEvents(events, 14);
  const periodMap = Object.fromEntries((periods || []).map((p) => [p.id, p]));

  return (
    <div className="min-h-full" style={{ background: "#0C0C0E" }}>
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Planner</h1>
          <button
            onClick={() => setEventDrawer({ open: true, event: null, date: new Date() })}
            className="btn btn-primary gap-2"
          >
            <Plus size={16} />
            New Event
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-6 mb-6 border-b border-[rgba(255,255,255,0.06)]">
          {["calendar", "periods", "upcoming"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-mono text-xs tracking-wider border-b-2 transition ${
                activeTab === tab
                  ? "text-white border-[#4E9E7A]"
                  : "text-white/50 border-transparent hover:text-white/70"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/10 border-t-[#4E9E7A] rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && (
          <>
            {/* Tab: Calendar */}
            {activeTab === "calendar" && (
              <div
                className="rounded-xl border border-[rgba(255,255,255,0.06)] p-4"
                style={{ background: "#1A1A1F" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-mono text-sm text-white/70">{monthLabel}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-lg border border-[rgba(255,255,255,0.06)] text-white/70 hover:bg-white/5"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-lg border border-[rgba(255,255,255,0.06)] text-white/70 hover:bg-white/5"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-px bg-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div
                      key={d}
                      className="font-mono text-xs text-white/40 py-2 text-center"
                      style={{ background: "#1A1A1F" }}
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: totalCells }).map((_, i) => {
                    const dayNum = i - startPad + 1;
                    const isCurrentMonth = dayNum >= 1 && dayNum <= days;
                    const d = isCurrentMonth
                      ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum)
                      : null;
                    const dateKey = d ? formatDateKey(d) : null;
                    const dayEvents = dateKey ? getEventsForDate(events, dateKey) : [];
                    const matchingPeriods = d ? getPeriodsForDate(d, periods || []) : [];
                    const firstPeriod = matchingPeriods[0];
                    const periodColor = firstPeriod?.color || "#4E9E7A";
                    const showPeriodChip = firstPeriod && dateKey && isPeriodStartDate(dateKey, firstPeriod);

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (isCurrentMonth && dayEvents.length === 0) openAddEvent(d);
                        }}
                        className={`min-h-[100px] p-2 cursor-pointer transition ${
                          isCurrentMonth ? "hover:bg-white/[0.03]" : "opacity-40"
                        }`}
                        style={{
                          background: firstPeriod
                            ? `${periodColor}14`
                            : "#1A1A1F",
                          borderLeft: firstPeriod ? `3px solid ${periodColor}` : undefined,
                        }}
                      >
                        {isCurrentMonth && (
                          <>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <div className="font-mono text-xs text-white/50">{dayNum}</div>
                              {showPeriodChip && (
                                <span
                                  className="font-mono text-[10px] px-1.5 py-0.5 rounded truncate max-w-[4.5rem]"
                                  style={{
                                    backgroundColor: `${periodColor}33`,
                                    color: periodColor,
                                  }}
                                  title={firstPeriod.name}
                                >
                                  {(firstPeriod.name || "").slice(0, 10)}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 3).map((ev) => (
                                <div
                                  key={ev.id ?? ev.title + ev.date}
                                  onClick={(e) => openEditEvent(ev, e)}
                                  className="px-2 py-0.5 rounded text-xs truncate cursor-pointer"
                                  style={{
                                    backgroundColor: getEventColor(ev) + "30",
                                    color: getEventColor(ev),
                                    borderLeft: `3px solid ${getEventColor(ev)}`,
                                  }}
                                >
                                  {ev.title || "Untitled"}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="font-mono text-xs text-white/30">
                                  +{dayEvents.length - 3} more
                                </div>
                              )}
                              {(periods || []).map((p) => {
                                const pColor = p.color || "#4E9E7A";
                                if (dateKey && isPeriodEndDate(dateKey, p)) {
                                  return (
                                    <div
                                      key={`end-${p.id}`}
                                      className="px-2 py-0.5 rounded text-xs truncate"
                                      style={{
                                        backgroundColor: pColor + "30",
                                        color: pColor,
                                        borderLeft: `3px solid ${pColor}`,
                                      }}
                                    >
                                      End
                                    </div>
                                  );
                                }
                                if (dateKey && isPeriodExamDate(dateKey, p)) {
                                  return (
                                    <div
                                      key={`exam-${p.id}`}
                                      className="px-2 py-0.5 rounded text-xs truncate"
                                      style={{
                                        backgroundColor: "#EF444430",
                                        color: "#EF4444",
                                        borderLeft: "3px solid #EF4444",
                                      }}
                                    >
                                      Exam
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Periods */}
            {activeTab === "periods" && (
              <div className="space-y-4">
                <button
                  onClick={openAddPeriod}
                  className="btn btn-primary gap-2"
                >
                  <Plus size={16} />
                  New Period
                </button>
                <div className="space-y-3">
                  {(periods || []).map((p) => {
                    const countdown = getExamCountdown(p.exam_date);
                    const isActive = p.is_active === true || p.isActive === true;
                    return (
                      <div
                        key={p.id}
                        onClick={() => openEditPeriod(p)}
                        className="p-4 rounded-xl border cursor-pointer transition hover:border-white/10"
                        style={{
                          background: isActive ? "#4E9E7A0D" : "#1A1A1F",
                          borderColor: "rgba(255,255,255,0.06)",
                          borderLeft: isActive ? "3px solid #4E9E7A" : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{p.name}</span>
                          <span
                            className="font-mono text-xs px-2 py-0.5 rounded"
                            style={{
                              background: (p.color || "#4E9E7A") + "25",
                              color: p.color || "#4E9E7A",
                              border: `1px solid ${(p.color || "#4E9E7A")}50`,
                            }}
                          >
                            {(p.period_type ?? p.periodType ?? "rotation").replace(/^./, (c) => c.toUpperCase())}
                          </span>
                        </div>
                        {p.specialty && (
                          <div className="text-sm text-white/50 mb-1">{p.specialty}</div>
                        )}
                        <div className="font-mono text-xs text-white/40">
                          {p.start_date
                            ? `${typeof p.start_date === "string" ? p.start_date.split("T")[0] : formatDateKey(new Date(p.start_date))}`
                            : "—"}{" "}
                          →{" "}
                          {p.end_date
                            ? `${typeof p.end_date === "string" ? p.end_date.split("T")[0] : formatDateKey(new Date(p.end_date))}`
                            : "—"}
                        </div>
                        {countdown !== null && (
                          <div className="mt-2 font-mono text-xs text-[#F59E0B]">
                            Exam in {countdown} day{countdown !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!periods || periods.length === 0) && (
                    <div className="py-12 text-center text-white/40 font-mono text-sm">
                      No periods yet. Add one above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Upcoming */}
            {activeTab === "upcoming" && (
              <div
                className="rounded-xl border border-[rgba(255,255,255,0.06)] p-4"
                style={{ background: "#1A1A1F" }}
              >
                {upcomingEvents.length === 0 ? (
                  <div className="py-16 text-center">
                    <Calendar size={40} className="mx-auto mb-4 text-white/20" />
                    <p className="font-mono text-sm text-white/50">
                      No upcoming events — add them in the Calendar tab.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const byDate = {};
                      upcomingEvents.forEach((ev) => {
                        const k = (ev.date ?? ev.start_date ?? ev.start)?.toString().split("T")[0] ?? "";
                        if (!byDate[k]) byDate[k] = [];
                        byDate[k].push(ev);
                      });
                      return Object.entries(byDate)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([dateKey, evs]) => (
                          <div key={dateKey}>
                            <div className="font-mono text-xs text-white/40 mb-2">
                              {dateKey}
                            </div>
                            <div className="space-y-2">
                              {evs.map((ev) => {
                                const period = ev.period_id ? periodMap[ev.period_id] : null;
                                const timeStr =
                                  ev.start_time ?? ev.startTime
                                    ? `${ev.start_time ?? ev.startTime}${ev.end_time ?? ev.endTime ? ` – ${ev.end_time ?? ev.endTime}` : ""}`
                                    : null;
                                return (
                                  <div
                                    key={ev.id ?? ev.title + ev.date}
                                    onClick={() => openEditEvent(ev)}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(255,255,255,0.06)] cursor-pointer hover:bg-white/[0.03]"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: getEventColor(ev) }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-white truncate">
                                        {ev.title || "Untitled"}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {timeStr && (
                                          <span className="font-mono text-xs text-white/40 flex items-center gap-1">
                                            <Clock size={12} />
                                            {timeStr}
                                          </span>
                                        )}
                                        {period && (
                                          <span
                                            className="font-mono text-xs px-1.5 py-0.5 rounded"
                                            style={{
                                              background: (period.color || "#4E9E7A") + "20",
                                              color: period.color || "#4E9E7A",
                                            }}
                                          >
                                            {period.name}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawers */}
      <EventDrawer
        open={eventDrawer.open}
        onClose={closeEventDrawer}
        event={eventDrawer.event}
        date={eventDrawer.date}
        periods={periods}
        onSaved={loadData}
        onDeleted={loadData}
      />
      <PeriodDrawer
        open={periodDrawer.open}
        onClose={closePeriodDrawer}
        period={periodDrawer.period}
        events={events}
        onSaved={loadData}
        onDeleted={loadData}
      />
    </div>
  );
}
