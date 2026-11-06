import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const MESSAGES = [
  "Preparing your brief",
  "Sending your details",
  "Almost there",
] as const;

/**
 * A short, honest sending state instead of the broken envelope-folding
 * animation. The timer is cleaned up on unmount and completion fires once.
 */
export function SendSequence({ onComplete }: { onComplete: () => void }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const completed = useRef(false);

  useEffect(() => {
    const delays = reduce ? [0, 40, 80, 120] : [0, 420, 920, 1460];
    const timers = delays.map((delay, index) =>
      window.setTimeout(() => {
        if (index === delays.length - 1) {
          if (completed.current) return;
          completed.current = true;
          onComplete();
        } else {
          setStage(index);
        }
      }, delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [onComplete, reduce]);

  return (
    <section
      className="mx-auto w-full max-w-[42rem] border-y border-line py-12 sm:py-16"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="t-label mb-8 text-fg-3">Project inquiry</p>
      <h1 className="t-hero mb-10 text-foreground">{MESSAGES[stage]}</h1>
      <div
        className="grid grid-cols-3 gap-2"
        aria-hidden="true"
      >
        {MESSAGES.map((message, index) => (
          <motion.span
            key={message}
            className="h-0.5 origin-left bg-foreground"
            initial={false}
            animate={{ scaleX: index <= stage ? 1 : 0.3, opacity: index <= stage ? 1 : 0.25 }}
            transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
    </section>
  );
}
