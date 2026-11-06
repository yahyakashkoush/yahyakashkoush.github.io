import { z } from "zod";

const text = z.string().max(20000);
const required = text.trim().min(1, "This field is required");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens").max(100);
export const safeUrl = z.string().max(2048).refine((value) => {
  if (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use a /local-path or a complete https:// URL");
export const imageSchema = z.object({ src: safeUrl, alt: required });
export const shotSchema = imageSchema.extend({ width: z.number().int().min(1).max(16000), height: z.number().int().min(1).max(16000), caption: text, kind: z.enum(["desktop", "mobile"]), needsCleanExport: z.boolean().optional() });
const paragraphs = z.array(text).max(100);
const section = z.object({ label: required, title: required });
const choice = z.object({ id: slug, label: required });
export const scheduleSchema = z.object({ leadTimeDays: z.number().int().min(0).max(365), horizonDays: z.number().int().min(1).max(365), weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7), slots: z.array(z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)).min(1).max(48) }).refine((v) => v.horizonDays > v.leadTimeDays, "The booking horizon must exceed the lead time");
export const projectSchema = z.object({
  slug, index: required, title: required, subtitle: required, year: text.nullable(), date: text.nullable(), role: required, summary: required,
  overview: paragraphs.min(1).refine((v) => v.some((p) => p.trim()), "Add an overview"), challenge: paragraphs, approach: paragraphs,
  capabilities: z.array(z.object({ label: required, body: required })).max(100), architecture: text, outcome: paragraphs, credits: paragraphs,
  stack: paragraphs, links: z.array(z.object({ label: required, href: safeUrl })).max(30),
  media: z.object({ preview: shotSchema.nullable(), gallery: z.array(shotSchema).max(30) }),
});
const clip = z.object({ src: safeUrl, poster: safeUrl, posterAlt: required, width: z.number().positive(), height: z.number().positive(), duration: z.number().positive(), content: text, caption: text });
export const contentSchema = z.object({
  site: z.object({ name: required, role: required, statement: paragraphs, intro: required, email: z.email(), linkedin: safeUrl, url: z.url() }),
  navigation: z.array(z.object({ label: required, href: safeUrl })).min(1).max(20),
  hero: z.object({ heading: required, role: required, description: required, image: imageSchema, primaryLabel: required, primaryHref: safeUrl, secondaryLabel: required, secondaryHref: safeUrl }),
  work: section,
  about: section.extend({ paragraphs: paragraphs.min(1), image: imageSchema, linkLabel: required }),
  experience: section.extend({ entries: z.array(z.object({ period: required, title: required, org: text, body: paragraphs })).max(50) }),
  capabilities: section.extend({ groups: z.array(z.object({ title: required, items: paragraphs })).max(50) }),
  contact: section.extend({ image: imageSchema, description: text, buttonLabel: required, successMessage: required }),
  start: section.extend({ lede: text, cta: required, briefTitle: required, briefQuestion: required, briefPlaceholder: text, typeQuestion: required, budgetTitle: required, budgetQuestion: required, budgetHelp: text, contactTitle: required, contactQuestion: required, scheduleTitle: required, scheduleQuestion: required, scheduleHelp: text, reviewTitle: required, reviewHelp: text, submitLabel: required, successTitle: required, successMessage: required, projectTypes: z.array(choice).min(1).max(30), budgetBands: z.array(choice.extend({ note: text })).min(1).max(30), scheduling: scheduleSchema }),
  cinematic: z.object({ chapterWork: clip, crtReel: clip }),
  projects: z.array(projectSchema).min(1).max(100),
}).superRefine((value, context) => {
  for (const [path, ids] of [["projects", value.projects.map((p) => p.slug)], ["start.projectTypes", value.start.projectTypes.map((p) => p.id)], ["start.budgetBands", value.start.budgetBands.map((p) => p.id)]] as const) {
    if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: `Duplicate identifiers in ${path}`, path: path.split(".") });
  }
});
export type PortfolioContent = z.infer<typeof contentSchema>;
export type CmsProject = PortfolioContent["projects"][number];
export type ScheduleConfig = PortfolioContent["start"]["scheduling"];
export function parseContent(value: unknown): PortfolioContent {
  const result = contentSchema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues.slice(0, 5).map((issue) => `${issue.path.join(" → ")}: ${issue.message}`).join("\n"));
  return result.data;
}
