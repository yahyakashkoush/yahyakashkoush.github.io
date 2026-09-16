"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Container } from "@/components/primitives";
import { Intro } from "@/components/start/intro";
import { SendSequence } from "@/components/start/send-sequence";
import { SentState } from "@/components/start/sent-state";
import { BriefStep } from "@/components/start/steps/brief-step";
import { BudgetStep } from "@/components/start/steps/budget-step";
import { ContactStep } from "@/components/start/steps/contact-step";
import { ScheduleStep } from "@/components/start/steps/schedule-step";
import { ReviewStep } from "@/components/start/steps/review-step";
import { bookingService, type BookingOutcome } from "@/lib/booking";
import {
  STEPS,
  emptyInquiry,
  stepIndex,
  validateAll,
  validateStep,
  type Errors,
  type Phase,
  type ProjectInquiry,
  type StepId,
} from "@/lib/inquiry";

const EASE = [0.16, 1, 0.3, 1] as const;

/** How long the envelope pre-roll runs before the brief takes the stage. */
const OPENING_MS = 1750;

const STEP_COMPONENTS = {
  brief: BriefStep,
  budget: BudgetStep,
  contact: ContactStep,
  schedule: ScheduleStep,
} as const;

/**
 * Host for the whole /start interaction.
 *
 * One phase value drives everything; the steps are dumb and receive their data,
 * their errors and their two callbacks. Answers live in a single inquiry object
 * that is never cleared between steps, so going back and forward never loses
 * what has been written.
 */
export function StartExperience() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const [value, setValue] = useState<ProjectInquiry>(emptyInquiry);
  const [errors, setErrors] = useState<Errors>({});
  const [outcome, setOutcome] = useState<BookingOutcome | null>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const movedByKeyboard = useRef(false);

  /**
   * Answers are merged, never replaced, so moving between steps keeps
   * everything already written. A field's error is dropped the moment it is
   * corrected rather than making the visitor press Continue to find out.
   */
  const patch = useCallback(
    (next: Partial<ProjectInquiry>) => {
      const merged = { ...value, ...next };
      setValue(merged);
      setErrors((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const step = STEPS.includes(phase as StepId) ? (phase as StepId) : null;
        const fresh = step ? validateStep(step, merged) : validateAll(merged);
        const out: Errors = {};
        for (const k of Object.keys(prev) as (keyof Errors)[]) if (fresh[k]) out[k] = fresh[k];
        return Object.keys(out).length === Object.keys(prev).length ? prev : out;
      });
    },
    [value, phase],
  );

  // Move focus to the new page of the brief so a keyboard or screen reader user
  // is not left at the bottom of the previous one.
  useEffect(() => {
    if (!movedByKeyboard.current) return;
    movedByKeyboard.current = false;
    headingRef.current?.focus();
  }, [phase]);

  const goto = useCallback((next: Phase) => {
    movedByKeyboard.current = true;
    setPhase(next);
  }, []);

  const open = useCallback(() => {
    setPhase("opening");
    window.setTimeout(() => goto("brief"), reduce ? 120 : OPENING_MS);
  }, [goto, reduce]);

  const advance = useCallback(
    (from: StepId) => {
      const found = validateStep(from, value);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        return;
      }
      setErrors({});
      const i = STEPS.indexOf(from);
      goto(i === STEPS.length - 1 ? "review" : STEPS[i + 1]);
    },
    [value, goto],
  );

  const back = useCallback(
    (from: StepId) => {
      const i = STEPS.indexOf(from);
      goto(i === 0 ? "intro" : STEPS[i - 1]);
    },
    [goto],
  );

  const seal = useCallback(() => {
    const found = validateAll(value);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setPhase("sending");
  }, [value]);

  // Fired when the fold/post/seal choreography lands.
  const finishSending = useCallback(() => {
    bookingService
      .submit(value)
      .then((res) => setOutcome(res))
      .catch((e: unknown) =>
        setOutcome({ status: "failed", reason: e instanceof Error ? e.message : "The brief could not be sent." }),
      )
      .finally(() => setPhase("sent"));
  }, [value]);

  const restart = useCallback(() => {
    setOutcome(null);
    setErrors({});
    setPhase("intro");
  }, []);

  const step = stepIndex(phase);
  const isStep = STEPS.includes(phase as StepId);

  const transition = reduce ? { duration: 0 } : { duration: 0.62, ease: EASE };

  return (
    <div className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden pt-28 pb-20 md:pt-32">
      {/* Pool of light behind the object. The only non-flat thing on the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_44%_at_50%_38%,rgb(217_31_38_/_0.07),transparent_72%)]"
      />

      <Container className="relative">
        {/* Focus target for step changes. */}
        <div ref={headingRef} tabIndex={-1} className="outline-none" aria-live="polite">
          <span className="sr-only">
            {isStep && step
              ? `Step ${step.n} of ${step.of}`
              : phase === "review"
                ? "Review your brief"
                : phase === "sent"
                  ? "Brief sent"
                  : ""}
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={phase === "opening" ? "intro" : phase}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -14 }}
            transition={transition}
          >
            {(phase === "intro" || phase === "opening") && (
              <Intro opening={phase === "opening"} onOpen={open} />
            )}

            {isStep && step && <StepPage phase={phase as StepId} value={value} patch={patch} errors={errors} advance={advance} back={back} step={step} />}

            {phase === "review" && (
              <div className="mx-auto w-full max-w-[52rem]">
                <ReviewStep
                  value={value}
                  errors={errors}
                  onEdit={(s) => goto(s)}
                  onSeal={seal}
                  onBack={() => goto("schedule")}
                />
              </div>
            )}

            {phase === "sending" && <SendSequence value={value} onComplete={finishSending} />}

            {phase === "sent" && outcome && (
              <SentState value={value} outcome={outcome} onRestart={restart} />
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
}

function StepPage({
  phase,
  value,
  patch,
  errors,
  advance,
  back,
  step,
}: {
  phase: StepId;
  value: ProjectInquiry;
  patch: (next: Partial<ProjectInquiry>) => void;
  errors: Errors;
  advance: (from: StepId) => void;
  back: (from: StepId) => void;
  step: { n: number; of: number };
}) {
  const Step = STEP_COMPONENTS[phase];
  return (
    <div className="mx-auto w-full max-w-[52rem]">
      <Step
        value={value}
        patch={patch}
        errors={errors}
        onNext={() => advance(phase)}
        onBack={() => back(phase)}
        step={step}
      />
    </div>
  );
}
