import { useParams } from "wouter";
import { getProject } from "@/content/projects";
import { CaseStudyContent } from "@/components/case-study";
import { usePageTitle } from "@/lib/compat/title";

export default function CaseStudy() {
  const { slug = "" } = useParams<{ slug: string }>();
  const p = getProject(slug);
  usePageTitle(p?.title, p?.summary);
  return <CaseStudyContent slug={slug} />;
}
