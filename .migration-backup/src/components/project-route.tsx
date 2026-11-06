"use client";
import { useSearchParams } from "next/navigation";
import { CaseStudyContent } from "@/components/case-study";
export function ProjectRoute() {
  return <CaseStudyContent slug={useSearchParams().get("project") || ""} />;
}
