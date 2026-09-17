"use client";

import Image from "next/image";
import { Container, Kicker } from "@/components/primitives";
import { Reveal } from "@/components/motion";
import { useViewportPlayback } from "@/components/video";
import type { Clip } from "@/content/media";
import { cn } from "cn";

/**
 * A physical CRT monitor prop, built in CSS, playing the four-scene reel on
 * its screen.
 *
 * The source footage already frames its own beige CRT set — cropping that out
 * (scripts/build-crt-reel.sh) rather than nesting it inside a second frame was
 * the whole point: one monitor, not two. This shell restyles that idea in the
 * site's own black/red language instead of the footage's beige plastic.
 *
 * Effects are layered CSS, not baked into the video: scanlines, a phosphor
 * vignette, and a slow flicker. Kept subtle on purpose — a CRT that's easy to
 * read beats one that performs.
 */
export function CrtMonitor({ clip, caption, className }: { clip: Clip; caption: string; className?: string }) {
  const { ref, playing } = useViewportPlayback();

  return (
    <section id="story" aria-label={caption} className={cn("scroll-mt-24 py-24 md:py-32 lg:py-40", className)}>
      <Container>
        <Reveal className="flex flex-col items-center">
          <Kicker className="mb-10 text-center">{caption}</Kicker>

          <div className="crt-unit w-full max-w-[240px] sm:max-w-[420px] md:max-w-[560px]">
            <div className="crt-shell">
              {/* Power LED + vents: the only decoration on the shell, kept minimal. */}
              <div className="mb-3 flex items-center gap-2 px-1">
                <span aria-hidden className="crt-led" />
                <span className="t-label text-[0.55rem] tracking-[0.3em] text-white/25">REC · SIGNAL</span>
              </div>

              <div className="crt-screen" style={{ aspectRatio: clip.width / clip.height }}>
                <Image
                  src={clip.poster}
                  alt={clip.posterAlt}
                  fill
                  sizes="(max-width: 768px) 90vw, 560px"
                  className="object-cover object-center"
                />
                <video
                  ref={ref}
                  className={cn(
                    "absolute inset-0 size-full object-cover object-center transition-opacity duration-700",
                    playing ? "opacity-100" : "opacity-0",
                  )}
                  src={clip.src}
                  width={clip.width}
                  height={clip.height}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-label={clip.content}
                />
                <div aria-hidden className="crt-vignette" />
                <div aria-hidden className="crt-scanlines" />
                <div aria-hidden className="crt-flicker" />
              </div>

              {/* Vents, echoing the source footage's own TV without copying its
                  colour — a handful of dark slats, not a literal recreation. */}
              <div aria-hidden className="mt-3 flex justify-end gap-[3px] px-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="h-3 w-[3px] bg-white/10" />
                ))}
              </div>
            </div>
            <div aria-hidden className="crt-stand" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
