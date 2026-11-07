
import { usePortfolio } from "@/components/content-provider";
import { Action, Container } from "@/components/primitives";

/** A text-led introduction: no photography or background imagery. */
export function Hero() {
  const { content: { hero } } = usePortfolio();
  return (
    <section className="relative w-full border-b border-line">
      <Container className="flex min-h-[82dvh] flex-col justify-center pt-36 pb-20 md:pt-44 md:pb-24">
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
