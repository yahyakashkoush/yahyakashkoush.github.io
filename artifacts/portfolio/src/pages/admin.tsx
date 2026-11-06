import { useEffect } from "react";
import { CmsDashboard } from "@/components/admin/cms-dashboard";
import { usePageTitle } from "@/lib/compat/title";

export default function AdminPage() {
  usePageTitle("Portfolio admin");
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex, nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);
  return <CmsDashboard />;
}
