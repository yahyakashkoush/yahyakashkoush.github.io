
import { usePortfolio } from "@/components/content-provider";
import { Action, Container } from "@/components/primitives";
import { CrtMonitor } from "@/components/crt-monitor";
import { LiquidEther } from "@/components/liquid-ether";

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
      <Container className="relative z-10 grid min-h-[82dvh] items-center gap-16 pt-36 pb-20 md:pt-44 md:pb-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
        <p className="t-label mb-6 text-red">
          {hero.role}
        </p>

        <h1
          className="t-display max-w-[20ch] text-foreground lg:text-[clamp(4rem,7vw,7rem)]"
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
        </div>
        <CrtMonitor
          clip={cinematic.crtReel}
          caption={cinematic.crtReel.caption}
          embedded
          className="max-w-[560px] justify-self-center"
        />
      </Container>
    </section>
  );
}
