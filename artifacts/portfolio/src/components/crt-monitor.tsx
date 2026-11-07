import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { Container, Kicker } from "@/components/primitives";
import { Reveal } from "@/components/motion";
import { SystemsReel } from "@/components/systems-reel";
import { cn } from "cn";
import "./automation-flow.css";

/**
 * A restrained television set showing the systems reel: a generated programme
 * built from the real projects rather than stock footage. The Play/Pause
 * control is the viewer's; scrolling away pauses rendering on its own.
 */
export function CrtMonitor({ caption, className, embedded = false }: { caption: string; className?: string; embedded?: boolean }) {
  const [playing, setPlaying] = useState(true);
  const toggle = () => setPlaying((p) => !p);

  const monitor = (
    <figure aria-label={caption} className={cn("tv", embedded && className)}>
      <div aria-hidden className="tv-antenna"><i /><i /><b /></div>
      <div className="tv-body">
        <div className="tv-bezel">
          <div className="tv-screen" data-on={playing} style={{ aspectRatio: "950 / 590" }}>
            <SystemsReel playing={playing} />
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause reel" : "Play reel"}
              aria-pressed={playing}
              className="absolute inset-0 z-10 cursor-pointer appearance-none bg-transparent"
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
