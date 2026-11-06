
import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { usePortfolio } from "@/components/content-provider";
import { Envelope, LetterSheet } from "@/components/start/envelope";

/**
 * A compact, image-free invitation. The letter's animation completion opens
 * the form, so a slow device cannot move the view halfway through the fold.
 */
export function Intro({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const { content: { start: startCopy } } = usePortfolio();
  const [opening, setOpening] = useState(false);

  return (
    <section className="mx-auto w-full max-w-[52rem] border-t border-line pt-8 sm:pt-12" aria-busy={opening}>
      <div className="grid items-center gap-10 md:grid-cols-[1fr_16rem] md:gap-12">
      <div>
      <p className="t-label mb-6 text-red">{startCopy.label}</p>
      <h1 className="t-hero mb-6 max-w-[12ch] text-foreground">{startCopy.title}</h1>
      <p className="t-body mb-10 max-w-[42ch] text-fg-2">{startCopy.lede}</p>
      <div className="border-t border-line pt-6">
          <button
            type="button"
            onClick={() => setOpening(true)}
            disabled={opening}
            className="group t-nav inline-flex min-h-12 items-center justify-center gap-3 border border-foreground px-7 text-foreground transition-[background-color,color,border-color,transform] duration-300 hover:bg-foreground hover:text-background active:translate-y-px disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {opening ? "Opening your brief" : startCopy.cta}
            <ArrowRight weight="bold" className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
      </div>
      </div>
      <div className="mx-auto w-full max-w-[16rem] pt-16 md:pt-0">
        <Envelope
          state={opening ? "open" : "closed"}
          sealed={!opening}
          letter={<LetterSheet />}
          letterOut={opening}
          onLetterComplete={() => { if (opening) onOpen(); }}
        />
      </div>
      </div>
    </section>
  );
}
