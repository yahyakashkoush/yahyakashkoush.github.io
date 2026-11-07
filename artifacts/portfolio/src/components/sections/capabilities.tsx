import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Container, Kicker, SectionHeading } from "@/components/primitives";
import { Reveal } from "@/components/motion";
import { usePortfolio } from "@/components/content-provider";
import "@/components/automation-flow.css";

/** Grouped skill taxonomy: indexed titles carry the signal, items sit one tap in. */
export function Capabilities() {
  const { content: { capabilities } } = usePortfolio();
  return (
    <section id="capabilities" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="mb-12 flex flex-col gap-4 md:mb-16">
          <Kicker>{capabilities.label}</Kicker>
          <SectionHeading className="max-w-[20ch]">{capabilities.title}</SectionHeading>
        </div>

        <Reveal>
          <Accordion type="multiple" defaultValue={capabilities.groups[0] ? [capabilities.groups[0].title] : []} className="border-t border-line">
            {capabilities.groups.map((group, i) => (
              <AccordionItem key={group.title} value={group.title} className="border-b border-line" data-testid={`capability-group-${i}`}>
                <AccordionTrigger className="group/accordion-trigger t-sub w-full items-center py-6 text-left text-foreground transition-colors duration-300 hover:text-red hover:no-underline data-[state=open]:text-foreground md:py-7 [&>svg]:size-4 [&>svg]:text-fg-3">
                  <span className="flex items-baseline gap-5">
                    <span className="t-label w-6 shrink-0 text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                    <span>{group.title}</span>
                    <span className="t-label cap-count hidden sm:inline">{group.items.length}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-8 sm:pl-11">
                  <ul className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li key={item} className="t-meta border border-line px-3 py-2 text-fg-2 transition-colors duration-300 hover:border-line-red hover:text-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </section>
  );
}
