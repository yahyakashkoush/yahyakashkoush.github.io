"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { budgetLabel, typeLabels, type ProjectInquiry } from "@/lib/inquiry";
import { Envelope, LetterSheet } from "@/components/start/envelope";
import { cn } from "cn";

/**
 * The closing half of the sequence, in physical order:
 *
 *   folding  — the sheet, still out of the mouth, folds down
 *   letterIn — it slides back down inside, behind the front panel
 *   closing  — only then does the flap rotate down over the mouth
 *   sealed   — and only once it is shut does the wax press on
 *
 * One timeline drives the beats so the order can't invert, and every stage is
 * a transform on the same mounted envelope — nothing is swapped or hidden.
 */

type Beat = "settle" | "folding" | "letterIn" | "closing" | "sealed" | "done";

/** Cumulative milliseconds at which each beat begins. */
const TIMELINE: { beat: Beat; at: number }[] = [
  { beat: "settle", at: 0 },
  { beat: "folding", at: 450 },
  { beat: "letterIn", at: 1600 },
  { beat: "closing", at: 2600 },
  { beat: "sealed", at: 3600 },
  { beat: "done", at: 4300 },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const LABELS: Record<Beat, string> = {
  settle: "Folding",
  folding: "Folding",
  letterIn: "Posting",
  closing: "Closing",
  sealed: "Sealing",
  done: "Sealing",
};

export function SendSequence({ value, onComplete }: { value: ProjectInquiry; onComplete: () => void }) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState<Beat>("settle");
  const done = useRef(false);

  useEffect(() => {
    const scale = reduce ? 0.08 : 1;
    const timers = TIMELINE.map(({ beat: b, at }) =>
      window.setTimeout(() => {
        if (b === "done") {
          if (done.current) return;
          done.current = true;
          onComplete();
        } else {
          setBeat(b);
        }
      }, at * scale),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [reduce, onComplete]);

  const folded = beat !== "settle";
  // The sheet is only out of the mouth for the first two beats.
  const letterOut = beat === "settle" || beat === "folding";
  const closed = beat === "closing" || beat === "sealed" || beat === "done";

  return (
    <div className="relative mx-auto flex w-full max-w-[42rem] flex-col items-center">
      <p className="sr-only" role="status">
        Sealing your brief.
      </p>

      <div className="relative w-full">
        <Envelope
          state={closed ? "closed" : "open"}
          sealed={beat === "sealed" || beat === "done"}
          letterOut={letterOut}
          letter={<FoldedLetter value={value} folded={folded} reduce={!!reduce} />}
        />
      </div>

      <motion.p
        className="t-label mt-10 text-fg-3"
        initial={false}
        animate={{ opacity: beat === "sealed" || beat === "done" ? 1 : 0.55 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE }}
      >
        {LABELS[beat]}
      </motion.p>
    </div>
  );
}

/* Letter ------------------------------------------------------------------ */

/**
 * A still of the brief that folds in half before it goes back in.
 *
 * The live form is not folded — its inputs would distort and its focus would
 * be lost mid-animation — so the sequence hands over to this frozen sheet
 * carrying the same content.
 */
function FoldedLetter({
  value,
  folded,
  reduce,
}: {
  value: ProjectInquiry;
  folded: boolean;
  reduce: boolean;
}) {
  const t = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, delay, ease: EASE });

  return (
    <motion.div
      className="relative w-full origin-bottom"
      initial={false}
      animate={{ scaleY: folded ? 0.52 : 1 }}
      transition={t(0.7)}
    >
      <LetterSheet className="relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{ opacity: folded ? 0.25 : 1, scaleY: folded ? 1.9 : 1 }}
          transition={t(0.5)}
          className="origin-top"
        >
          <p className="t-label mb-[3%] text-[0.5rem] text-[var(--ink-3)]">Project brief</p>
          <p className="mb-[3%] line-clamp-2 text-[0.6rem] leading-snug text-[var(--ink)]">
            {value.projectBrief.trim()}
          </p>
          <p className="t-meta text-[0.45rem] text-[var(--ink-2)]">{typeLabels(value.projectTypes)}</p>
          <p className="t-meta mt-[1%] text-[0.45rem] text-[var(--ink-2)]">{budgetLabel(value.budget)}</p>
          <p className="t-meta mt-[3%] text-[0.45rem] text-[var(--ink-3)]">{value.name.trim()}</p>
        </motion.div>

        {/* The crease, printed across the middle as the sheet doubles over. */}
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-1/2 h-px",
            "bg-[linear-gradient(90deg,transparent,rgb(23_22_20_/_0.4)_12%,rgb(23_22_20_/_0.4)_88%,transparent)]",
          )}
          initial={false}
          animate={{ opacity: folded ? 1 : 0, scaleX: folded ? 1 : 0.4 }}
          transition={t(0.4)}
        />

        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgb(0_0_0_/_0.24)_50%,transparent_70%)]"
          initial={false}
          animate={{ opacity: folded ? 1 : 0 }}
          transition={t(0.5)}
        />
      </LetterSheet>
    </motion.div>
  );
}
