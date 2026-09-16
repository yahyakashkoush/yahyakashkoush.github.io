import type { Metadata } from "next";
import { StartExperience } from "@/components/start/start-experience";
import { startCopy } from "@/content/inquiry";

export const metadata: Metadata = {
  title: startCopy.title,
  description: "Prepare a project brief and propose a time to talk.",
  openGraph: {
    title: `${startCopy.title} — Yahya Kashkoush`,
    description: "Prepare a project brief and propose a time to talk.",
    images: [{ url: "/media/object/envelope-sealed.webp", width: 1600, height: 856 }],
  },
};

export default function StartPage() {
  return <StartExperience />;
}
