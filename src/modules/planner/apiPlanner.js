// src/modules/planner/apiPlanner.js
import api from "../../lib/api";

const EVENTS_BASE = "/api/planner/events";
const PERIODS_BASE = "/api/planner/periods";

export const EVENT_TYPE_COLORS = {
  lecture: "#3B82F6",
  exam: "#EF4444",
  period_start: "#4E9E7A",
  period_end: "#4E9E7A",
  study_session: "#8B5CF6",
  note: "#F59E0B",
  deadline: "#F59E0B",
};

export const EVENT_TYPES = [
  { value: "lecture", label: "Lecture" },
  { value: "exam", label: "Exam" },
  { value: "period_start", label: "Period Start" },
  { value: "period_end", label: "Period End" },
  { value: "study_session", label: "Study Session" },
  { value: "note", label: "Note" },
  { value: "deadline", label: "Deadline" },
];

export const KEY_DATE_TYPES = [
  { value: "exam", label: "Exam" },
  { value: "deadline", label: "Deadline" },
  { value: "clinical-skills", label: "Clinical Skills" },
  { value: "oral-exam", label: "Oral Exam" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
];

export const PERIOD_TYPES = [
  { value: "rotation", label: "Rotation" },
  { value: "block", label: "Block" },
  { value: "semester", label: "Semester" },
  { value: "subject", label: "Subject" },
];

export const COLOR_SWATCHES = [
  "#4E9E7A",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#F59E0B",
  "#EC4899",
];

export async function fetchEvents(params = {}) {
  const { data } = await api.get(EVENTS_BASE, { params });
  return data?.data ?? data ?? [];
}

export async function createEvent(payload) {
  const { data } = await api.post(EVENTS_BASE, payload);
  return data?.data ?? data;
}

export async function updateEvent(id, payload) {
  const { data } = await api.patch(`${EVENTS_BASE}/${id}`, payload);
  return data?.data ?? data;
}

export async function deleteEvent(id) {
  await api.delete(`${EVENTS_BASE}/${id}`);
}

export async function fetchPeriods() {
  const { data } = await api.get(PERIODS_BASE);
  return data?.data ?? data ?? [];
}

export async function createPeriod(payload) {
  const { data } = await api.post(PERIODS_BASE, payload);
  return data?.data ?? data;
}

export async function updatePeriod(id, payload) {
  const { data } = await api.patch(`${PERIODS_BASE}/${id}`, payload);
  return data?.data ?? data;
}

export async function deletePeriod(id) {
  await api.delete(`${PERIODS_BASE}/${id}`);
}
