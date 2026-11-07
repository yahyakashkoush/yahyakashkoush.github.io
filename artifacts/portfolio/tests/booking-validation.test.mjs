import assert from "node:assert/strict";
import { test } from "node:test";
import { validateSubmission } from "../supabase/functions/portfolio-submit/validation.ts";

const now = new Date("2026-11-07T12:00:00Z");
const config = {
  projectTypes: [{ id: "automation", label: "Automation" }],
  budgetBands: [{ id: "discuss", label: "Let's discuss" }],
  scheduling: { timeZone: "Africa/Cairo", leadTimeDays: 1, horizonDays: 42, weekdays: [0, 1, 2, 3, 4, 5, 6], slots: ["09:00"] },
};
const input = {
  id: "e4bcccef-593c-4e5b-91b7-bdf360f74b08", kind: "project",
  name: "Booking test", email: "booking-test@example.test",
  message: "Build an automation workflow with reliable scheduling.",
  projectTypes: ["automation"], budget: "__custom__", customBudget: "  EGP 30,000–50,000  ",
  date: "2026-11-10", time: "09:00", company: "", website: "",
};

test("custom budget is trimmed and survives in the private message details", () => {
  const result = validateSubmission(input, config, now);
  assert.equal(result.details.budget, "EGP 30,000–50,000");
  assert.equal(result.details.customBudget, "EGP 30,000–50,000");
  assert.equal(result.details.meetingStatus, "Reserved — awaiting confirmation");
});

test("empty, overlong and non-string custom budgets are rejected on the server", () => {
  for (const customBudget of [" ", "x".repeat(121), 123, null]) {
    assert.throws(() => validateSubmission({ ...input, customBudget }, config, now));
  }
  assert.throws(() => validateSubmission({ ...input, budget: "made-up" }, config, now));
});

test("published budget choices and contact-only messages still work", () => {
  assert.equal(validateSubmission({ ...input, budget: "discuss", customBudget: "" }, config, now).details.budget, "Let's discuss");
  assert.deepEqual(validateSubmission({ ...input, kind: "contact" }, config, now).details, {});
});

test("one business timezone is enforced regardless of the visitor's payload", () => {
  assert.equal(validateSubmission({ ...input, timeZone: "America/New_York" }, config, now).details.timeZone, "Africa/Cairo");
  assert.throws(() => validateSubmission({ ...input, date: "2026-11-07" }, config, now), /no longer requestable/);
  assert.throws(() => validateSubmission({ ...input, time: "09:15" }, config, now), /valid date and time/);
  assert.throws(() => validateSubmission({ ...input, date: "2026-11-31" }, config, now), /valid date/);
});
