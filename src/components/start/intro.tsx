"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { startCopy } from "@/content/inquiry";
import { Magnetic } from "@/components/motion";
import { Envelope } from "@/components/start/envelope";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Opening frame: the envelope is the object, the type sits under it as a
 * caption rather than a centred hero stack. `opening` runs the pre-roll — the
 * object settles and leans a few degrees before the flap moves — so the
 * sequence starts as a camera move rather than a screen change.
 */
export function Intro({ opening, onOpen }: { opening: boolean; onOpen: () => void }) {
  const reduce = useReducedMotion();
  const t = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, delay, ease: EASE });

  return (
    <div className="mx-auto flex w-full max-w-[42rem] flex-col items-center">
      <motion.div
        className="w-full"
        style={{ perspective: 1800 }}
        initial={reduce ? false : { opacity: 0, y: 26, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: opening ? -14 : 0,
          scale: opening ? 1.035 : 1,
          rotateX: opening ? 7 : 0,
        }}
        transition={t(opening ? 0.75 : 1.1, opening ? 0 : 0.1)}
      >
        <Envelope state={opening ? "open" : "closed"} sealed={!opening} />
      </motion.div>

      <motion.div
        className="mt-12 w-full border-t border-line pt-8"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: opening ? 0 : 1, y: 0 }}
        transition={t(0.8, opening ? 0 : 0.42)}
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
