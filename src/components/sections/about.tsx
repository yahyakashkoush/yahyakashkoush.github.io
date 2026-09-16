import Image from "next/image";
import { Container, Kicker, Prose, SectionHeading, TextLink } from "@/components/primitives";
import { Parallax, Reveal } from "@/components/motion";
import { about } from "@/content/profile";
import { site } from "@/content/site";

export function About() {
  return (
    <section id="about" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
          {/* One still, not a collage and not footage. The 3:4 portrait already
              fits this column, so nothing has to be cropped to make it work. */}
          <Reveal className="md:col-span-5">
            <Parallax distance={28} className="relative aspect-[3/4] w-full">
              <Image
                src="/media/portrait/close-up.jpg"
                alt="Portrait lit from one side in deep red"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="scale-110 object-cover object-center"
              />
            </Parallax>
          </Reveal>

          <div className="flex flex-col justify-center md:col-span-7 md:pl-4 lg:pl-10">
            <Reveal>
              <Kicker className="mb-5">About</Kicker>
              <SectionHeading className="mb-8 max-w-[16ch]">Architecture, not just models.</SectionHeading>
            </Reveal>
            <Reveal delay={0.08}>
              <Prose blocks={about} />
            </Reveal>
            <Reveal delay={0.16}>
              <div className="mt-10">
                <TextLink href={site.linkedin} external className="t-meta">
                  LinkedIn
                </TextLink>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
