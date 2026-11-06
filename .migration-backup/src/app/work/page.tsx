import { Suspense } from "react";
import { ProjectRoute } from "@/components/project-route";
export default function WorkPage() {
  return <Suspense fallback={<p className="pt-40 text-center">Loading project…</p>}><ProjectRoute /></Suspense>;
}
