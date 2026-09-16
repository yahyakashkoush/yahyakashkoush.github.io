import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container, Kicker, Prose, Rule, SectionHeading, Tag, TextLink } from "@/components/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { Gallery } from "@/components/gallery";
import { adjacentProjects, getProject, projects } from "@/content/projects";
import { getProjectMedia } from "@/content/media";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  // Share card uses this project's own screenshot when one exists; otherwise it
  // inherits the site default rather than borrowing another project's art.
  const preview = getProjectMedia(slug).preview;
  return {
    title: `${project.title} - ${project.subtitle}`,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      ...(preview
        ? { images: [{ url: preview.src, width: preview.width, height: preview.height }] }
        : {}),
    },
  };
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { prev, next } = adjacentProjects(slug);
  const media = getProjectMedia(slug);

  return (
    <article>
      {/* Hero -------------------------------------------------------------- */}
      {/* A title card, not an image. The cinematic photography belongs to the
          person, not to any product, and a screenshot under a scrim would be
          unreadable. Each project's own captures appear in Interface below,
          shown whole. */}
      <header className="flex min-h-[58vh] flex-col justify-end pt-32 pb-12 md:min-h-[66vh] md:pt-40 md:pb-16">
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
      <Rule />

      {/* Overview ---------------------------------------------------------- */}
      <section className="pt-20 md:pt-28">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
            <Reveal className="md:col-span-4">
              <dl className="flex flex-col gap-7 md:sticky md:top-28">
                <Meta label="Role" value={project.role} />
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

      {/* Approach ---------------------------------------------------------- */}
      {project.approach && (
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
      {project.capabilities && (
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

      {/* Interface --------------------------------------------------------- */}
      {/* Rendered only when this project has its own screenshots. Nothing is
          substituted when it does not. */}
      {media.gallery.length > 0 && (
        <section className="pt-20 md:pt-28">
          <Container>
            <Reveal>
              <Kicker as="h2" className="mb-10">Interface</Kicker>
            </Reveal>
            <Gallery items={media.gallery} title={project.title} />
          </Container>
        </section>
      )}

      {/* Outcome ----------------------------------------------------------- */}
      {project.outcome && (
        <Block title="Outcome">
          <Prose blocks={project.outcome} />
        </Block>
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
  project: (typeof projects)[number];
  direction: "prev" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/work/${project.slug}`}
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
