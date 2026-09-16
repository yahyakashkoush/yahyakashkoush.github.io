import { Hero } from "@/components/sections/hero";
import { Work } from "@/components/sections/work";
import { About } from "@/components/sections/about";
import { Experience } from "@/components/sections/experience";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { CinematicCut } from "@/components/video";
import { CinematicStill } from "@/components/cinematic-still";
import { cinematic, humanSystemStill } from "@/content/media";

/**
 * Two cuts, placed where the footage earns them:
 *
 *   Hero            hero.mp4          push-in on the subject
 *   Selected Work
 *   [ cut ]         ai-transition.mp4 abstract travel, no subject. Work to person.
 *   About           close-up.mp4      the identity beat, inside the section
 *   Experience
 *   Capabilities
 *   [ still ]       human-system.jpg  wide among monoliths, by request a still not a cut
 *   Contact
 *
 * Deliberately not a cut between every section: three or more would turn the
 * page back into section/video/section/video.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Work />
      <CinematicCut clip={cinematic.chapterWork} caption="The systems behind the work" className="mt-24 md:mt-32 lg:mt-40" />
      <About />
      <Experience />
      <Capabilities />
      <CinematicStill
        clip={humanSystemStill}
        caption="Human first. Technology second."
        className="mt-24 md:mt-32 lg:mt-40"
        fit="contain"
      />
      <Contact />
    </>
  );
}
