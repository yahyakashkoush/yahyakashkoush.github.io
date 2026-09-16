import Image from "next/image";
import { Action, Container } from "@/components/primitives";
import { Magnetic } from "@/components/motion";

/**
 * Film opening: black, then the frame resolves, then the title card rises.
 *
 * A single still, no video. The entrance is CSS rather than Motion because this
 * block holds the LCP element: it has to paint without waiting on JS, and the
 * opening curtain must not be able to stay black if a script fails to run.
 * See globals.css for the keyframes.
 *
 * No client state of its own, so this stays a Server Component — the portrait
 * `Image` is the LCP element and paints without waiting on JS. The only
 * client islands are the magnetic button wrappers. (An ambient WebGL fluid
 * layer sat behind the portrait here previously; removed — it could drift out
 * of alignment with the photo's focal point across viewport widths and
 * partially cover the subject, which isn't acceptable for a portrait.)
 */
export function Hero() {
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      {/* The portrait is 3:4. On a wide viewport `object-cover` crops top and
          bottom, so the focal point is nudged up to keep his head clear of the
          title block. On phones the frame is taller than the image, so the
          composition survives almost intact at object-center. */}
      <Image
        src="/media/portrait/front-medium.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-center md:object-[50%_36%]"
      />

      {/* Scrim. Bottom-up black only: the photograph already carries the red, so
          a red wash on top of it just flattens the contrast. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/55 to-background/20 md:via-background/45 md:to-background/10"
      />
      {/* Light fall-off behind the title block, left side only. Kept low so the
          set stays visible through the type rather than going flat black. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent md:from-background/55"
      />

      <div aria-hidden className="hero-curtain absolute inset-0 bg-background" />

      <Container className="relative flex min-h-[100dvh] flex-col justify-end pb-16 md:pb-20 lg:pb-24">
        <p className="hero-rise t-label mb-6 text-red" style={{ "--rise-delay": "0.9s" } as React.CSSProperties}>
          Applied AI &amp; Automation Engineer
        </p>

        <h1
          className="hero-rise t-display max-w-[20ch] text-foreground"
          style={{ "--rise-delay": "1.05s" } as React.CSSProperties}
        >
          Yahya
          <br />
          Kashkoush
        </h1>

        <p
          className="hero-rise t-body mt-7 max-w-[46ch] text-fg-2"
          style={{ "--rise-delay": "1.25s" } as React.CSSProperties}
        >
          I build AI products, SaaS platforms and automation systems, end to end.
        </p>

        <div
          className="hero-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          style={{ "--rise-delay": "1.4s" } as React.CSSProperties}
        >
          <Magnetic className="w-full sm:w-auto">
            <Action href="/#work" variant="solid" block direction="down" className="sm:w-auto">
              Selected work
            </Action>
          </Magnetic>
          <Magnetic className="w-full sm:w-auto">
            <Action href="/#contact" variant="outline" block direction="down" className="sm:w-auto">
              Contact
            </Action>
          </Magnetic>
        </div>
      </Container>
    </section>
  );
}
