import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parseContent, safeUrl } from "../src/lib/content-schema.ts";
import { validateSubmission } from "../supabase/functions/portfolio-submit/validation.ts";

const content = JSON.parse(readFileSync(new URL("../src/content/portfolio.json", import.meta.url), "utf8"));
const now = new Date("2026-09-20T12:00:00Z");
const contact = { id: "f35aa3fb-a11c-4b61-8040-dc6f0f1c1733", kind: "contact", name: "Test Visitor", email: "visitor@example.com", message: "Please tell me more about your services.", website: "" };
const project = { ...contact, kind: "project", projectTypes: ["ai"], budget: "discuss", date: "2026-09-22", time: "10:00", timeZone: "Africa/Cairo", company: "Test company" };

test("the complete content snapshot validates without dropping meaningful fields", () => { assert.deepEqual(parseContent(content), content); });
test("unsafe URLs, duplicate slugs and impossible schedules cannot publish", () => {
  for (const url of ["javascript:alert(1)", "//evil.test", "/\\evil.test", "data:text/html,test"]) assert.equal(safeUrl.safeParse(url).success, false);
  const duplicate = structuredClone(content); duplicate.projects.push(duplicate.projects[0]);
  assert.throws(() => parseContent(duplicate), /Duplicate/);
  const badSchedule = structuredClone(content); badSchedule.start.scheduling.leadTimeDays = 100;
  assert.throws(() => parseContent(badSchedule), /horizon/);
  const invalidImage = structuredClone(content); invalidImage.projects[0].media.gallery[0].width = 0;
  assert.throws(() => parseContent(invalidImage), /width/);
});
test("contact requests are trimmed and cannot supply admin-only status or notes", () => {
  const result = validateSubmission({ ...contact, name: "  Visitor  ", status: "replied", note: "injected" }, content.start, now);
  assert.equal(result.name, "Visitor"); assert.equal(result.status, undefined); assert.equal(result.note, undefined); assert.deepEqual(result.details, {});
});
test("project requests keep the selected labels, date, time and timezone", () => {
  const result = validateSubmission(project, content.start, now);
  assert.deepEqual(result.details.projectTypes, ["AI system"]);
  assert.equal(result.details.budget, "Let's discuss");
  assert.equal(result.details.preferredDate, "2026-09-22"); assert.equal(result.details.timeZone, "Africa/Cairo");
  assert.match(result.details.meetingStatus, /awaiting confirmation/);
});
test("submission validation rejects bots, invalid identities, dates and stale choices", () => {
  for (const invalid of [{ ...contact, website: "bot" }, { ...contact, email: "no-at-sign" }, { ...contact, message: "x".repeat(12001) }, { ...project, date: "2026-02-31" }, { ...project, date: "2026-09-19" }, { ...project, time: "25:00" }, { ...project, timeZone: "unknown" }, { ...project, budget: "deleted" }, { ...project, projectTypes: ["deleted"] }]) assert.throws(() => validateSubmission(invalid, content.start, now));
});
