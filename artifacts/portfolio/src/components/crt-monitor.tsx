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
      <div aria-hidden className="tv-antenna"><i /><i /><b /></div>
      <div className="tv-body">
        <div className="tv-bezel">
          <div className="tv-screen" data-on={playing} style={{ aspectRatio: clip.width / clip.height }}>
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

        <div className="tv-panel">
          <span aria-hidden className="tv-brand t-label text-[0.5rem]">YK-01</span>
          <span aria-hidden className="tv-dial" data-on={playing} />
          <div aria-hidden className="tv-ticks"><span /><span /><span /><span /><span /></div>
          <div aria-hidden className="tv-grille" />
          <span aria-hidden className="tv-led" data-on={playing} />
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
