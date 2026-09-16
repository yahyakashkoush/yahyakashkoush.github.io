"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react/dist/ssr";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RevealGroup, RevealItem } from "@/components/motion";
import type { ProjectShot } from "@/content/media";
import { cn } from "cn";

/**
 * Screenshots are evidence, not photography, so they are rendered on their own
 * terms: whole frame, own aspect ratio, `object-contain`, and never wider than
 * the file's intrinsic pixels. These captures top out at 1364px, so letting a
 * 1400px container stretch them is what made them look soft. `maxWidth` pins
 * that shut; the plate around them absorbs the leftover space.
 *
 * No cover-cropping, no cinematic overlay, no red wash: all of it would eat the
 * small UI text these screenshots exist to show.
 */
export function Gallery({ items, title }: { items: ProjectShot[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const phone = items[0]?.kind === "mobile";

  const go = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? null : (i + dir + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  return (
    <>
      <RevealGroup className={cn(phone ? "grid grid-cols-1 gap-5 sm:grid-cols-3" : "flex flex-col gap-10 md:gap-14")}>
        {items.map((shot, i) => (
          <RevealItem key={shot.src}>
            <figure className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Open full size: ${shot.caption}`}
                className="group block w-full border border-line bg-surface p-3 transition-colors duration-500 hover:border-line-red md:p-5"
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  /* Ask Next for at most the intrinsic width, so it never
                     generates an upscaled candidate. */
                  sizes={
                    phone
                      ? `(max-width: 640px) 90vw, ${shot.width}px`
                      : `(max-width: 768px) 92vw, ${shot.width}px`
                  }
                  style={{ maxWidth: shot.width }}
                  className="mx-auto h-auto w-full object-contain"
                />
              </button>
              <figcaption className="t-label flex items-center gap-3 text-fg-3">
                <span className="text-red">{String(i + 1).padStart(2, "0")}</span>
                {shot.caption}
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>

      {items.some((s) => s.needsCleanExport) && (
        <p className="t-caption mt-8 max-w-[60ch]">
          These captures carry the source marketplace watermark. They are shown unmodified rather than
          cropped, which would cut into the interface.
        </p>
      )}

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 top-0 left-0 max-w-none translate-x-0 translate-y-0 border-0 bg-background/97 p-0 ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">{title} screenshots</DialogTitle>
          {open !== null && (
            <div className="flex h-dvh flex-col">
              <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-10">
                <span className="t-label text-fg-3">
                  {String(open + 1).padStart(2, "0")} of {String(items.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  aria-label="Close"
                  className="flex size-11 items-center justify-center border border-line text-foreground transition-colors duration-300 hover:border-red hover:text-red"
                >
                  <X weight="bold" className="size-4" />
                </button>
              </div>

              {/* min-h-0 so the image shrinks to the row instead of overflowing. */}
              <div className="flex min-h-0 flex-1 items-center justify-center px-6 pb-6 lg:px-10">
                <Image
                  src={items[open].src}
                  alt={items[open].alt}
                  width={items[open].width}
                  height={items[open].height}
                  sizes={`${items[open].width}px`}
                  style={{ maxWidth: items[open].width }}
                  className="h-auto max-h-full w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-6 pb-6 lg:px-10">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous screenshot"
                  className="t-nav flex min-h-11 items-center gap-2.5 border border-line px-4 text-fg-2 transition-colors duration-300 hover:border-red hover:text-foreground"
                >
                  <ArrowLeft weight="bold" className="size-3.5" />
                  Prev
                </button>
                <p className="t-caption hidden flex-1 text-center sm:block">{items[open].caption}</p>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next screenshot"
                  className="t-nav flex min-h-11 items-center gap-2.5 border border-line px-4 text-fg-2 transition-colors duration-300 hover:border-red hover:text-foreground"
                >
                  Next
                  <ArrowRight weight="bold" className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
