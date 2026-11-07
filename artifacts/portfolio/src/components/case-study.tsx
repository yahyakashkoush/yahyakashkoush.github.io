import Link from "@/lib/compat/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Container, Kicker, Prose, Rule, SectionHeading, Tag, TextLink } from "@/components/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { Gallery } from "@/components/gallery";
import { usePortfolio, projectHref } from "@/components/content-provider";
import type { CmsProject } from "@/lib/content-schema";
import { cn } from "cn";

export function CaseStudyContent({ slug }: { slug: string }) {
  const { content: { projects }, loading } = usePortfolio();
  const index = projects.findIndex(p => p.slug === slug);
  const project = projects[index];
  if (!project) return <Container className="py-40"><h1 className="t-section">{loading ? "Loading project…" : "Project not found"}</h1><Link href="/#work">View all projects</Link></Container>;
  const prev = projects.length > 1 ? projects[(index - 1 + projects.length) % projects.length] : null;
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const lead = project.media.preview ?? project.media.gallery[0] ?? null;
  const rest = project.media.gallery.filter((shot) => shot.src !== lead?.src);
  // The first challenge and outcome lines lead the page; the sections below carry the rest.
  const challenge = project.challenge.filter((p) => p.trim());
  const outcome = project.outcome.filter((p) => p.trim());
  const problem = challenge[0] ?? project.summary;
  const result = outcome[0] ?? null;
  const moreChallenge = challenge.slice(1);
  const moreOutcome = outcome.slice(1);
  return (
    <article>
      {/* Hero -------------------------------------------------------------- */}
      <header className="flex flex-col justify-end pt-28 pb-10 md:pt-40 md:pb-14">
        <Container>
          <Reveal y={16}>
            <p className="t-label mb-6 text-red">
              {project.index}
              {project.date ? ` / ${project.date}` : ""}
            </p>
            <h1 className="t-display max-w-[14ch] text-foreground">{project.title}</h1>
            <p className="t-sub mt-6 max-w-[40ch] text-fg-2">{project.subtitle}</p>
          </Reveal>
        </Container>
      </header>

      {/* Lead screenshot: one frame before the explanation. ---------------- */}
      {lead && (
        <Container>
          <Reveal>
            <Gallery items={[lead]} title={project.title} />
          </Reveal>
        </Container>
      )}

      {/* At a glance: role, problem, result. ------------------------------- */}
      <section className="pt-14 md:pt-20">
        <Container>
          <Reveal>
            <dl className={cn("grid grid-cols-1 gap-px border border-line bg-line", result ? "md:grid-cols-3" : "md:grid-cols-2")}>
              <Glance label="Role" value={project.role} />
              <Glance label="Problem" value={problem} />
              {result && <Glance label="Result" value={result} accent />}
            </dl>
          </Reveal>
        </Container>
      </section>

      {/* Overview ---------------------------------------------------------- */}
      <section className="pt-20 md:pt-28">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
            <Reveal className="md:col-span-4">
              <dl className="flex flex-col gap-7 md:sticky md:top-28">
                {project.year && <Meta label="Year" value={project.year} />}
                {project.links.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <dt className="t-label text-fg-3">Links</dt>
                    <dd className="flex flex-col items-start gap-2.5">
                      {project.links.map((l) => (
                        <TextLink key={l.href} href={l.href} external className="t-meta">
                          {l.label}
                        </TextLink>
                      ))}
                    </dd>
                  </div>
                )}
                {project.credits?.map((c) => <Meta key={c} label="Credit" value={c} />)}
              </dl>
            </Reveal>

            <Reveal delay={0.08} className="md:col-span-8">
              <Kicker as="h2" className="mb-5">Overview</Kicker>
              <Prose blocks={project.overview} />
            </Reveal>
          </div>
        </Container>
      </section>

      {moreChallenge.length > 0 && <Block title="Challenge"><Prose blocks={moreChallenge} /></Block>}

      {/* Approach ---------------------------------------------------------- */}
      {project.approach.length > 0 && (
        <Block title="Approach">
          <Prose blocks={project.approach} />
        </Block>
      )}

      {/* Architecture ------------------------------------------------------ */}
      {project.architecture && (
        <section className="pt-20 md:pt-28">
          <Container>
            <Reveal>
              <Kicker as="h2" className="mb-6">Architecture</Kicker>
              {/* The pipeline reads as one line, so the box scrolls rather than
                  wrapping. tabIndex makes that scroll keyboard-reachable
                  (WCAG 2.1.1), and the label names the region for screen readers. */}
              <p
                tabIndex={0}
                role="region"
                aria-label="Architecture pipeline"
                className="t-meta overflow-x-auto border border-line p-6 whitespace-nowrap text-fg-2 md:p-8"
              >
                {project.architecture}
              </p>
            </Reveal>
          </Container>
        </section>
      )}

      {/* Capabilities ------------------------------------------------------ */}
      {project.capabilities.length > 0 && (
        <section className="pt-20 md:pt-28">
          <Container>
            <Reveal>
              <Kicker as="h2" className="mb-10">Capabilities</Kicker>
            </Reveal>
            <RevealGroup className="grid grid-cols-1 gap-px bg-line md:grid-cols-2">
              {project.capabilities.map((c) => (
                <RevealItem key={c.label} className="bg-background">
                  <div className="flex h-full flex-col gap-3 p-6 transition-colors duration-500 hover:bg-surface md:p-8">
                    <h3 className="t-sub text-foreground">{c.label}</h3>
                    <p className="t-body max-w-[52ch]">{c.body}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>
      )}

      {rest.length > 0 && (
        <section className="pt-20 md:pt-28">
          <Container>
            <Reveal>
              <Kicker as="h2" className="mb-10">Interface</Kicker>
            </Reveal>
            <Gallery items={rest} title={project.title} />
          </Container>
        </section>
      )}

      {/* Outcome ----------------------------------------------------------- */}
      {moreOutcome.length > 0 && (
        <section className="pt-20 md:pt-28">
          <Container>
            <Reveal>
              <Kicker as="h2" className="mb-6">Outcome</Kicker>
              <ul className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
                {moreOutcome.map((o, i) => (
                  <li key={o} className="flex gap-4 bg-background p-6 md:p-8">
                    <span className="t-label shrink-0 pt-1 text-red">{String(i + 2).padStart(2, "0")}</span>
                    <p className="t-body max-w-[52ch] text-fg-2">{o}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </Container>
        </section>
      )}

      {/* Stack ------------------------------------------------------------- */}
      <section className="pt-20 md:pt-28">
        <Container>
          <Reveal>
            <Kicker as="h2" className="mb-8">Stack</Kicker>
            <ul className="flex flex-wrap gap-2.5">
              {project.stack.map((s) => (
                <li key={s}>
                  <Tag>{s}</Tag>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* Prev / next ------------------------------------------------------- */}
      <nav aria-label="Case studies" className="mt-24 md:mt-32">
        <Rule />
        <div className="grid grid-cols-1 md:grid-cols-2">
          {prev && <Adjacent project={prev} direction="prev" />}
          {next && <Adjacent project={next} direction="next" />}
        </div>
        <Rule />
      </nav>

      <Container>
        <div className="py-10">
          <TextLink href="/#work" arrow={false} className="t-meta text-fg-3">
            All work
          </TextLink>
        </div>
      </Container>
    </article>
  );
}

function Glance({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-3 bg-background p-6 md:p-7">
      <dt className="t-label text-fg-3">{label}</dt>
      <dd className={cn("t-body max-w-[40ch]", accent ? "text-foreground" : "text-fg-2")}>{value}</dd>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="t-label text-fg-3">{label}</dt>
      <dd className="t-meta text-fg-2">{value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-20 md:pt-28">
      <Container>
        <Reveal>
          <Kicker as="h2" className="mb-5">{title}</Kicker>
          {children}
        </Reveal>
      </Container>
    </section>
  );
}

function Adjacent({
  project,
  direction,
}: {
  project: CmsProject;
  direction: "prev" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={projectHref(project.slug)}
      className="group flex flex-col gap-3 border-b border-line p-8 transition-colors duration-500 last:border-b-0 hover:bg-surface md:border-b-0 md:p-12 md:[&+&]:border-l"
    >
      <span className="t-label flex items-center gap-2.5 text-fg-3">
        {!isNext && (
          <ArrowLeft
            weight="bold"
            className="size-3 transition-transform duration-300 group-hover:-translate-x-0.5"
          />
        )}
        {isNext ? "Next" : "Previous"}
        {isNext && (
          <ArrowRight
            weight="bold"
            className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        )}
      </span>
      <SectionHeading as="h3" className="text-foreground transition-colors duration-300 group-hover:text-red">
        {project.title}
      </SectionHeading>
    </Link>
  );
}
