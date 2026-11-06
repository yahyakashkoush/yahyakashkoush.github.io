"use client";

import { Hero } from "@/components/sections/hero";
import { Work } from "@/components/sections/work";
import { About } from "@/components/sections/about";
import { Experience } from "@/components/sections/experience";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { CinematicCut } from "@/components/video";
import { CrtMonitor } from "@/components/crt-monitor";
import { usePortfolio } from "@/components/content-provider";

/**
 * Two cuts, placed where the footage earns them:
 *
 *   Hero            hero.mp4          push-in on the subject
 *   Selected Work
 *   [ cut ]         ai-transition.mp4 abstract travel, no subject. Work to person.
 *   About           close-up.mp4      the identity beat, inside the section
 *   Experience
 *   Capabilities
 *   [ CRT monitor ] crt-reel.mp4      intro → manual chaos → AI organising it → automated result
 *   Contact
 *
 * Deliberately not a cut between every section: three or more would turn the
 * page back into section/video/section/video.
 */
export default function Home() {
  const { content: { cinematic } } = usePortfolio();
  return (
    <>
      <Hero />
      <Work />
      <CinematicCut clip={cinematic.chapterWork} caption={cinematic.chapterWork.caption} className="mt-24 md:mt-32 lg:mt-40" />
      <About />
      <Experience />
      <Capabilities />
      <CrtMonitor clip={cinematic.crtReel} caption={cinematic.crtReel.caption} />
      <Contact />
    </>
  );
}
