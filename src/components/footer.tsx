"use client";

import Link from "next/link";
import { Container, Rule } from "@/components/primitives";
import { usePortfolio } from "@/components/content-provider";

export function Footer() {
  const { content: { navigation: nav, site } } = usePortfolio();
  return (
    <footer className="pt-20">
      <Rule />
      <Container>
        <div className="grid grid-cols-2 gap-10 py-12 md:grid-cols-4 md:py-16">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-2">
            <span className="t-nav text-foreground">{site.name}</span>
            <span className="t-caption max-w-[32ch]">{site.role}</span>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="t-meta inline-flex min-h-6 items-center py-1 text-fg-3 transition-colors duration-300 hover:text-red">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <a
              href={`mailto:${site.email}`}
              className="t-meta inline-flex min-h-6 items-center py-1 break-all text-fg-3 transition-colors duration-300 hover:text-red"
            >
              Email
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className="t-meta inline-flex min-h-6 items-center py-1 text-fg-3 transition-colors duration-300 hover:text-red"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </Container>
      <Rule />
      <Container>
        <p className="t-label py-6 text-fg-3">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </Container>
    </footer>
  );
}
