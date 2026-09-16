import { Container, Kicker, SectionHeading } from "@/components/primitives";
import { RevealGroup, RevealItem } from "@/components/motion";
import { timeline } from "@/content/profile";

/**
 * Career arc on a left rail. Four entries, so a plain list is the right
 * component here: no accordion, no cards.
 */
export function Experience() {
  return (
    <section id="experience" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="mb-12 flex flex-col gap-4 md:mb-16">
          <Kicker>Experience</Kicker>
          <SectionHeading className="max-w-[20ch]">From iOS to applied AI.</SectionHeading>
        </div>

        <RevealGroup className="border-l border-line">
          {timeline.map((entry) => (
            <RevealItem key={entry.title}>
              <article className="group relative grid grid-cols-1 gap-3 py-8 pl-6 transition-colors duration-500 md:grid-cols-12 md:gap-8 md:py-10 md:pl-10">
                {/* Node sits on the rail and warms as the row is read. */}
                <span
                  aria-hidden
                  className="absolute top-[2.4rem] -left-[3px] block size-[5px] bg-line-2 transition-colors duration-500 group-hover:bg-red md:top-[2.9rem]"
                />
                <p className="t-meta text-fg-3 md:col-span-3">{entry.period}</p>
                <div className="md:col-span-9">
                  <h3 className="t-sub text-foreground">{entry.title}</h3>
                  {entry.org && <p className="t-meta mt-2 text-red">{entry.org}</p>}
                  {entry.body.length > 0 && (
                    <div className="mt-4 flex max-w-[60ch] flex-col gap-3">
                      {entry.body.map((b, i) => (
                        <p key={i} className="t-body">
                          {b}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
