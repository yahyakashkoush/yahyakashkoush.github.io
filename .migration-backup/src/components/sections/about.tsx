"use client";

import Image from "next/image";
import { Container, Kicker, Prose, SectionHeading, TextLink } from "@/components/primitives";
import { Parallax, Reveal } from "@/components/motion";
import { usePortfolio } from "@/components/content-provider";

export function About() {
  const { content: { about, site } } = usePortfolio();
  return (
    <section id="about" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
          {/* One still, not a collage and not footage. The 3:4 portrait already
              fits this column, so nothing has to be cropped to make it work. */}
          <Reveal className="md:col-span-5">
            <Parallax distance={28} className="relative aspect-[3/4] w-full">
              <Image
                src={about.image.src}
                alt={about.image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="scale-110 object-cover object-center"
              />
            </Parallax>
          </Reveal>

          <div className="flex flex-col justify-center md:col-span-7 md:pl-4 lg:pl-10">
            <Reveal>
              <Kicker className="mb-5">{about.label}</Kicker>
              <SectionHeading className="mb-8 max-w-[16ch]">{about.title}</SectionHeading>
            </Reveal>
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
