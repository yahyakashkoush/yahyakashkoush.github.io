type Choice = { id: string; label: string };
export type RequestConfig = { projectTypes: Choice[]; budgetBands: Choice[]; scheduling: { leadTimeDays: number; horizonDays: number; weekdays: number[]; slots: string[] } };
export function validateSubmission(input: unknown, config: RequestConfig, now = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid request.");
  const value = input as Record<string, unknown>;
  const field = (key: string, max: number, required = true) => {
    if (typeof value[key] !== "string") { if (!required && value[key] == null) return ""; throw new Error(`Invalid ${key}.`); }
    const result = (value[key] as string).trim();
    if ((required && !result) || result.length > max) throw new Error(`Check ${key} and its length.`);
    return result;
  };
  if (value.website) throw new Error("Your message could not be accepted.");
  const id = field("id", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid request reference.");
  const name = field("name", 120), email = field("email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const message = field("message", 12000);
  if (value.kind !== "contact" && value.kind !== "project") throw new Error("Invalid message type.");
  const details: Record<string, string | string[]> = {};
  if (value.kind === "project") {
    if (message.length < 20) throw new Error("Please add a little more detail to your project brief.");
    if (!Array.isArray(value.projectTypes) || !value.projectTypes.length || value.projectTypes.length > 30 || !value.projectTypes.every((id) => typeof id === "string" && config.projectTypes.some((choice) => choice.id === id))) throw new Error("Choose a valid project type.");
    const budget = config.budgetBands.find((choice) => choice.id === value.budget);
    if (!budget) throw new Error("Choose a valid budget range.");
    const date = field("date", 10), time = field("time", 5), timeZone = field("timeZone", 100);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !config.scheduling.slots.includes(time)) throw new Error("Choose a valid preferred date and time.");
    const day = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date) throw new Error("Choose a valid date.");
    let parts: Intl.DateTimeFormatPart[];
    try { parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now); } catch { throw new Error("Your timezone could not be verified."); }
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    const today = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`);
    const daysAhead = (day.getTime() - today.getTime()) / 86400000;
    if (daysAhead < config.scheduling.leadTimeDays || daysAhead > config.scheduling.horizonDays || !config.scheduling.weekdays.includes(day.getUTCDay())) throw new Error("This preferred date is no longer requestable. Choose another day.");
    details.company = field("company", 200, false);
    details.projectTypes = config.projectTypes.filter((choice) => (value.projectTypes as string[]).includes(choice.id)).map((choice) => choice.label);
    details.budget = budget.label; details.preferredDate = date; details.preferredTime = time; details.timeZone = timeZone;
    details.meetingStatus = "Requested — awaiting confirmation";
  }
  return { id, kind: value.kind, name, email, message, details };
}
