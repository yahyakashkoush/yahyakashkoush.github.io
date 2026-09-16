import Image from "next/image";
import type { Clip } from "@/content/media";
import { cn } from "cn";

/**
 * A full-bleed still where `CinematicCut` used to run its video. Same scrim —
 * just no `<video>`, so it ships no client JS and nothing to decode. Takes
 * just `poster`/`posterAlt` (a `Clip`'s shape without the parts that only make
 * sense for something playable) so it works equally for a still pulled from a
 * `cinematic` entry or a standalone photo record.
 */
export function CinematicStill({
  clip,
  caption,
  className,
  /**
   * "cover" fills the full-bleed band, cropping the photo to it — right for a
   * landscape frame close to the section's own aspect. "contain" shows the
   * whole photo letterboxed instead, which a portrait source (like
   * human-system.jpg, shot vertically, forced into a wide band) needs so
   * nothing of the frame is cut off.
   */
  fit = "cover",
}: {
  clip: Pick<Clip, "poster" | "posterAlt">;
  caption: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  return (
    <section
      aria-label={caption}
      className={cn("relative h-[70vh] w-full overflow-hidden bg-background md:h-[85vh]", className)}
    >
      <Image
        src={clip.poster}
        alt={clip.posterAlt}
        fill
        sizes="100vw"
        className={fit === "contain" ? "object-contain object-center" : "object-cover object-center"}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
    </section>
  );
}
