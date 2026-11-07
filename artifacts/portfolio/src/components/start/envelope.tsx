import { useEffect, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "cn";

export type EnvelopeState = "closed" | "open";

/**
 * An image-free envelope. A two-dimensional fold avoids browser-specific 3D
 * backface and clipping glitches. Completion events, not guessed timeouts,
 * coordinate the letter, flap and seal.
 */
export function Envelope({
  state,
  sealed,
  letter,
  letterOut = false,
  className,
  onFlapComplete,
  onLetterComplete,
  onSealComplete,
}: {
  state: EnvelopeState;
  sealed: boolean;
  letter?: ReactNode;
  letterOut?: boolean;
  className?: string;
  onFlapComplete?: () => void;
  onLetterComplete?: () => void;
  onSealComplete?: () => void;
}) {
  const reduce = useReducedMotion();
  const open = state === "open";
  const flapScale = useMotionValue(open ? -1 : 1);
  const flapZ = useTransform(flapScale, (scale) => scale < 0 ? 0 : 3);

  useEffect(() => {
    const controls = animate(flapScale, open ? -1 : 1, {
      duration: reduce ? 0 : 0.32,
      ease: [0.4, 0, 0.2, 1],
      onComplete: onFlapComplete,
    });
    return () => controls.stop();
  }, [open, reduce, flapScale, onFlapComplete]);

  return (
    <div aria-hidden="true" className={cn("relative isolate aspect-[1.8/1] w-full select-none", className)}>
      <div className="absolute inset-0 border border-white/20 bg-[#141617]" />

      {letter && (
        <motion.div
          className="absolute inset-x-[9%] top-[12%] z-[1]"
          initial={false}
          animate={{ y: letterOut ? "-78%" : "0%" }}
          transition={{
            duration: reduce ? 0 : 0.28,
            delay: reduce || !letterOut ? 0 : 0.32,
            ease: [0.16, 1, 0.3, 1],
          }}
          onAnimationComplete={onLetterComplete}
        >
          {letter}
        </motion.div>
      )}

      <svg className="absolute inset-0 z-[2] size-full" viewBox="0 0 360 200" preserveAspectRatio="none">
        <path d="M0 0 L180 124 L360 0 L360 200 L0 200 Z" fill="#1c1f20" stroke="#454849" strokeWidth="1" />
        <path d="M0 200 L142 101 M360 200 L218 101" fill="none" stroke="#393d3e" strokeWidth="1" />
      </svg>

      <motion.div
        className="absolute inset-x-0 top-0 h-[62%] origin-top"
        style={{ scaleY: flapScale, zIndex: flapZ }}
      >
        <svg className="size-full" viewBox="0 0 360 124" preserveAspectRatio="none">
          <path d="M0 0 L180 124 L360 0 Z" fill="#272a2b" stroke="#505455" strokeWidth="1" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-[62%] z-[4] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-white/35 bg-[#101212] text-[9px] tracking-[0.12em] text-white/80 sm:size-10"
        initial={false}
        animate={{ opacity: sealed ? 1 : 0, scale: sealed ? 1 : 0.8 }}
        transition={{ duration: reduce ? 0 : 0.22 }}
        onAnimationComplete={onSealComplete}
      >
        YK
      </motion.div>
    </div>
  );
}

export function LetterSheet({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn("aspect-[1/0.54] w-full border border-black/20 bg-[#eeeeee] px-[8%] py-[7%] text-[#262626]", className)}>
      {children ?? (
        <>
          <div className="mb-4 h-px w-1/3 bg-black/40" />
          <div className="mb-2 h-px w-full bg-black/15" />
          <div className="mb-2 h-px w-full bg-black/15" />
          <div className="h-px w-2/3 bg-black/15" />
        </>
      )}
    </div>
  );
}
