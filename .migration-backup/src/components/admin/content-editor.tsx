"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, Plus, Trash, UploadSimple, Images } from "@phosphor-icons/react";
import { errorMessage, uploadImage } from "@/lib/cms";
import { getSupabase } from "@/lib/supabase";
import { safeUrl } from "@/lib/content-schema";
import styles from "./cms.module.css";

export type EditableValue = string | number | boolean | null | EditableValue[] | { [key: string]: EditableValue };
export const emptyShot = { src: "/media/portrait/front-medium.jpg", alt: "Describe this image", width: 1089, height: 1445, caption: "", kind: "desktop" };
export const emptyProject = { slug: "new-project", index: "01", title: "New project", subtitle: "", year: null, date: null, role: "", summary: "", overview: [""], challenge: [], approach: [], capabilities: [], architecture: "", outcome: [], stack: [], credits: [], links: [], media: { preview: null, gallery: [] } };
function labelFor(key: string) { return key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()); }
function newItem(key: string): EditableValue {
  const templates: Record<string, EditableValue> = {
    projects: emptyProject, entries: { period: "", title: "", org: "", body: [""] }, groups: { title: "", items: [""] },
    capabilities: { label: "", body: "" }, links: { label: "", href: "https://" }, navigation: { label: "", href: "/#" },
    gallery: { ...emptyShot, src: "", alt: "" }, projectTypes: { id: "new-type", label: "" }, budgetBands: { id: "new-budget", label: "", note: "" }, weekdays: 1,
  };
  return structuredClone(templates[key] ?? "");
}

export function ContentFields({ value, onChange, path = "", disabled = false }: { value: EditableValue; onChange: (value: EditableValue) => void; path?: string; disabled?: boolean }) {
  const key = path.split(".").at(-1) || "Content";
  const label = labelFor(key);
  if (value && typeof value === "object" && !Array.isArray(value) && "src" in value && "alt" in value) return <ImageField value={value} onChange={onChange} disabled={disabled} label={label} />;
  if (key === "preview" && value === null) return <div className={styles.emptyInline}><p>No project cover image.</p><button className={styles.button} disabled={disabled} onClick={() => onChange({ ...emptyShot, src: "", alt: "" })}><Plus size={14} />Add cover image</button></div>;
  if (Array.isArray(value)) {
    return <fieldset className={styles.arrayField}><legend>{label} <span>{value.length}</span></legend>
      {value.length === 0 && <p className={styles.hint}>No items yet. Add one below.</p>}
      {value.map((item, index) => <div className={styles.arrayItem} key={`${path}.${index}`}>
        <div className={styles.itemToolbar}><span>{String(index + 1).padStart(2, "0")}</span><div>
          <button disabled={disabled || index === 0} aria-label={`Move ${label} item ${index + 1} up`} onClick={() => { const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}><ArrowUp size={16} /></button>
          <button disabled={disabled || index === value.length - 1} aria-label={`Move ${label} item ${index + 1} down`} onClick={() => { const next = [...value]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next); }}><ArrowDown size={16} /></button>
          <button disabled={disabled} aria-label={`Remove ${label} item ${index + 1}`} onClick={() => { if (window.confirm("Remove this item from the draft? You can restore the last saved version before publishing.")) onChange(value.filter((_, i) => i !== index)); }}><Trash size={16} /></button>
        </div></div>
        <ContentFields value={item} onChange={(next) => onChange(value.map((v, i) => i === index ? next : v))} path={`${path}.${index}`} disabled={disabled} />
      </div>)}
      <button className={styles.button} disabled={disabled} onClick={() => onChange([...value, newItem(key)])}><Plus size={15} />Add {label.toLowerCase()} item</button>
    </fieldset>;
  }
  if (value && typeof value === "object") return <div className={styles.fields}>{Object.entries(value).map(([name, item]) => <ContentFields key={name} path={path ? `${path}.${name}` : name} value={item} onChange={(next) => onChange({ ...value, [name]: next })} disabled={disabled} />)}</div>;
  if (typeof value === "boolean") return <label className={styles.checkbox}><input type="checkbox" disabled={disabled} checked={value} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
  if (key === "kind") return <label className={styles.field}>{label}<select disabled={disabled} value={String(value)} onChange={(e) => onChange(e.target.value)}><option value="desktop">Desktop screenshot</option><option value="mobile">Mobile screenshot</option></select></label>;
  const isNumber = typeof value === "number";
  const multiline = !isNumber && (String(value || "").length > 100 || /description|summary|heading|message|paragraph|architecture|placeholder|help|body/i.test(path));
  return <label className={styles.field}>{/^\d+$/.test(key) ? `Text ${Number(key) + 1}` : label}{multiline ? <textarea disabled={disabled} rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /> : <input disabled={disabled} type={isNumber ? "number" : "text"} value={value === null ? "" : String(value)} onChange={(e) => onChange(isNumber ? Number(e.target.value) : (key === "year" || key === "date") && !e.target.value ? null : e.target.value)} />}</label>;
}

function ImageField({ value, onChange, disabled, label }: { value: { [key: string]: EditableValue }; onChange: (value: EditableValue) => void; disabled: boolean; label: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [assets, setAssets] = useState<string[] | null>(null);
  async function upload(file?: File) {
    if (!file) return; setBusy(true); setError("");
    try { const result = await uploadImage(file); onChange("width" in value ? { ...value, ...result } : { src: result.src, alt: result.alt }); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <fieldset className={styles.imageField}><legend>{label}</legend>
    {typeof value.src === "string" && safeUrl.safeParse(value.src).success && <div className={styles.imagePreview}><Image src={value.src} alt={String(value.alt || "Image preview")} width={400} height={240} unoptimized /></div>}
    <div className={styles.toolbar}><label className={styles.upload}><UploadSimple size={16} />{busy ? "Uploading…" : "Upload / replace image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={disabled || busy} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label><button className={styles.button} disabled={disabled || busy} onClick={async () => { setBusy(true); setError(""); try { const { data, error } = await getSupabase().storage.from("portfolio-images").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } }); if (error) throw error; setAssets((data || []).map((item) => getSupabase().storage.from("portfolio-images").getPublicUrl(item.name).data.publicUrl)); } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); } }}><Images size={16} />Choose uploaded</button></div>
    <p className={styles.hint}>JPEG, PNG, WebP or AVIF · max 8 MB. Uploaded images have public URLs. Replace creates a new file so published images stay intact.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {assets && <div className={styles.library}><div className={styles.toolbar}><strong>Uploaded images</strong><button onClick={() => setAssets(null)}>Close library</button></div>{!assets.length && <p>No uploaded images yet.</p>}<div className={styles.assetGrid}>{assets.map((src) => <button key={src} className={styles.asset} onClick={async () => { setBusy(true); try { const img = new window.Image(); img.src = src; await img.decode(); onChange("width" in value ? { ...value, src, width: img.naturalWidth, height: img.naturalHeight } : { ...value, src }); setAssets(null); } catch { setError("Unable to load this image."); } finally { setBusy(false); } }}><Image src={src} width={160} height={100} alt="Select uploaded image" unoptimized /></button>)}</div></div>}
    {Object.entries(value).map(([key, item]) => <ContentFields key={key} value={item} path={key} onChange={(next) => onChange({ ...value, [key]: next })} disabled={disabled || busy} />)}
    {label === "Preview" && <button className={styles.danger} disabled={disabled || busy} onClick={() => onChange(null)}>Remove cover from draft</button>}
  </fieldset>;
}
