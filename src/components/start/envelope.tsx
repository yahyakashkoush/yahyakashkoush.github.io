"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";

/**
 * The envelope.
 *
 * The supplied GLB is a single 207k-triangle mesh with one material and no
 * animation tracks, so the flap cannot be driven from the file. It is rendered
 * once offline instead (scripts/render-envelope.mjs) and the flap is restored
 * here: a clip-path triangle laid over the *same* plate image at the same size,
 * which means the closed state is pixel-identical to the render — there is no
 * seam to hide — and the triangle can then rotate on its own.
 *
 * Stacking, back to front: interior · letter slot · body · flap. The flap sits
 * above the body when closed and drops behind it once past vertical, which is
 * what a real flap does as it falls open.
 */

export const ENVELOPE_ASPECT = 2048 / 1096;

/** Flap point, as a share of envelope height. Matches the seam in the render. */
const APEX = "62%";

const PLATE = "/media/object/envelope-plate.webp";
// Same render, pre-cut to just the flap triangle (transparent elsewhere) —
// see the flap-face utility comment in globals.css for why this can't be a
// clip-path on the rotating element instead.
const FLAP = "/media/object/envelope-flap.webp";

const EASE = [0.16, 1, 0.3, 1] as const;

export type EnvelopeState = "closed" | "open";

export function Envelope({
  state,
  sealed,
  className,
  children,
}: {
  state: EnvelopeState;
  /** Draws the wax seal over the flap point. */
  sealed: boolean;
  className?: string;
  /** Rendered in the envelope's mouth, behind the body panel. */
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const open = state === "open";

  return (
    <div
      className={cn("envelope-3d relative w-full select-none", className)}
      style={{ aspectRatio: ENVELOPE_ASPECT, ["--apex" as string]: APEX }}
    >
      {/* Interior. Sits furthest back and is only ever glimpsed through the
          mouth once the flap is up. */}
      <div aria-hidden className="absolute inset-0 bg-[#0d0c0c]" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-black/80 to-transparent"
      />

      {/* Whatever is being posted. `inset-0` so it matches the envelope box
          exactly — the letter positions itself with percentage `top` values,
          which need a sized ancestor to resolve against, not a flow div that
          collapses to zero height. Explicitly under the front panel: without a
          z-index here, an absolutely-positioned child with its own z-index
          (the letter, in send-sequence.tsx) would establish a stacking context
          above this panel's implicit auto/0 level regardless of DOM order, and
          never actually disappear "inside" the envelope. */}
      <div className="absolute inset-0 z-[1]">{children}</div>

      {/* Front panel: the render, notched so the mouth reads as an opening. */}
      <Image
        src={PLATE}
        alt=""
        aria-hidden
        fill
        sizes="(max-width: 768px) 92vw, 640px"
        priority
        className="body-face relative z-[2] object-cover"
      />

      {/* Flap. Same plate, same object-fit, so closed it lands exactly over the
          panel beneath it. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{
          rotateX: open ? -172 : 0,
          // Discrete: the flap has to cross behind the body as it passes
          // vertical, and z-index cannot be interpolated meaningfully.
          zIndex: open ? [3, 3, 0, 0] : [0, 0, 3, 3],
        }}
        transition={
          reduce
            ? { duration: 0 }
            : { rotateX: { duration: 1.05, ease: EASE }, zIndex: { duration: 1.05, times: [0, 0.42, 0.43, 1] } }
        }
      >
        <div className="relative size-full" style={{ transformStyle: "preserve-3d" }}>
          {/* Outer face: the real paper, pre-cut to the triangle — see FLAP. */}
          <Image
            src={FLAP}
            alt=""
            fill
            sizes="(max-width: 768px) 92vw, 640px"
            priority
            className="flap-face object-cover"
          />
          {/* Inner face, seen once the flap is over. Flat unprinted stock. */}
          <div
            className="flap-inner-face absolute inset-0 bg-[#151413]"
            style={{ transform: "rotateX(180deg)" }}
          />
        </div>
      </motion.div>

      {/* Wax seal, at the flap point. Its own layer so it can be broken on the
          way in and pressed on again at the end. */}
      <motion.div
        aria-hidden
        className="absolute z-[4]"
        style={{ left: "49.5%", top: APEX, width: "18.5%", translate: "-50% -50%" }}
        initial={false}
        animate={sealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.35 }}
        transition={reduce ? { duration: 0 } : { duration: sealed ? 0.42 : 0.3, ease: EASE }}
      >
        <Image
          src="/media/object/wax-seal.webp"
          alt=""
          width={512}
          height={502}
          className="h-auto w-full"
        />
      </motion.div>
    </div>
  );
}
