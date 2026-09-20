import { getSupabase, submissionKey, supabaseUrl } from "./supabase";
import { parseContent, type PortfolioContent } from "./content-schema";

export type ContentRow = { id: string; content: PortfolioContent; version: number; updated_at: string };
export type InboxMessage = { id: string; kind: "contact" | "project"; name: string; email: string; message: string; details: Record<string, unknown>; status: "new" | "read" | "replied" | "archived"; note: string; created_at: string; updated_at: string };
export async function readWorkspace() {
  const { data, error } = await getSupabase().from("portfolio_content").select("id,content,version,updated_at");
  if (error) throw error;
  const rows = (data || []).map((row) => ({ ...row, content: parseContent(row.content) })) as ContentRow[];
  const draft = rows.find((r) => r.id === "draft"), published = rows.find((r) => r.id === "published");
  if (!draft || !published) throw new Error("The private workspace is not available for this account.");
  return { draft, published };
}
export async function saveDraft(content: PortfolioContent, version: number): Promise<number> {
  const validated = parseContent(content);
  const { data, error } = await getSupabase().rpc("save_portfolio_draft", { p_content: validated, p_expected_version: version }).retry(false);
  if (error) throw error;
  return data;
}
export async function publishDraft(draftVersion: number, publishedVersion: number): Promise<number> {
  const { data, error } = await getSupabase().rpc("publish_portfolio", { p_draft_version: draftVersion, p_published_version: publishedVersion }).retry(false);
  if (error) throw error;
  return data;
}
export async function uploadImage(file: File) {
  const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
  if (!allowed[file.type]) throw new Error("Choose a JPEG, PNG, WebP or AVIF image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be 8 MB or smaller.");
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap; bitmap.close();
  if (!width || !height || width > 16000 || height > 16000) throw new Error("Image dimensions must be between 1 and 16,000 pixels.");
  const name = `${crypto.randomUUID()}.${allowed[file.type]}`;
  const { error } = await getSupabase().storage.from("portfolio-images").upload(name, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  return { src: getSupabase().storage.from("portfolio-images").getPublicUrl(name).data.publicUrl, width, height, alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), caption: "", kind: width < height ? "mobile" as const : "desktop" as const };
}
export async function submitMessage(payload: Record<string, unknown>) {
  const response = await fetch(`${supabaseUrl}/functions/v1/portfolio-submit`, { method: "POST", headers: { "Content-Type": "application/json", apikey: submissionKey, Authorization: `Bearer ${submissionKey}` }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Your message could not be sent. Please try again.");
  return result as { id: string };
}
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "Something went wrong. Please try again."; }
