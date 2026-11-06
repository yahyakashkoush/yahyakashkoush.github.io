
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { usePortfolio } from "@/components/content-provider";
import { Magnetic } from "@/components/motion";

/**
 * A direct, quiet introduction. Moving into the brief is a simple page
 * transition; no envelope illustration or staged opening sequence.
 */
export function Intro({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const { content: { start: startCopy } } = usePortfolio();

  return (
    <section className="mx-auto w-full max-w-[52rem] border-t border-line pt-8 sm:pt-12">
      <p className="t-label mb-6 text-red">{startCopy.label}</p>
      <h1 className="t-hero mb-6 max-w-[12ch] text-foreground">{startCopy.title}</h1>
      <p className="t-body mb-10 max-w-[42ch] text-fg-2">{startCopy.lede}</p>
      <div className="border-t border-line pt-6">
        <Magnetic>
          <button
            type="button"
            onClick={onOpen}
            className="group t-nav inline-flex min-h-12 items-center justify-center gap-3 border border-foreground px-7 text-foreground transition-[background-color,color,border-color,transform] duration-300 hover:bg-foreground hover:text-background active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {startCopy.cta}
            <ArrowRight weight="bold" className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </Magnetic>
      </div>
    </section>
  );
}
