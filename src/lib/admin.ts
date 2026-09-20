import type { Project } from "../content/projects";

export const repository = "yahyakashkoush/yahyakashkoush.github.io";
export const repositoryUrl = `https://github.com/${repository}`;
const api = `https://api.github.com/repos/${repository}`;
const contentPath = "/contents/src/content/projects.json";

export function validateProjects(value: unknown): asserts value is Project[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("Keep at least one project in your portfolio.");
  const slugs = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") throw new Error("Invalid project data.");
    for (const key of ["slug", "index", "title", "subtitle", "role", "summary"]) {
      if (typeof item[key] !== "string" || !item[key].trim()) throw new Error(`${item.title || "Project"}: ${key} is required.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) throw new Error("Project URLs must be unique and use lowercase letters, numbers, and hyphens.");
    slugs.add(item.slug);
    for (const key of ["year", "date"]) {
      if (item[key] !== null && typeof item[key] !== "string") throw new Error(`${item.title}: invalid ${key}.`);
    }
    for (const key of ["overview", "stack", "challenge", "approach", "outcome", "credits"]) {
      if (item[key] === undefined && !["overview", "stack"].includes(key)) continue;
      if (!Array.isArray(item[key]) || !item[key].every((v: unknown) => typeof v === "string")) throw new Error(`${item.title}: ${key} must be a list of text.`);
    }
    if (!item.overview.some((v: string) => v.trim())) throw new Error(`${item.title}: add an overview.`);
    if (item.architecture !== undefined && typeof item.architecture !== "string") throw new Error("Architecture must be text.");
    if (item.capabilities !== undefined && (!Array.isArray(item.capabilities) || !item.capabilities.every((v: { label?: unknown; body?: unknown } | null) => v && typeof v.label === "string" && typeof v.body === "string"))) throw new Error("Capabilities need a label and body.");
    if (!Array.isArray(item.links)) throw new Error("Links must be a list.");
    for (const link of item.links) {
      if (!link || typeof link.label !== "string" || !link.label.trim() || typeof link.href !== "string") throw new Error("Every link needs a label and URL.");
      let url: URL;
      try { url = new URL(link.href); } catch { throw new Error("Enter a complete https:// or http:// link."); }
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Project links must use https:// or http://.");
    }
  }
}

export function encodeContent(value: string) {
  return btoa(Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join(""));
}

export function decodeContent(value: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, "")), (char) => char.charCodeAt(0)));
}

async function request(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${api}${path}`, {
    ...init,
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("This GitHub token is invalid or expired. Reconnect with a new token.");
    if (response.status === 403) throw new Error("GitHub denied access. Check repository Contents read/write permission, branch rules, and your API rate limit.");
    if (response.status === 409 || response.status === 422) throw new Error("Publishing was rejected. The content may have changed, or a branch rule may block direct publishing. Export your draft before reconnecting.");
    throw new Error(`GitHub request failed (${response.status}). Check access and try again.`);
  }
  return response.json();
}

export async function loadProjects(token: string): Promise<{ projects: Project[]; sha: string }> {
  const file = await request(`${contentPath}?ref=main`, token);
  const projects: unknown = JSON.parse(decodeContent(file.content));
  validateProjects(projects);
  return { projects, sha: file.sha };
}

export async function publishProjects(token: string, projects: Project[], sha: string) {
  validateProjects(projects);
  const result = await request(contentPath, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Update portfolio projects from admin", branch: "main", sha, content: encodeContent(JSON.stringify(projects, null, 2) + "\n") }),
  });
  return { sha: result.content.sha as string, commit: result.commit.sha as string };
}

export async function deploymentStatus(token: string, commit: string): Promise<string> {
  const result = await request(`/actions/workflows/deploy.yml/runs?head_sha=${encodeURIComponent(commit)}&per_page=1`, token);
  const run = result.workflow_runs?.[0];
  if (!run) return "Waiting for GitHub Actions";
  return run.status === "completed" ? (run.conclusion === "success" ? "Live — deployment succeeded" : `Deployment ${run.conclusion}. Open deployment history for details.`) : `Deployment ${run.status.replaceAll("_", " ")}`;
}
