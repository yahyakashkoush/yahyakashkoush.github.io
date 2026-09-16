import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Container, Kicker, SectionHeading } from "@/components/primitives";
import { Reveal } from "@/components/motion";
import { capabilities } from "@/content/profile";

/**
 * Around 130 skills across nine groups. A flat list would be a data dump, so
 * the taxonomy collapses: group titles carry the signal, items sit one tap in.
 * First group opens by default so the section is never a wall of closed rows.
 */
export function Capabilities() {
  return (
    <section id="capabilities" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="mb-12 flex flex-col gap-4 md:mb-16">
          <Kicker>Capabilities</Kicker>
          <SectionHeading className="max-w-[20ch]">What I work with.</SectionHeading>
        </div>

        <Reveal>
          <Accordion type="multiple" defaultValue={[capabilities[0].title]} className="border-t border-line">
            {capabilities.map((group) => (
              <AccordionItem key={group.title} value={group.title} className="border-b border-line">
                <AccordionTrigger className="group/accordion-trigger t-sub w-full items-center py-6 text-left text-foreground transition-colors duration-300 hover:text-red data-[state=open]:text-foreground md:py-7 [&>svg]:size-4 [&>svg]:text-fg-3">
                  {group.title}
                </AccordionTrigger>
                <AccordionContent className="pb-8">
                  <ul className="flex flex-wrap gap-x-6 gap-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="t-meta text-fg-3 transition-colors duration-300 hover:text-foreground">
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
