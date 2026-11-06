import { useEffect } from "react";
import { site } from "@/content/site";

export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} - ${site.name}` : `${site.name} - ${site.role}`;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}
