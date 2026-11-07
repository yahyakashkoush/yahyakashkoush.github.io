import Link from "@/lib/compat/link";
import Image from "@/lib/compat/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Container, Kicker, Rule, SectionHeading } from "@/components/primitives";
import { RevealGroup, RevealItem } from "@/components/motion";
import { usePortfolio, projectHref } from "@/components/content-provider";

/** Real project previews remain visible without relying on mouse hover. */
export function Work() {
  const { content: { projects, work } } = usePortfolio();

  return (
    <section id="work" className="scroll-mt-24 pt-24 md:pt-32 lg:pt-40">
      <Container>
        <div className="mb-12 flex flex-col gap-4 md:mb-16">
          <Kicker>{work.label}</Kicker>
          <SectionHeading className="max-w-[18ch]">{work.title}</SectionHeading>
        </div>
      </Container>
      <Rule />
      <RevealGroup>
        {projects.map((project) => {
          const shot = project.media.preview ?? project.media.gallery[0];
          return (
          <RevealItem key={project.slug}>
            <Link
              href={projectHref(project.slug)}
              className="group block border-b border-line transition-colors duration-300 hover:bg-surface focus-visible:bg-surface"
            >
              <Container>
                <div className="flex items-center gap-4 py-7 md:gap-8 md:py-10 lg:py-12">
                  <span className="t-label hidden shrink-0 text-red sm:block">{project.index}</span>
                  {shot && (
                      <div className="flex aspect-[4/3] w-20 shrink-0 items-center justify-center border border-line bg-surface p-2 transition-colors group-hover:border-line-red md:w-40">
                        <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="(max-width: 768px) 80px, 160px" className="max-h-24 w-auto max-w-full object-contain" />
                      </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="t-sub text-foreground">{project.title}</h3>
                    <p className="t-caption mt-1.5 max-w-[52ch]">{project.subtitle}</p>
                  </div>
                  <span className="t-meta hidden shrink-0 text-fg-3 lg:block">{project.year ?? ""}</span>
                  <ArrowUpRight
                    weight="bold"
                    className="size-4 shrink-0 self-center text-fg-3 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red"
                  />
                </div>
              </Container>
            </Link>
          </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
