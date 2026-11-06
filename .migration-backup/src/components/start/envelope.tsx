"use client";

import { useEffect } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "cn";

/**
 * The envelope, as one persistent physical object.
 *
 * Layer order, back to front, never swapped: interior wall · letter · front
 * panel · flap · seal. Nothing is hidden or replaced to fake a transition —
 * the same nodes stay mounted and only their transforms change.
 *
 * The flap hinges on the envelope's TOP edge (`transform-origin: top center`
 * on the cut-out triangle) and rotates backward over the top, which is what a
 * real flap does. Its z-index is derived from the live angle rather than
 * keyframed, so it crosses behind the body exactly as it passes vertical —
 * the one moment it is edge-on and invisible — with no discrete jump and no
 * race if the state flips mid-flight.
 *
 * The letter lives *inside* the envelope at rest, behind the front panel, and
 * slides up and out through the mouth. It is never repositioned instantly.
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

/** Flap travel. Stops shy of 180° so the fold keeps a little thickness. */
const OPEN_ANGLE = -168;

export const FLAP_MS = 900;
export const LETTER_MS = 900;

export type EnvelopeState = "closed" | "open";

export function Envelope({
  state,
  sealed,
  letter,
  letterOut = false,
  className,
}: {
  state: EnvelopeState;
  /** Draws the wax seal over the flap point. */
  sealed: boolean;
  /** The sheet that lives inside this envelope. */
  letter?: React.ReactNode;
  /** true slides the letter up and out of the mouth; false keeps it inside. */
  letterOut?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const open = state === "open";

  const flapAngle = useMotionValue(open ? OPEN_ANGLE : 0);
  // Past vertical the flap belongs behind the body, before it in front.
  const flapZ = useTransform(flapAngle, (a) => (a < -90 ? 0 : 3));

  useEffect(() => {
    const controls = animate(
      flapAngle,
      open ? OPEN_ANGLE : 0,
      reduce ? { duration: 0 } : { duration: FLAP_MS / 1000, ease: EASE },
    );
    return () => controls.stop();
  }, [open, reduce, flapAngle]);

  return (
    <div
      className={cn("envelope-3d relative w-full select-none", className)}
      style={{ aspectRatio: ENVELOPE_ASPECT, ["--apex" as string]: APEX }}
    >
      {/* Interior wall. Only ever glimpsed through the mouth once the flap is
          up, behind whatever is inside. */}
      <div aria-hidden className="absolute inset-0 bg-[#0d0c0c]" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-black/80 to-transparent"
      />

      {/* The letter, inside. Anchored low enough that at rest it sits wholly
          within the envelope's own box — its middle visible through the open
          mouth, its sides behind the front panel, exactly as a real one reads.
          Sliding out is a transform on this same node, never a remount. */}
      {letter && (
        <motion.div
          aria-hidden
          className="absolute inset-x-[8%] top-[24%] z-[1]"
          initial={false}
          animate={{ y: letterOut ? "-88%" : "0%" }}
          transition={reduce ? { duration: 0 } : { duration: LETTER_MS / 1000, ease: EASE }}
        >
          {letter}
        </motion.div>
      )}

      {/* Front panel: the render, notched so the mouth reads as an opening.
          Always above the letter, so anything still inside stays occluded. */}
      <Image
        src={PLATE}
        alt=""
        aria-hidden
        fill
        sizes="(max-width: 768px) 92vw, 640px"
        priority
        className="body-face relative z-[2] object-cover"
      />

      {/* Flap, hinged on the top edge. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ rotateX: flapAngle, zIndex: flapZ, transformStyle: "preserve-3d", transformOrigin: "top center" }}
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
          way in and pressed on again once the flap is fully down. */}
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

/** The sheet itself. Shared so the envelope holds the same object throughout. */
export function LetterSheet({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("paper paper-edge aspect-[1/0.42] w-full px-[6%] py-[5%]", className)}>{children}</div>
  );
}
