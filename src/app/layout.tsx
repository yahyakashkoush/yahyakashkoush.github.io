import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteShell } from "@/components/site-shell";
import { site } from "@/content/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} - ${site.role}`,
    template: `%s - ${site.name}`,
  },
  description: site.intro,
  openGraph: {
    title: `${site.name} - ${site.role}`,
    description: site.intro,
    type: "website",
    images: [{ url: "/media/portrait/front-medium.jpg", width: 1089, height: 1445 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` is fixed on the root: the site is dark-locked, with no toggle.
    <html lang="en" className={`dark ${archivo.variable} ${jetbrains.variable}`}>
      <head>
        {/* Scroll reveals ship as inline opacity:0 and are cleared by Motion on
            the client. Without JS the page below the hero would stay blank, so
            force those elements visible instead. */}
        <noscript>
          <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        <TooltipProvider delayDuration={200}>
          <a
            href="#main"
            className="t-nav sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:border focus:border-red focus:bg-background focus:px-4 focus:py-3 focus:text-foreground"
          >
            Skip to content
          </a>
          <SiteShell>{children}</SiteShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
