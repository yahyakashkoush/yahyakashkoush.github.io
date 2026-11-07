import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "cn";

const SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "capabilities", label: "Expertise" },
  { id: "contact", label: "Contact" },
] as const;

/** Scroll-linked movement: the marker stops when the visitor stops scrolling. */
export function SectionTrail() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const [stops, setStops] = useState<number[]>(SECTIONS.map((_, i) => i / (SECTIONS.length - 1)));
  const [active, setActive] = useState(0);
  const top = useTransform(scrollYProgress, (value) => `${value * 100}%`);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 1080]);

  useEffect(() => {
    const measure = () => {
      const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setStops(SECTIONS.map(({ id }) => {
        const element = document.getElementById(id);
        const offset = element ? element.getBoundingClientRect().top + window.scrollY - 96 : 0;
        return Math.max(0, Math.min(1, offset / range));
      }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    const main = document.getElementById("main");
    if (main) observer.observe(main);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const position = scrollYProgress.get();
    setActive(stops.reduce((current, stop, i) => position + 0.015 >= stop ? i : current, 0));
  }, [stops, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (position) => {
    setActive(stops.reduce((current, stop, i) => position + 0.015 >= stop ? i : current, 0));
  });

  return (
    <>
      <nav aria-label="Page sections" className="fixed top-1/2 right-1 z-40 hidden h-64 w-8 -translate-y-1/2 lg:block">
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-line-2" />
        <motion.div aria-hidden style={{ scaleY: scrollYProgress }} className="absolute inset-y-0 left-1/2 w-px origin-top bg-red" />
        {SECTIONS.map(({ id, label }, i) => (
          <a
            key={id}
            href={`#${id}`}
            aria-label={`Go to ${label}`}
            aria-current={active === i ? "location" : undefined}
            onClick={(event) => {
              const section = document.getElementById(id);
              if (!section) return;
              event.preventDefault();
              section.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
              window.history.replaceState(null, "", `#${id}`);
            }}
            style={{ top: `${stops[i] * 100}%` }}
            className="group absolute left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center focus-visible:outline-offset-0"
          >
            <span className={cn("size-[5px] border border-fg-3 bg-background transition-colors", active === i && "border-red bg-red")} />
            <span className="t-label pointer-events-none absolute right-full mr-2 border border-line bg-background px-3 py-2 text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {label}
            </span>
          </a>
        ))}
        <motion.div aria-hidden style={{ top }} className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.svg style={{ rotate: reduce ? 0 : rotate }} width="22" height="22" viewBox="0 0 24 24" className="text-red">
            <circle cx="12" cy="12" r="9" fill="var(--bg)" stroke="currentColor" strokeWidth="1" strokeDasharray="16 5 4 5" />
            <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1" />
          </motion.svg>
        </motion.div>
      </nav>
      <div aria-hidden className="pointer-events-none fixed top-1/2 right-0 z-40 h-32 w-2 -translate-y-1/2 lg:hidden">
        <div className="absolute inset-y-0 right-0 w-px bg-line-2" />
        <motion.div style={{ scaleY: scrollYProgress }} className="absolute inset-y-0 right-0 w-px origin-top bg-red" />
        <motion.div style={{ top }} className="absolute right-0 -translate-y-1/2">
          <motion.svg style={{ rotate: reduce ? 0 : rotate }} width="8" height="8" viewBox="0 0 12 12" className="text-red">
            <circle cx="6" cy="6" r="4.5" fill="var(--bg)" stroke="currentColor" strokeDasharray="7 3" />
          </motion.svg>
        </motion.div>
      </div>
    </>
  );
}
