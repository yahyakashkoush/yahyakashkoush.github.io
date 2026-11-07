
import { useLocation } from "wouter";
import { ScrollProgress } from "@/components/motion";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SectionTrail } from "@/components/section-trail";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const admin = location.startsWith("/admin");
  return <>
    {!admin && <><ScrollProgress /><Nav /></>}
    <main id="main">{children}</main>
    {location === "/" && <SectionTrail />}
    {!admin && <Footer />}
  </>;
}
