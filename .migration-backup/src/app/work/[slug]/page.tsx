import type { Metadata } from "next";
import { projects, getProject } from "@/content/projects";
import { CaseStudyContent } from "@/components/case-study";
export function generateStaticParams() { return projects.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const {slug} = await params; const p = getProject(slug); return p ? { title: p.title, description: p.summary } : {}; }
export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) { const {slug} = await params; return <CaseStudyContent slug={slug} />; }
