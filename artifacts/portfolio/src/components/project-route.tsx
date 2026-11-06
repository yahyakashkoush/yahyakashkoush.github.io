import { useSearch } from "wouter";
import { CaseStudyContent } from "@/components/case-study";
export function ProjectRoute() {
  return <CaseStudyContent slug={new URLSearchParams(useSearch()).get("project") || ""} />;
}
