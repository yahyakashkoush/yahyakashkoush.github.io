import type { Metadata } from "next";
import { CmsDashboard } from "@/components/admin/cms-dashboard";

export const metadata: Metadata = {
  title: "Portfolio admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <CmsDashboard />;
}
