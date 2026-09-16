"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Container, Kicker, Rule, SectionHeading } from "@/components/primitives";
import { RevealGroup, RevealItem } from "@/components/motion";
import { projects } from "@/content/projects";
import { getProjectMedia, type ProjectShot } from "@/content/media";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The case-study index. The hover preview shows a screenshot that belongs to
 * that exact project and nothing else: no portraits, no cinematic stills, no
 * other project's assets. Projects with no screenshots get a typographic
 * preview rather than a borrowed image.
 */
export function Work() {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 26, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 26, mass: 0.4 });

  const track = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  // Touch fires pointerenter on tap, and there is no cursor for the peek to
  // follow, so it stays a mouse-only affordance.
  const enter = (e: React.PointerEvent, slug: string) => {
    if (e.pointerType === "mouse") setHovered(slug);
  };

  const active = hovered ? projects.find((p) => p.slug === hovered) : null;
  const activeShot = hovered ? getProjectMedia(hovered).preview : null;

  return (
    <section id="work" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="mb-12 flex flex-col gap-4 md:mb-16">
          <Kicker>Selected work</Kicker>
          <SectionHeading className="max-w-[18ch]">Five systems, built end to end.</SectionHeading>
        </div>
      </Container>

      <div ref={wrap} className="relative" onPointerMove={track}>
        <Rule />
        <RevealGroup>
          {projects.map((p) => {
            return (
              <RevealItem key={p.slug}>
                <Link
                  href={`/work/${p.slug}`}
                  onPointerEnter={(e) => enter(e, p.slug)}
                  onPointerLeave={() => setHovered((h) => (h === p.slug ? null : h))}
                  className="group block border-b border-line transition-colors duration-500 hover:bg-surface focus-visible:bg-surface"
                >
                  <Container>
                    <div className="flex items-baseline gap-5 py-7 md:gap-8 md:py-10 lg:py-12">
                      <span className="t-label shrink-0 text-fg-3 transition-colors duration-300 group-hover:text-red">
                        {p.index}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="t-sub text-foreground">{p.title}</h3>
                        <p className="t-caption mt-1.5 max-w-[52ch]">{p.subtitle}</p>
                      </div>

                      <span className="t-meta hidden shrink-0 text-fg-3 lg:block">{p.year ?? ""}</span>

                      <ArrowUpRight
                        weight="bold"
                        className="size-4 shrink-0 self-center text-fg-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red"
                      />
                    </div>
                  </Container>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {!reduce && (
          <motion.div
            aria-hidden
            style={{ x: sx, y: sy }}
            className="pointer-events-none absolute top-0 left-0 z-20 hidden md:block"
          >
            <AnimatePresence>
              {active && (
                <motion.div
                  key={active.slug}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  /* Offset right of the pointer so the row title stays readable
                     while its own preview is open. */
                  className="absolute top-0 left-0 ml-10 w-[340px] -translate-y-1/2"
                >
                  {activeShot ? (
                    <ScreenshotPeek shot={activeShot} />
                  ) : (
                    <TypographicPeek title={active.title} subtitle={active.subtitle} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/**
 * Screenshots are shown whole, on a plate, at their own aspect ratio. Never
 * cover-cropped: the UI is the content.
 */
function ScreenshotPeek({ shot }: { shot: ProjectShot }) {
  return (
    <div className="border border-line-red bg-surface p-3">
      <Image
        src={shot.src}
        alt=""
        width={shot.width}
        height={shot.height}
        sizes="340px"
        className={cnPeek(shot.kind)}
      />
    </div>
  );
}

const cnPeek = (kind: ProjectShot["kind"]) =>
  kind === "mobile" ? "mx-auto h-auto w-[62%] object-contain" : "h-auto w-full object-contain";

/** Shown for projects with no real visual evidence. No stand-in imagery. */
function TypographicPeek({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex aspect-[4/3] flex-col justify-end border border-line-red bg-elevated p-5">
      <p className="t-label mb-2 text-red">No screenshots</p>
      <p className="t-sub text-foreground">{title}</p>
      <p className="t-caption mt-1.5 line-clamp-2">{subtitle}</p>
    </div>
  );
}
