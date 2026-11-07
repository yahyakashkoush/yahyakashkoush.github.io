import { usePortfolio } from "@/components/content-provider";
import { Action, Container } from "@/components/primitives";
import { CrtMonitor } from "@/components/crt-monitor";
import { LiquidEther } from "@/components/liquid-ether";
import { AutomationFlow } from "@/components/automation-flow";

/** The original systems reel accompanies the introduction, without portraits. */
export function Hero() {
  const { content: { hero, cinematic } } = usePortfolio();
  return (
    <section id="intro" className="relative isolate w-full overflow-hidden border-b border-line">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden opacity-40 mix-blend-screen md:block">
        <LiquidEther
          colors={["#171717", "#87939f", "#292929"]}
          mouseForce={12}
          cursorSize={100}
          resolution={0.35}
          iterationsPoisson={20}
          autoDemo
          autoSpeed={0.3}
          autoIntensity={1.5}
          autoResumeDelay={2400}
          autoRampDuration={0.8}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/35" />
      <Container className="relative z-10 grid min-h-[86dvh] items-center gap-14 pt-32 pb-16 md:pt-40 md:pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="min-w-0">
          <p className="hero-rise t-label mb-6 flex items-center gap-3 text-red" data-testid="text-hero-role">
            {hero.role}
          </p>

          <h1 className="hero-rise t-display max-w-[18ch] text-foreground lg:text-[clamp(3.75rem,6.2vw,6.5rem)]" style={{ ["--rise-delay" as string]: "0.08s" }}>
            <span className="whitespace-pre-line">{hero.heading}</span>
          </h1>

          <p className="hero-rise t-body mt-7 max-w-[46ch] text-fg-2" style={{ ["--rise-delay" as string]: "0.16s" }}>
            {hero.description}
          </p>

          <div className="hero-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4" style={{ ["--rise-delay" as string]: "0.24s" }}>
            <Action href={hero.primaryHref} variant="solid" block direction="down" className="w-full sm:w-auto">
              {hero.primaryLabel}
            </Action>
            <Action href={hero.secondaryHref} variant="outline" block direction="down" className="w-full sm:w-auto">
              {hero.secondaryLabel}
            </Action>
          </div>

          <AutomationFlow className="hero-rise mt-12 max-w-[30rem]" />
        </div>
        <div className="hero-rise min-w-0 lg:pl-4" style={{ ["--rise-delay" as string]: "0.3s" }}>
          <CrtMonitor clip={cinematic.crtReel} caption={cinematic.crtReel.caption} embedded className="max-w-[540px]" />
        </div>
      </Container>
    </section>
  );
}
