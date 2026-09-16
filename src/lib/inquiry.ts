import { projectTypes, budgetBands, scheduling, type BudgetId, type ProjectTypeId } from "@/content/inquiry";

/* Model ------------------------------------------------------------------- */

export type ProjectInquiry = {
  projectBrief: string;
  projectTypes: ProjectTypeId[];
  budget: BudgetId | null;
  name: string;
  email: string;
  company: string;
  /** Date the visitor would prefer to meet, as YYYY-MM-DD. */
  date: string | null;
  /** Preferred start time, 24h HH:mm, in the visitor's own timezone. */
  time: string | null;
};

export const emptyInquiry: ProjectInquiry = {
  projectBrief: "",
  projectTypes: [],
  budget: null,
  name: "",
  email: "",
  company: "",
  date: null,
  time: null,
};

/* Steps ------------------------------------------------------------------- */

export const STEPS = ["brief", "budget", "contact", "schedule"] as const;
export type StepId = (typeof STEPS)[number];

export type Phase = "intro" | "opening" | StepId | "review" | "sending" | "sent";

/** Steps are numbered on the letter as 01 / 04. Non-step phases return null. */
export const stepIndex = (phase: Phase): { n: number; of: number } | null => {
  const i = STEPS.indexOf(phase as StepId);
  return i === -1 ? null : { n: i + 1, of: STEPS.length };
};

/* Validation -------------------------------------------------------------- */

export type FieldKey = "projectBrief" | "projectTypes" | "budget" | "name" | "email" | "date" | "time";
export type Errors = Partial<Record<FieldKey, string>>;

// Deliberately the same shape the existing contact form uses, so the two
// validate an address identically.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_BRIEF = 20;

export function validateStep(step: StepId, v: ProjectInquiry): Errors {
  const e: Errors = {};
  if (step === "brief") {
    const brief = v.projectBrief.trim();
    if (!brief) e.projectBrief = "Tell me what you're building before we go on.";
    else if (brief.length < MIN_BRIEF) e.projectBrief = `A little more to go on — ${MIN_BRIEF - brief.length} characters short.`;
    if (v.projectTypes.length === 0) e.projectTypes = "Pick at least one.";
  }
  if (step === "budget" && !v.budget) e.budget = "Pick a range, or choose Let's discuss.";
  if (step === "contact") {
    if (!v.name.trim()) e.name = "Required.";
    const email = v.email.trim();
    if (!email) e.email = "Required.";
    else if (!EMAIL.test(email)) e.email = "That address doesn't look right.";
  }
  if (step === "schedule") {
    if (!v.date) e.date = "Choose a preferred day.";
    if (!v.time) e.time = "Choose a preferred time.";
  }
  return e;
}

/** Every step re-checked. Guards the seal action against a skipped field. */
export function validateAll(v: ProjectInquiry): Errors {
  return STEPS.reduce<Errors>((acc, s) => ({ ...acc, ...validateStep(s, v) }), {});
}

export const isComplete = (v: ProjectInquiry): boolean => Object.keys(validateAll(v)).length === 0;

/* Labels ------------------------------------------------------------------ */

export const typeLabels = (ids: ProjectTypeId[]): string =>
  ids.map((id) => projectTypes.find((t) => t.id === id)?.label ?? id).join(", ");

export const budgetLabel = (id: BudgetId | null): string =>
  budgetBands.find((b) => b.id === id)?.label ?? "";

/* Dates ------------------------------------------------------------------- */

const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const toISODate = iso;

/** Parsed back as local midnight, so a date never shifts across a timezone. */
export const fromISODate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function isRequestable(d: Date, today = new Date()): boolean {
  const floor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  floor.setDate(floor.getDate() + scheduling.leadTimeDays);
  const ceiling = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  ceiling.setDate(ceiling.getDate() + scheduling.horizonDays);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day < floor || day > ceiling) return false;
  return (scheduling.weekdays as readonly number[]).includes(day.getDay());
}

export const formatLongDate = (s: string, locale?: string): string =>
  fromISODate(s).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** 24h "14:00" rendered in the visitor's locale, e.g. "2:00 PM" or "14:00". */
export const formatTime = (hhmm: string, locale?: string): string => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
};

export const resolvedTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "your local time";
  } catch {
    return "your local time";
  }
};
