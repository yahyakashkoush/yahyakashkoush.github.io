"use client";

import { usePortfolio } from "@/components/content-provider";
import { motion, useReducedMotion } from "motion/react";
import { Action } from "@/components/primitives";
import { Envelope } from "@/components/start/envelope";
import { type BookingOutcome } from "@/lib/booking";
import { formatLongDate, formatTime, resolvedTimeZone, type ProjectInquiry } from "@/lib/inquiry";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Closing frame.
 *
 * The copy is keyed off what the provider actually reported. Under the shipped
 * mail handoff that is `requested`, so the meeting is described as a request:
 * nothing here claims a booking unless a provider confirmed one.
 */
export function SentState({
  value,
  outcome,
  onRestart,
}: {
  value: ProjectInquiry;
  outcome: BookingOutcome;
  onRestart: () => void;
}) {
  const { content: { start } } = usePortfolio();
  const reduce = useReducedMotion();
  const t = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, delay, ease: EASE });

  if (outcome.status === "failed") {
    return (
      <div className="mx-auto w-full max-w-[42rem]">
        <p className="t-label mb-5 text-red">Not sent</p>
        <h1 className="t-hero mb-6 max-w-[16ch] text-foreground">That didn&rsquo;t go through.</h1>
        <p className="t-body mb-10 max-w-[44ch]">{outcome.reason}</p>
        <button
          type="button"
          onClick={onRestart}
          className="t-nav inline-flex min-h-12 items-center border border-foreground px-7 text-foreground transition-colors duration-300 hover:border-red hover:bg-red hover:text-white"
        >
          Back to the brief
        </button>
      </div>
    );
  }

  const confirmed = outcome.status === "confirmed";

  return (
    <div className="mx-auto flex w-full max-w-[42rem] flex-col items-center">
      <motion.div
        className="w-full"
        initial={reduce ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={t(0.9)}
      >
        <Envelope state="closed" sealed />
      </motion.div>

      <motion.div
        className="mt-12 w-full border-t border-line pt-8"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t(0.8, 0.25)}
      >
        <p className="t-label mb-5 text-red">Sent</p>
        <h1 className="t-hero mb-6 max-w-[14ch] text-foreground">
          {start.successTitle}
        </h1>

        <div role="status" className="t-body mb-9 max-w-[46ch]">
          <p>{start.successMessage}</p>
          {value.date && value.time && (
            <p className="mt-4">
              {confirmed ? "Confirmed for " : "You asked for "}
              <span className="text-foreground">
                {formatLongDate(value.date)} at {formatTime(value.time)}
              </span>
              <span className="text-fg-3"> · {resolvedTimeZone()}</span>
              {!confirmed && ". I'll confirm that time by reply."}
            </p>
          )}
          {outcome.status === "requested" && outcome.via === "mail" && (
            <p className="t-caption mt-5">
              The brief was handed to your mail client. If nothing opened, the draft didn&rsquo;t send — you can go
              back and copy it out.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Action href="/" variant="solid" direction="right">
            Back to portfolio
          </Action>
          <button
            type="button"
            onClick={onRestart}
            className="t-nav link-wipe inline-flex min-h-11 items-center self-start text-fg-3 transition-colors duration-300 hover:text-foreground"
          >
            Start another brief
          </button>
        </div>
      </motion.div>
    </div>
  );
}
