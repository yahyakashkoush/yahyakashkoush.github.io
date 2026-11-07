import { emptyInquiry, STEPS, type Phase, type ProjectInquiry } from "./inquiry";

const KEY = "portfolio-inquiry-draft";
const MAX_AGE = 24 * 60 * 60 * 1000;
export type InquiryDraft = { value: ProjectInquiry; phase: Phase; requestId: string | null };

/** Tab-scoped only. Never automatically resubmits an interrupted request. */
export function readInquiryDraft(): InquiryDraft | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (!draft || !Number.isFinite(draft.savedAt) || Date.now() - draft.savedAt > MAX_AGE) return null;
    const value = draft.value;
    if (!value || !["projectBrief", "name", "email", "company", "customBudget"].every((key) => typeof value[key] === "string")) return null;
    if (!Array.isArray(value.projectTypes) || !value.projectTypes.every((type: unknown) => typeof type === "string")) return null;
    if (![value.budget, value.date, value.time].every((item) => item === null || typeof item === "string")) return null;
    if (JSON.stringify(value).length > 30000) return null;
    const phase = [...STEPS, "review"].includes(draft.phase) ? draft.phase as Phase : "brief";
    const requestId = typeof draft.requestId === "string" && /^[a-f0-9-]{36}$/i.test(draft.requestId) ? draft.requestId : null;
    return { value: { ...emptyInquiry, ...value }, phase, requestId };
  } catch { return null; }
}

export function saveInquiryDraft(value: ProjectInquiry, phase: Phase, requestId: string | null) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ value, phase: phase === "sending" ? "review" : phase, requestId, savedAt: Date.now() }));
  } catch { /* Disabled/full browser storage must not block sending the brief. */ }
}

export function clearInquiryDraft() {
  try { sessionStorage.removeItem(KEY); } catch { /* Storage can be disabled by the visitor. */ }
}
