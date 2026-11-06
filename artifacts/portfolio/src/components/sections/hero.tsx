
import Image from "@/lib/compat/image";
import { usePortfolio } from "@/components/content-provider";
import { Action, Container } from "@/components/primitives";

/**
 * A still portrait with a clear title card and restrained entrance.
 *
 * A single still, no video. The entrance is CSS rather than Motion because this
 * block holds the LCP element: it has to paint without waiting on JS.
 * See globals.css for the keyframes.
 *
 * No client state of its own, so this stays a Server Component — the portrait
 * `Image` is still the LCP element and paints without waiting on JS.
 */
export function Hero() {
  const { content: { hero } } = usePortfolio();
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      {/* The portrait is 3:4. On a wide viewport `object-cover` crops top and
          bottom, so the focal point is nudged up to keep his head clear of the
          title block. On phones the frame is taller than the image, so the
          composition survives almost intact at object-center. */}
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-center grayscale md:object-[50%_36%]"
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

      <Container className="relative flex min-h-[100dvh] flex-col justify-end pb-16 md:pb-20 lg:pb-24">
        <p className="t-label mb-6 text-red">
          {hero.role}
        </p>

        <h1
          className="t-display max-w-[20ch] text-foreground"
        >
          <span className="whitespace-pre-line">{hero.heading}</span>
        </h1>

        <p
          className="t-body mt-7 max-w-[46ch] text-fg-2"
        >
          {hero.description}
        </p>

        <div
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <Action href={hero.primaryHref} variant="solid" block direction="down" className="w-full sm:w-auto">
            {hero.primaryLabel}
          </Action>
          <Action href={hero.secondaryHref} variant="outline" block direction="down" className="w-full sm:w-auto">
            {hero.secondaryLabel}
          </Action>
        </div>
      </Container>
    </section>
  );
}
