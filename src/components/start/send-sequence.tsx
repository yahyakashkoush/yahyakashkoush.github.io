"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { budgetLabel, typeLabels, type ProjectInquiry } from "@/lib/inquiry";
import { Envelope } from "@/components/start/envelope";
import { cn } from "cn";

/**
 * The letter being folded, posted and sealed.
 *
 * Ten beats, driven by one timeline rather than chained transition callbacks so
 * the whole sequence has a single source of truth and cannot strand itself
 * half-finished if a transition event is dropped. Under reduced motion the same
 * beats run at ~8% duration: the sequence still completes and still reports
 * back, it simply does not perform.
 */

type Beat = "settle" | "fold" | "insert" | "close" | "seal" | "done";

/** Cumulative milliseconds at which each beat begins. */
const TIMELINE: { beat: Beat; at: number }[] = [
  { beat: "settle", at: 0 },
  { beat: "fold", at: 620 },
  { beat: "insert", at: 2000 },
  { beat: "close", at: 3040 },
  { beat: "seal", at: 4080 },
  { beat: "done", at: 4760 },
];

const EASE = [0.16, 1, 0.3, 1] as const;

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

  const folding = beat === "fold" || beat === "insert" || beat === "close" || beat === "seal";
  const inserted = beat === "insert" || beat === "close" || beat === "seal";
  const closed = beat === "close" || beat === "seal";

  const t = (duration: number) => (reduce ? { duration: 0 } : { duration, ease: EASE });

  return (
    <div className="relative mx-auto flex w-full max-w-[42rem] flex-col items-center">
      <p className="sr-only" role="status">
        Sealing your brief.
      </p>

      <div className="relative w-full">
        <Envelope state={closed ? "closed" : "open"} sealed={beat === "seal"}>
          {/* Positioned by the envelope's own children slot, which sits behind
              the front panel — so once `top` crosses below the panel's edge
              the letter is genuinely occluded, not just faded. */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 w-[86%] origin-center"
            initial={false}
            animate={{
              // Sits above the mouth, then drops in and disappears behind the panel.
              top: inserted ? "34%" : "-58%",
              x: "-50%",
              scale: inserted ? 0.82 : 1,
              rotateX: inserted ? 18 : 0,
            }}
            transition={t(inserted ? 0.95 : 0.6)}
          >
            <FoldedLetter value={value} folded={folding} reduce={!!reduce} />
          </motion.div>
        </Envelope>
      </div>

      <motion.p
        className="t-label mt-10 text-fg-3"
        initial={false}
        animate={{ opacity: beat === "seal" ? 1 : 0.55 }}
        transition={t(0.4)}
      >
        {beat === "seal" ? "Sealing" : closed ? "Closing" : inserted ? "Posting" : "Folding"}
      </motion.p>
    </div>
  );
}

/* Letter ------------------------------------------------------------------ */

/**
 * A still of the brief that folds in two.
 *
 * The live form is not folded — its inputs would distort and its focus would be
 * lost mid-animation — so the sequence hands over to this frozen sheet carrying
 * the same content.
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
      className="relative w-full"
      style={{ transformStyle: "preserve-3d" }}
      initial={false}
      animate={{ scaleY: folded ? 0.34 : 1, scale: folded ? 0.98 : 1 }}
      transition={t(0.8)}
    >
      <div className="paper paper-edge relative px-6 py-6 sm:px-8 sm:py-7">
        {/* Content compresses as the sheet closes so the type does not smear
            vertically with the scale. */}
        <motion.div
          initial={false}
          animate={{ opacity: folded ? 0 : 1, scaleY: folded ? 2.4 : 1 }}
          transition={t(0.5)}
          className="origin-top"
        >
          <p className="t-label mb-4 text-[var(--ink-3)]">Project brief</p>
          <p className="mb-4 line-clamp-3 text-[0.9375rem] leading-relaxed text-[var(--ink)]">
            {value.projectBrief.trim()}
          </p>
          <p className="t-meta text-[var(--ink-2)]">{typeLabels(value.projectTypes)}</p>
          <p className="t-meta mt-1 text-[var(--ink-2)]">{budgetLabel(value.budget)}</p>
          <p className="t-meta mt-4 text-[var(--ink-3)]">{value.name.trim()}</p>
        </motion.div>

        {/* Creases. Two ruled folds that print as the sheet closes. */}
        {[33, 66].map((pos, i) => (
          <motion.span
            key={pos}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 h-px",
              "bg-[linear-gradient(90deg,transparent,rgb(23_22_20_/_0.34)_12%,rgb(23_22_20_/_0.34)_88%,transparent)]",
            )}
            style={{ top: `${pos}%` }}
            initial={false}
            animate={{ opacity: folded ? 1 : 0, scaleX: folded ? 1 : 0.4 }}
            transition={t(0.45, i * 0.09)}
          />
        ))}

        {/* Shading that gathers along the folds as the paper doubles over. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_18%,rgb(0_0_0_/_0.22)_33%,transparent_46%,transparent_54%,rgb(0_0_0_/_0.22)_66%,transparent_80%)]"
          initial={false}
          animate={{ opacity: folded ? 1 : 0 }}
          transition={t(0.6)}
        />
      </div>
    </motion.div>
  );
}
