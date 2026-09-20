"use client";

import { createContext, useContext, useEffect, useState } from "react";
import initial from "@/content/portfolio.json";
import { projects as staticProjects } from "@/content/projects";
import { parseContent, type PortfolioContent } from "@/lib/content-schema";
import { getSupabase } from "@/lib/supabase";

export const initialContent = parseContent(initial);
const Context = createContext({ content: initialContent, loading: true });
export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<PortfolioContent>(initialContent);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      // Only explicit, authenticated preview tabs can load a draft.
      const preview = new URLSearchParams(window.location.search).get("preview") === "draft";
      const { data } = await getSupabase().from("portfolio_content").select("content").eq("id", preview ? "draft" : "published").maybeSingle();
      if (!active) return;
      if (data?.content) {
        try { setContent(parseContent(data.content)); } catch { /* Keep the complete last valid snapshot. */ }
      }
      setLoading(false);
    };
    void refresh();
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { active = false; document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  return <Context.Provider value={{ content, loading }}>{children}</Context.Provider>;
}
export const usePortfolio = () => useContext(Context);
export function projectHref(slug: string) {
  return staticProjects.some((p) => p.slug === slug) ? `/work/${slug}` : `/work?project=${encodeURIComponent(slug)}`;
}
