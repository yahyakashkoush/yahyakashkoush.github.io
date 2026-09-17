"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { startCopy } from "@/content/inquiry";
import { Magnetic } from "@/components/motion";
import { Envelope, LetterSheet } from "@/components/start/envelope";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Opening frame: the envelope is the object, the type sits under it as a
 * caption rather than a centred hero stack.
 *
 * `opening` lifts the flap; `letterOut` then slides the blank sheet up out of
 * the mouth. Two separate beats on the same mounted envelope, so the object
 * never jumps or gets swapped for a different one.
 */
export function Intro({
  opening,
  letterOut,
  onOpen,
}: {
  opening: boolean;
  letterOut: boolean;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const t = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, delay, ease: EASE });

  return (
    <div className="mx-auto flex w-full max-w-[42rem] flex-col items-center">
      <motion.div
        className="w-full"
        initial={reduce ? false : { opacity: 0, y: 26, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: opening || letterOut ? -14 : 0,
          scale: opening || letterOut ? 1.035 : 1,
        }}
        transition={t(opening || letterOut ? 0.75 : 1.1, opening || letterOut ? 0 : 0.1)}
      >
        {/* No 3D transform (rotateX/perspective) on this wrapper: the flap
            inside `Envelope` runs its own `preserve-3d` rotation, and nesting
            a second, independent 3D rotation context around it corrupts the
            render mid-animation (Chromium compositing bug — the whole
            envelope intermittently vanishes while both are in flight). */}
        <Envelope
          state={opening || letterOut ? "open" : "closed"}
          sealed={!opening && !letterOut}
          letterOut={letterOut}
          letter={<LetterSheet />}
        />
      </motion.div>

      <motion.div
        className="mt-12 w-full border-t border-line pt-8"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: opening || letterOut ? 0 : 1, y: 0 }}
        transition={t(0.8, opening || letterOut ? 0 : 0.42)}
      >
        <p className="t-label mb-5 text-red">{startCopy.label}</p>
        <h1 className="t-hero mb-5 max-w-[12ch] text-foreground">{startCopy.title}</h1>
        <p className="t-body mb-9 max-w-[38ch]">{startCopy.lede}</p>

        <Magnetic>
          <button
            type="button"
            onClick={onOpen}
            disabled={opening}
            className="group t-nav inline-flex min-h-12 items-center justify-center gap-3 border border-foreground px-7 text-foreground transition-[background-color,color,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-red hover:bg-red hover:text-white active:translate-y-px disabled:pointer-events-none disabled:opacity-40"
          >
            {startCopy.cta}
            <ArrowRight weight="bold" className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </Magnetic>
      </motion.div>
    </div>
  );
}
