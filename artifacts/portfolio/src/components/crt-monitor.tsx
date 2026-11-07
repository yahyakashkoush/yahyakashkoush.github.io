import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";
import { Container, Kicker } from "@/components/primitives";
import { Reveal } from "@/components/motion";
import { useViewportPlayback } from "@/components/video";
import type { Clip } from "@/content/media";
import { cn } from "cn";
import "./automation-flow.css";

/**
 * The original systems reel on a restrained television set. A manual pause is
 * respected: re-entering the viewport will not override the viewer's choice.
 */
export function CrtMonitor({ clip, caption, className, embedded = false }: { clip: Clip; caption: string; className?: string; embedded?: boolean }) {
  const { ref, playing } = useViewportPlayback();
  const userPaused = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const guard = () => {
      if (userPaused.current) el.pause();
    };
    el.addEventListener("play", guard);
    return () => el.removeEventListener("play", guard);
  }, [ref]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      userPaused.current = false;
      if (el.readyState === 0) {
        el.preload = "auto";
        el.load();
      }
      el.play().catch(() => {});
    } else {
      userPaused.current = true;
      el.pause();
    }
  };

  const monitor = (
    <figure aria-label={caption} className={cn("tv", embedded && className)}>
      <div className="tv-body">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span aria-hidden className="tv-led" data-on={playing} />
            <span className="t-label text-[0.55rem] text-fg-3">Systems in motion</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="tv-btn t-label text-[0.55rem]"
            aria-label={playing ? "Pause reel" : "Play reel"}
            aria-pressed={playing}
            data-testid="button-reel-toggle"
          >
            {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
            {playing ? "Pause" : "Play"}
          </button>
        </div>

        <div className="tv-bezel">
          <div className="tv-screen" style={{ aspectRatio: clip.width / clip.height }}>
            <video
              ref={ref}
              className="absolute inset-0 size-full cursor-pointer object-contain object-center"
              src={clip.src}
              poster={clip.poster}
              width={clip.width}
              height={clip.height}
              muted
              loop
              playsInline
              preload="none"
              onClick={toggle}
              aria-label={clip.content}
              data-testid="video-reel"
            />
            <div aria-hidden className="tv-lines" />
            <div aria-hidden className="tv-glass" />
          </div>
        </div>

        <div aria-hidden className="mt-3 flex items-center justify-between px-1">
          <span className="t-label text-[0.5rem] text-fg-3/70">YK / 01</span>
          <div className="flex gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="h-2.5 w-[3px] bg-white/10" />
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="tv-feet"><span /><span /></div>
      {embedded && <figcaption className="t-label mt-5 text-center text-fg-3">{caption}</figcaption>}
    </figure>
  );

  if (embedded) return monitor;

  return (
    <section id="story" aria-label={caption} className={cn("scroll-mt-24 py-24 md:py-32 lg:py-40", className)}>
      <Container>
        <Reveal className="flex flex-col items-center">
          <Kicker className="mb-10 text-center">{caption}</Kicker>
          {monitor}
        </Reveal>
      </Container>
    </section>
  );
}
