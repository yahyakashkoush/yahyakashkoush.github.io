/**
 * Everything the /start brief offers the visitor, as data.
 *
 * The copy on the letter is driven entirely from here so the bands, the project
 * types and the scheduling window can be changed without touching a component.
 *
 * Nothing in this file states availability, rates or turnaround as fact. The
 * budget bands are the ranges a visitor selects from, not a price list, and the
 * schedule offers *preferred* slots — see `scheduling` below.
 */

export type ProjectTypeId = string;

export const projectTypes: readonly { id: ProjectTypeId; label: string }[] = [
  { id: "web", label: "Web experience" },
  { id: "product", label: "Product / SaaS" },
  { id: "ai", label: "AI system" },
  { id: "automation", label: "Automation" },
  { id: "mobile", label: "Mobile app" },
  { id: "other", label: "Other" },
];

export type BudgetId = string;

/** Edit freely: `label` is what the letter prints, `id` is what gets submitted. */
export const budgetBands: readonly { id: BudgetId; label: string; note?: string }[] = [
  { id: "1-3", label: "$1K — $3K" },
  { id: "3-5", label: "$3K — $5K" },
  { id: "5-10", label: "$5K — $10K" },
  { id: "10-plus", label: "$10K+" },
  { id: "discuss", label: "Let's discuss", note: "Scope first, number second." },
];

/**
 * Shape of the schedule step.
 *
 * These are the slots a visitor may *request*, not slots known to be free: the
 * site has no calendar integration, so publishing anything as "available" would
 * be inventing it. The UI labels every choice as preferred and the confirmation
 * copy says the time is unconfirmed until replied to. Wire a real provider in
 * `src/lib/booking.ts` and `getAvailability` starts filtering this grid.
 */
export const scheduling = {
  /** Earliest requestable day, counted forward from today. */
  leadTimeDays: 2,
  /** How far ahead the calendar lets a visitor look. */
  horizonDays: 42,
  /** 0 = Sunday. Weekends are off the grid by default. */
  weekdays: [1, 2, 3, 4, 5],
  /** 24h, rendered in the visitor's own locale and timezone. */
  slots: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
} as const;

export const startCopy = {
  label: "Project inquiry · Private",
  title: "Start a project",
  lede: "Have something worth building?",
  cta: "Open the brief",
} as const;
