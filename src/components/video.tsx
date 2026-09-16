"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Clip } from "@/content/media";
import { cn } from "cn";

/* Shared playback --------------------------------------------------------- */

/**
 * Nothing on the site autoplays: the hero is a still. Every clip stays at
 * `preload="none"` behind its poster until it scrolls into view, and pauses
 * again on the way out, so a visitor who never reaches a cut never pays for it.
 */
function useViewportPlayback(enabled = true) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // `playing` is driven by the element's own events, never latched. The poster
  // sits underneath and is only hidden while playback is actually running, so
  // if the browser releases the decoder (readyState drops back to 0 on a
  // backgrounded tab) the section falls back to the still instead of going
  // black. A one-way "has painted once" flag cannot recover from that.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => setPlaying(true);
    const off = () => setPlaying(false);
    el.addEventListener("playing", on);
    el.addEventListener("pause", off);
    el.addEventListener("ended", off);
    el.addEventListener("emptied", off);
    el.addEventListener("stalled", off);
    el.addEventListener("error", off);
    return () => {
      el.removeEventListener("playing", on);
      el.removeEventListener("pause", off);
      el.removeEventListener("ended", off);
      el.removeEventListener("emptied", off);
      el.removeEventListener("stalled", off);
      el.removeEventListener("error", off);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // `preload="none"` means the element holds no data until something asks for
    // it. Relying on play() alone to kick that off is fragile: if the promise
    // is rejected or deferred (backgrounded tab, blocked autoplay, low power
    // mode) the source is never fetched and the section sits on its poster
    // forever. So promote preload and call load() explicitly on first entry,
    // then retry play once there are frames to show.
    let primed = false;
    const tryPlay = () => el.play().catch(() => {});

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!primed) {
            primed = true;
            el.preload = "auto";
            el.load();
          }
          tryPlay();
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 },
    );

    el.addEventListener("canplay", tryPlay);
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeEventListener("canplay", tryPlay);
    };
  }, [enabled]);

  return { ref, playing };
}

/* Full-bleed chapter cut -------------------------------------------------- */

/**
 * A film cut between chapters. Used sparingly: two on the whole page, so the
 * site reads as sections with cuts between them rather than an alternating
 * strip of section and video.
 */
export function CinematicCut({ clip, caption, className }: { clip: Clip; caption: string; className?: string }) {
  const { ref, playing } = useViewportPlayback();

  return (
    <section
      aria-label={caption}
      className={cn("relative h-[70vh] w-full overflow-hidden md:h-[85vh]", className)}
    >
      <Image
        src={clip.poster}
        alt={clip.posterAlt}
        fill
        sizes="100vw"
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
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
    </section>
  );
}
