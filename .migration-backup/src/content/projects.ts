import projectData from "./projects.json";

/**
 * Case studies. Every string here comes from _source/cv.txt or the project's
 * own _source/projects/<slug>/details.txt.
 *
 * Optional fields are genuinely optional: a project renders only the sections
 * its source material supports. Nothing is padded to match a template.
 */

export type ProjectLink = { label: string; href: string };

export type Project = {
  slug: string;
  index: string;
  title: string;
  subtitle: string;
  /** Null where cv.txt gives no date. Never guessed. */
  year: string | null;
  date: string | null;
  role: string;
  summary: string;
  overview: string[];
  challenge?: string[];
  approach?: string[];
  capabilities?: { label: string; body: string }[];
  architecture?: string;
  outcome?: string[];
  stack: string[];
  credits?: string[];
  links: ProjectLink[];
};

export const projects: Project[] = projectData;


export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

/** Wraps around, so the last case study leads back to the first. */
export const adjacentProjects = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
};
