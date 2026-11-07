import { usePortfolio } from "@/components/content-provider";
import { Action, Container } from "@/components/primitives";
import { CrtMonitor } from "@/components/crt-monitor";
import { AutomationFlow } from "@/components/automation-flow";

/** The original systems reel accompanies the introduction, without portraits. */
export function Hero() {
  const { content: { hero, cinematic } } = usePortfolio();
  return (
    <section id="intro" className="relative isolate w-full overflow-hidden border-b border-line">
      <Container className="relative z-10 grid items-center gap-10 pt-24 pb-12 md:pt-36 md:pb-20 lg:min-h-[86dvh] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 lg:pt-40 lg:pb-24">
        <div className="min-w-0">
          <p className="hero-rise t-label mb-6 flex items-center gap-3 text-red" data-testid="text-hero-role">
            {hero.role}
          </p>

          <h1 className="hero-rise t-display max-w-[18ch] text-foreground lg:text-[clamp(3.75rem,6.2vw,6.5rem)]" style={{ ["--rise-delay" as string]: "0.08s" }}>
            <span className="whitespace-pre-line">{hero.heading}</span>
          </h1>

          <p className="hero-rise t-body mt-6 max-w-[50ch] text-fg-2 md:mt-7" style={{ ["--rise-delay" as string]: "0.16s" }}>
            {hero.description}
          </p>

          <div className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-10" style={{ ["--rise-delay" as string]: "0.24s" }}>
            <Action href={hero.primaryHref} variant="solid" block direction="down" className="w-full sm:w-auto">
              {hero.primaryLabel}
            </Action>
            <Action href={hero.secondaryHref} variant="outline" block direction="down" className="w-full sm:w-auto">
              {hero.secondaryLabel}
            </Action>
          </div>

          <AutomationFlow className="hero-rise mt-10 hidden max-w-[30rem] md:block md:mt-12" />
        </div>
        <div className="hero-rise min-w-0 lg:pl-4" style={{ ["--rise-delay" as string]: "0.3s" }}>
          <CrtMonitor caption={cinematic.crtReel.caption} embedded className="max-w-[540px]" />
        </div>
      </Container>
    </section>
  );
}
