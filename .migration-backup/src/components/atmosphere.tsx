"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/** Film grain. Fixed and non-interactive so it never repaints during scroll. */
export function Grain() {
  return (
    <div
      aria-hidden
      className="grain pointer-events-none fixed inset-0 z-[60] hidden opacity-[0.035] md:block"
    />
  );
}

/**
 * A red ring that trails the pointer. The native cursor stays visible: this is
 * an accent, not a cursor replacement. Pointer-only, and off under reduced motion.
 */
export function CursorAccent() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 200, damping: 26, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 200, damping: 26, mass: 0.35 });

  useEffect(() => {
    if (reduce) return;

    // The ring turns itself on at the first genuine mouse move. That keeps the
    // enable decision in an event handler rather than in the effect body, and
    // it never appears for touch or pen input.
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setEnabled(true);
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement | null;
      setActive(Boolean(el?.closest("a, button, [role='button'], input, textarea, video")));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed top-0 left-0 z-[65] -ml-3 -mt-3"
    >
      <motion.span
        animate={{ scale: active ? 2.6 : 1, opacity: active ? 0.9 : 0.45 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="block size-6 border border-red"
        /* Inline, not a `rounded-*` class: the global radius lock zeroes those. */
        style={{ borderRadius: "9999px" }}
      />
    </motion.div>
  );
}
