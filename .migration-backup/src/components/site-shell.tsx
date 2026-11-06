"use client";

import { usePathname } from "next/navigation";
import { CursorAccent, Grain } from "@/components/atmosphere";
import { ScrollProgress } from "@/components/motion";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const admin = usePathname()?.startsWith("/admin");
  return <>
    {!admin && <><Grain /><CursorAccent /><ScrollProgress /><Nav /></>}
    <main id="main">{children}</main>
    {!admin && <Footer />}
  </>;
}
