
import { Container, Kicker, Prose, SectionHeading, TextLink } from "@/components/primitives";
import { Reveal } from "@/components/motion";
import { usePortfolio } from "@/components/content-provider";

export function About() {
  const { content: { about, site } } = usePortfolio();
  return (
    <section id="about" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="grid grid-cols-1 gap-10 border-t border-line pt-10 md:grid-cols-12 md:gap-16 md:pt-14">
          <div className="md:col-span-5">
            <Reveal>
              <Kicker className="mb-5">{about.label}</Kicker>
              <SectionHeading className="max-w-[16ch]">{about.title}</SectionHeading>
            </Reveal>
          </div>
          <div className="md:col-span-7 md:pt-10">
            <Reveal delay={0.08}>
              <Prose blocks={about.paragraphs} />
            </Reveal>
            <Reveal delay={0.16}>
              <div className="mt-10">
                <TextLink href={site.linkedin} external className="t-meta">
                  {about.linkLabel}
                </TextLink>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
