import { StartExperience } from "@/components/start/start-experience";
import { startCopy } from "@/content/inquiry";
import { usePageTitle } from "@/lib/compat/title";

export default function StartPage() {
  usePageTitle(startCopy.title, "Prepare a project brief and propose a time to talk.");
  return <StartExperience />;
}
