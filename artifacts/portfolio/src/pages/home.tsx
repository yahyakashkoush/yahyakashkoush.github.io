import { Hero } from "@/components/sections/hero";
import { Work } from "@/components/sections/work";
import { About } from "@/components/sections/about";
import { Experience } from "@/components/sections/experience";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { CinematicCut } from "@/components/video";
import { CrtMonitor } from "@/components/crt-monitor";
import { usePortfolio } from "@/components/content-provider";
import { usePageTitle } from "@/lib/compat/title";

export default function Home() {
  usePageTitle();
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
