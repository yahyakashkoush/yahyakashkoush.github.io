
import { useLocation } from "wouter";
import { ScrollProgress } from "@/components/motion";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SectionTrail } from "@/components/section-trail";
import { SiteSmoke } from "@/components/site-smoke";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const admin = location.startsWith("/admin");
  return <div className="relative isolate min-h-dvh">
    {!admin && <SiteSmoke />}
    <div className="relative z-10">
    {!admin && <><ScrollProgress /><Nav /></>}
    <main id="main">{children}</main>
    {location === "/" && <SectionTrail />}
    {!admin && <Footer />}
    </div>
  </div>;
}
