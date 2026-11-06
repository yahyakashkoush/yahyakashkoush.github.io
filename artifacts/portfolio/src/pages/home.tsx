import { Hero } from "@/components/sections/hero";
import { Work } from "@/components/sections/work";
import { About } from "@/components/sections/about";
import { Experience } from "@/components/sections/experience";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { usePageTitle } from "@/lib/compat/title";

export default function Home() {
  usePageTitle();
  return (
    <>
      <Hero />
      <Work />
      <About />
      <Experience />
      <Capabilities />
      <Contact />
    </>
  );
}
