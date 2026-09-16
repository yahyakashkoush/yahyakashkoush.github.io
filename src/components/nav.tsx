"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Container } from "@/components/primitives";
import { nav, site } from "@/content/site";
import { cn } from "cn";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 80));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        scrolled ? "border-b border-line bg-background/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <Container>
        <div
          className={cn(
            "flex items-center justify-between transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled ? "h-14 md:h-16" : "h-16 md:h-20",
          )}
        >
          <Link
            href="/"
            className="group flex min-h-11 items-center gap-2.5 pr-2"
            aria-label={`${site.name}, home`}
          >
            <span className="block size-1.5 bg-red transition-transform duration-300 group-hover:scale-150" />
            <span className="t-nav text-foreground">{site.name}</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
            {/* py-2.5 keeps each hit area at the WCAG 2.5.8 minimum without
                changing the visual height of the bar. */}
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="link-wipe t-nav inline-flex items-center py-2.5 text-fg-2 transition-colors duration-300 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="group flex size-11 flex-col items-center justify-center gap-[5px] md:hidden"
              >
                <span className="block h-px w-[18px] bg-foreground transition-transform duration-300 group-hover:translate-y-px" />
                <span className="block h-px w-[18px] bg-foreground transition-transform duration-300 group-hover:-translate-y-px" />
              </button>
            </DialogTrigger>
            <MobileMenu onNavigate={() => setOpen(false)} />
          </Dialog>
        </div>
      </Container>
    </header>
  );
}

function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  const reduce = useReducedMotion();

  return (
    <DialogContent
      showCloseButton={false}
      className="inset-0 top-0 left-0 max-w-none translate-x-0 translate-y-0 border-0 bg-background p-0 ring-0 sm:max-w-none"
    >
      <DialogTitle className="sr-only">Menu</DialogTitle>
      <div className="flex h-dvh flex-col">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <span className="t-nav text-fg-3">Menu</span>
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close menu"
              className="relative flex size-11 items-center justify-center"
            >
              <span className="absolute block h-px w-[18px] rotate-45 bg-foreground" />
              <span className="absolute block h-px w-[18px] -rotate-45 bg-foreground" />
            </button>
          </div>
        </Container>

        <Container className="flex flex-1 flex-col justify-center">
          <nav aria-label="Mobile" className="flex flex-col">
            {nav.map((item, i) => (
              <motion.div
                key={item.href}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 + i * 0.06, ease: EASE }}
                className="border-b border-line"
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="t-hero flex items-baseline gap-4 py-5 text-foreground"
                >
                  <span className="t-label text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </Container>

        <Container>
          <div className="flex flex-col py-6">
            <a
              href={`mailto:${site.email}`}
              className="t-meta flex min-h-11 items-center break-all text-fg-2"
            >
              {site.email}
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className="t-meta flex min-h-11 items-center text-fg-3"
            >
              LinkedIn
            </a>
          </div>
        </Container>
      </div>
    </DialogContent>
  );
}
