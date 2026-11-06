
import { useLocation } from "wouter";
import { CursorAccent, Grain } from "@/components/atmosphere";
import { ScrollProgress } from "@/components/motion";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const admin = useLocation()[0].startsWith("/admin");
  return <>
    {!admin && <><Grain /><CursorAccent /><ScrollProgress /><Nav /></>}
    <main id="main">{children}</main>
    {!admin && <Footer />}
  </>;
}
