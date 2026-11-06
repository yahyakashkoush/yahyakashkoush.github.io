"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle, DownloadSimple, EnvelopeSimple, FolderSimple, GearSix, Globe, GridFour, ImageSquare, Plus, RocketLaunch, SignOut, FloppyDisk, ClockCounterClockwise, ArrowLeft } from "@phosphor-icons/react";
import { AdminAuth } from "./auth-gate";
import { ContentFields, emptyProject, type EditableValue } from "./content-editor";
import { initialContent, projectHref } from "@/components/content-provider";
import { parseContent, type PortfolioContent } from "@/lib/content-schema";
import { errorMessage, publishDraft, readWorkspace, saveDraft, type InboxMessage } from "@/lib/cms";
import { getSupabase } from "@/lib/supabase";
import styles from "./cms.module.css";

const sections = ["Overview", "Projects", "Site content", "Messages", "Publishing"] as const;
type Section = typeof sections[number];
type ContentKey = Exclude<keyof PortfolioContent, "projects">;
const contentSections: { key: ContentKey; label: string; path: string }[] = [
  { key: "hero", label: "Hero", path: "/" }, { key: "about", label: "About", path: "/#about" },
  { key: "experience", label: "Experience", path: "/#experience" }, { key: "capabilities", label: "Capabilities", path: "/#capabilities" },
  { key: "contact", label: "Contact", path: "/#contact" }, { key: "start", label: "Start a project", path: "/start" },
  { key: "work", label: "Work heading", path: "/#work" }, { key: "site", label: "Identity & contact details", path: "/" },
  { key: "navigation", label: "Navigation & footer links", path: "/" }, { key: "cinematic", label: "Films & captions", path: "/" },
];
const icons = [GridFour, FolderSimple, Globe, EnvelopeSimple, RocketLaunch];

export function CmsDashboard() { return <AdminAuth><Workspace /></AdminAuth>; }

function Workspace() {
  const [section, setSection] = useState<Section>("Overview");
  const [draft, setDraft] = useState<PortfolioContent>(initialContent);
  const [saved, setSaved] = useState("");
  const [published, setPublished] = useState("");
  const [draftVersion, setDraftVersion] = useState(0), [publishedVersion, setPublishedVersion] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [projectIndex, setProjectIndex] = useState<number | null>(null);
  const [contentKey, setContentKey] = useState<ContentKey>("about");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [message, setMessage] = useState<InboxMessage | null>(null), [note, setNote] = useState("");
  const [messageFilter, setMessageFilter] = useState("all");
  const [revisions, setRevisions] = useState<{ id: number; published_at: string }[]>([]);
  const dirty = saved !== "" && JSON.stringify(draft) !== saved;
  const unpublished = published !== "" && JSON.stringify(draft) !== published;
  const selectedProject = projectIndex === null ? null : draft.projects[projectIndex];

  async function load() {
    try {
      const data = await readWorkspace();
      setError("");
      setDraft(data.draft.content); setSaved(JSON.stringify(data.draft.content)); setPublished(JSON.stringify(data.published.content));
      setDraftVersion(data.draft.version); setPublishedVersion(data.published.version); setUpdatedAt(data.published.updated_at);
      const { count } = await getSupabase().from("portfolio_messages").select("id", { count: "exact", head: true }).eq("status", "new");
      setUnread(count || 0);
    } catch (error) { setError(errorMessage(error)); } finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    readWorkspace().then((data) => {
      if (!active) return;
      setDraft(data.draft.content); setSaved(JSON.stringify(data.draft.content)); setPublished(JSON.stringify(data.published.content));
      setDraftVersion(data.draft.version); setPublishedVersion(data.published.version); setUpdatedAt(data.published.updated_at);
    }).catch((error) => { if (active) setError(errorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    void getSupabase().from("portfolio_messages").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => { if (active) setUnread(count || 0); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  async function save() {
    const valid = parseContent({ ...draft, projects: draft.projects.map((p, i) => ({ ...p, index: String(i + 1).padStart(2, "0") })) });
    const version = await saveDraft(valid, draftVersion);
    setDraft(valid); setSaved(JSON.stringify(valid)); setDraftVersion(version);
    return { version, content: valid };
  }
  async function action(fn: () => Promise<void>) { setBusy(true); setError(""); setNotice(""); try { await fn(); } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); } }
  async function loadMessages(append = false) {
    const offset = append ? messages.length : 0;
    const { data, error } = await getSupabase().from("portfolio_messages").select("*").order("created_at", { ascending: false }).range(offset, offset + 99);
    if (error) throw error;
    setMessages(append ? [...messages, ...(data as InboxMessage[])] : data as InboxMessage[]);
  }
  async function changeMessage(status: InboxMessage["status"]) {
    if (!message) return;
    const { data, error } = await getSupabase().from("portfolio_messages").update({ status, note, updated_at: new Date().toISOString() }).eq("id", message.id).eq("updated_at", message.updated_at).select().single();
    if (error) throw new Error("Could not save. Another session may have changed this message. Refresh the inbox and try again.");
    setMessages((items) => items.map((item) => item.id === message.id ? data as InboxMessage : item));
    setMessage(data as InboxMessage);
    if (message.status === "new" && status !== "new") setUnread((v) => Math.max(0, v - 1));
    if (message.status !== "new" && status === "new") setUnread((v) => v + 1);
    setNotice("Message updated.");
  }
  function exportDraft() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "portfolio-draft.json"; anchor.click(); URL.revokeObjectURL(url);
  }
  async function navigate(next: Section) {
    setSection(next); setQuery(""); setError("");
    if (next === "Messages") await action(() => loadMessages());
    if (next === "Publishing") await action(async () => {
      const { data, error } = await getSupabase().from("portfolio_revisions").select("id,published_at").order("id", { ascending: false }).limit(20);
      if (error) throw error; setRevisions(data || []);
    });
  }
  const fieldValue = (value: unknown) => value as EditableValue;

  return <div className={styles.app}>
    <aside className={styles.sidebar}>
      <a className={styles.brand} href="/" target="_blank" rel="noreferrer">YK<span>.</span><small>PORTFOLIO / STUDIO</small></a>
      <div className={styles.workspaceName}><strong>{draft.site.name}</strong><small>Administrator workspace</small></div>
      <p className={styles.eyebrow}>MANAGE</p><nav aria-label="Admin navigation">{sections.map((name, i) => { const Icon = icons[i]; return <button key={name} className={section === name ? styles.active : ""} disabled={busy} onClick={() => void navigate(name)}><Icon size={19} />{name}{name === "Messages" && unread > 0 && <span className={styles.badge}>{unread}</span>}</button>; })}</nav>
      <div className={styles.sidebarFoot}><a href="/" target="_blank" rel="noreferrer">View live portfolio <ArrowUpRight size={16} /></a><button disabled={busy} onClick={() => { if (!dirty || window.confirm("Sign out and discard changes that have not been saved?")) void action(async () => { const { error } = await getSupabase().auth.signOut(); if (error) throw error; }); }}><SignOut size={17} />Sign out</button><small>Private drafts · Protected inbox</small></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.topbar}><span>Workspace <span>/</span> {section}</span><div><span className={styles.saveState}>{loading ? "Loading…" : dirty ? "Unsaved changes" : "Draft saved"}</span><button className={styles.button} disabled={busy || loading || !dirty} onClick={() => void action(async () => { await save(); setNotice("Draft saved privately. Publish when you are ready."); })}><FloppyDisk size={16} />Save draft</button></div></header>
      <div className={styles.content}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>YOUR WORK, YOUR WORDS</p><h1>{section === "Overview" ? "Your portfolio, under control." : section === "Site content" ? "Make every word yours." : section === "Messages" ? "Your conversations." : section === "Publishing" ? "Ready for the world." : "The work you put your name on."}</h1><p className={styles.muted}>{section === "Messages" ? "Contact messages and project requests, in one private inbox." : "Edit freely. Save a private draft. Publish when it feels right."}</p></div>{section === "Projects" && <button className={styles.primary} disabled={busy || loading} onClick={() => { const slug = `project-${Date.now().toString(36)}`; const project = { ...structuredClone(emptyProject), slug, index: String(draft.projects.length + 1).padStart(2, "0") }; setDraft({ ...draft, projects: [...draft.projects, project as PortfolioContent["projects"][number]] }); setProjectIndex(draft.projects.length); }}><Plus size={17} />Add project</button>}</div>
        {error && <div role="alert" className={styles.error}>{error}</div>}{notice && <div role="status" className={styles.notice}><CheckCircle size={18} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
        {loading ? <div className={styles.panel}>Loading your private workspace…</div> : !draftVersion ? <div className={styles.panel}><p>The workspace could not be loaded.</p><button className={styles.button} onClick={() => void load()}>Try again</button></div> : <>
        {section === "Overview" && <>
          <div className={styles.stats}><button onClick={() => void navigate("Projects")}><FolderSimple size={22} /><span>Projects</span><strong>{String(draft.projects.length).padStart(2, "0")}</strong><small>Case studies & image galleries</small></button><button onClick={() => void navigate("Messages")}><EnvelopeSimple size={22} /><span>New messages</span><strong>{String(unread).padStart(2, "0")}</strong><small>Waiting in your inbox</small></button><button onClick={() => void navigate("Site content")}><Globe size={22} /><span>Editable sections</span><strong>{contentSections.length}</strong><small>Your full portfolio content</small></button></div>
          <div className={styles.banner}><RocketLaunch size={28} /><div><h2>{unpublished ? "You have a new story to publish." : "Your published content is up to date."}</h2><p>{updatedAt ? `Last published ${new Date(updatedAt).toLocaleString()}` : "Your changes appear live after publishing."}</p></div><button className={styles.button} onClick={() => void navigate("Publishing")}>Review publishing <ArrowUpRight size={16} /></button></div>
          <div className={styles.sectionCards}>{contentSections.slice(0, 6).map(({ key, label, path }) => <button key={key} className={styles.panel} onClick={() => { setContentKey(key); void navigate("Site content"); }}><span className={styles.eyebrow}>{path}</span><h2>{label}<ArrowUpRight size={20} /></h2><p>Edit text, images, and options.</p></button>)}</div>
        </>}
        {section === "Projects" && <>
          {selectedProject ? <section className={styles.panel}><div className={styles.panelHeading}><button className={styles.button} onClick={() => setProjectIndex(null)}><ArrowLeft size={16} />All projects</button><a href={`${projectHref(selectedProject.slug)}${projectHref(selectedProject.slug).includes("?") ? "&" : "?"}preview=draft`} target="_blank" rel="noreferrer">Preview saved draft <ArrowUpRight size={14} /></a></div><p className={styles.hint}>All case study fields are editable. Save before previewing. Gallery images and the cover can be uploaded or replaced below. Changing the URL slug changes the project link.</p><ContentFields path="project" value={fieldValue(selectedProject)} disabled={busy} onChange={(value) => setDraft({ ...draft, projects: draft.projects.map((p, i) => i === projectIndex ? value as unknown as PortfolioContent["projects"][number] : p) })} /><div className={styles.toolbar}><button className={styles.danger} disabled={busy || draft.projects.length < 2} onClick={() => { if (window.confirm(`Remove ${selectedProject.title} from the draft? Published content changes only when you publish.`)) { setDraft({ ...draft, projects: draft.projects.filter((_, i) => i !== projectIndex) }); setProjectIndex(null); } }}>Remove project from draft</button><button className={styles.primary} disabled={busy || !dirty} onClick={() => void action(async () => { await save(); setNotice("Project saved to the private draft."); })}>Save draft</button></div></section> : <section className={styles.panel}><div className={styles.panelHeading}><h2>Project collection</h2><input className={styles.search} aria-label="Search projects" placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>{draft.projects.map((project, index) => ({ project, index })).filter(({ project }) => `${project.title} ${project.subtitle}`.toLowerCase().includes(query.toLowerCase())).map(({ project, index }) => <div className={styles.projectRow} key={`${project.slug}-${index}`}><span className={styles.projectNumber}>{String(index + 1).padStart(2, "0")}</span><button className={styles.projectLink} onClick={() => setProjectIndex(index)}><strong>{project.title}</strong><small>{project.subtitle}</small><span><ImageSquare size={13} />{project.media.gallery.length} gallery images</span></button><div className={styles.rowActions}><button disabled={busy || index === 0} aria-label={`Move ${project.title} up`} onClick={() => { const next = [...draft.projects]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setDraft({ ...draft, projects: next }); }}>↑</button><button disabled={busy || index === draft.projects.length - 1} aria-label={`Move ${project.title} down`} onClick={() => { const next = [...draft.projects]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; setDraft({ ...draft, projects: next }); }}>↓</button><button className={styles.button} onClick={() => setProjectIndex(index)}>Edit</button></div></div>)}{query && !draft.projects.some((p) => `${p.title} ${p.subtitle}`.toLowerCase().includes(query.toLowerCase())) && <p className={styles.empty}>No matching projects.</p>}</section>}
        </>}
        {section === "Site content" && <div className={styles.editorLayout}><nav className={styles.sectionNav} aria-label="Content sections">{contentSections.map(({ key, label }) => <button key={key} className={contentKey === key ? styles.selected : ""} onClick={() => setContentKey(key)}>{label}</button>)}</nav><section className={styles.panel}><div className={styles.panelHeading}><h2>{contentSections.find((s) => s.key === contentKey)?.label}</h2><a target="_blank" rel="noreferrer" href={`${contentSections.find((s) => s.key === contentKey)?.path.split("#")[0] || "/"}?preview=draft${contentSections.find((s) => s.key === contentKey)?.path.includes("#") ? "#" + contentSections.find((s) => s.key === contentKey)?.path.split("#")[1] : ""}`}>Preview saved draft <ArrowUpRight size={14} /></a></div><ContentFields value={fieldValue(draft[contentKey])} path={contentKey} onChange={(value) => setDraft({ ...draft, [contentKey]: value })} disabled={busy} /></section></div>}
        {section === "Messages" && <div className={styles.inboxLayout}>
          <section className={styles.panel}><div className={styles.panelHeading}><h2>Inbox</h2><button disabled={busy} onClick={() => void action(() => loadMessages())}>Refresh</button></div><input className={styles.search} aria-label="Search inbox" placeholder="Search names, emails, messages…" value={query} onChange={(e) => setQuery(e.target.value)} /><div className={styles.filterTabs}>{["all", "new", "contact", "project", "archived"].map((filter) => <button key={filter} className={filter === messageFilter ? styles.selected : ""} onClick={() => setMessageFilter(filter)}>{filter}</button>)}</div>
            {messages.filter((m) => (messageFilter === "all" ? m.status !== "archived" : m.status === messageFilter || m.kind === messageFilter) && `${m.name} ${m.email} ${m.message}`.toLowerCase().includes(query.toLowerCase())).map((m) => <button key={m.id} className={`${styles.messageRow} ${message?.id === m.id ? styles.selected : ""}`} onClick={() => { setMessage(m); setNote(m.note); }}><span><strong>{m.name}</strong><small>{new Date(m.created_at).toLocaleDateString()}</small></span><span className={styles.messageType}>{m.kind === "project" ? "Project request" : "Contact message"} · {m.status}</span><p>{m.message}</p></button>)}
            {!messages.length && <div className={styles.empty}><EnvelopeSimple size={32} /><h3>Your inbox is ready.</h3><p>New contact messages and project briefs will appear here.</p></div>}
            <button className={styles.button} disabled={busy} onClick={() => void action(() => loadMessages(true))}>Load older messages</button><p className={styles.hint}>{messages.length} messages loaded. Search applies to loaded messages.</p>
          </section><section className={styles.panel}>{message ? <><div className={styles.panelHeading}><h2>{message.name}</h2><span className={styles.badge}>{message.status}</span></div><a href={`mailto:${message.email}`}>{message.email}</a><p className={styles.hint}>{new Date(message.created_at).toLocaleString()}</p><p className={styles.messageBody}>{message.message}</p>{Object.keys(message.details).length > 0 && <dl className={styles.details}>{Object.entries(message.details).map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—")}</dd></div>)}</dl>}<label className={styles.field}>Private note<textarea rows={4} value={note} maxLength={10000} onChange={(e) => setNote(e.target.value)} /></label><div className={styles.toolbar}><button className={styles.button} disabled={busy} onClick={() => void action(() => changeMessage(message.status))}>Save note</button><a className={styles.primary} href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.kind === "project" ? "Your project request" : "Your message"}`)}`}>Reply by email <ArrowUpRight size={14} /></a></div><p className={styles.hint}>Reply opens your email app. Mark replied after you send the email.</p><div className={styles.toolbar}>{(["new", "read", "replied", "archived"] as const).filter((status) => status !== message.status).map((status) => <button key={status} disabled={busy} className={styles.button} onClick={() => void action(() => changeMessage(status))}>Mark {status}</button>)}</div></> : <div className={styles.empty}>Select a message to read it and manage its status.</div>}</section>
        </div>}
        {section === "Publishing" && <div className={styles.publishGrid}><section className={styles.panel}><RocketLaunch size={27} /><h2>From private draft to public portfolio.</h2><p className={styles.muted}>Publishing updates every section and project together. Changes appear on the next page load. Your inbox and account details remain private.</p><div className={styles.publishStatus}><span>Draft</span><strong>{dirty ? "Unsaved changes" : `Saved · version ${draftVersion}`}</strong><span>Live site</span><strong>Version {publishedVersion}</strong></div><div className={styles.toolbar}><button className={styles.primary} disabled={busy || !unpublished} onClick={() => void action(async () => { const result = dirty ? await save() : { version: draftVersion, content: draft }; const version = await publishDraft(result.version, publishedVersion); setPublishedVersion(version); setPublished(JSON.stringify(result.content)); setUpdatedAt(new Date().toISOString()); setNotice("Published. Your portfolio is now updated."); })}><RocketLaunch size={16} />{busy ? "Working…" : "Publish all changes"}</button><a className={styles.button} target="_blank" rel="noreferrer" href="/?preview=draft">Preview saved draft <ArrowUpRight size={14} /></a></div><p className={styles.hint}>New projects are available immediately through their generated project links. Search and social metadata use the last deployed snapshot until the next site build.</p></section>
          <section className={styles.panel}><GearSix size={25} /><h2>Your backups & history</h2><div className={styles.toolbar}><button className={styles.button} onClick={exportDraft}><DownloadSimple size={16} />Export complete draft</button><label className={styles.upload}>Import draft<input type="file" accept="application/json,.json" disabled={busy} onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { if (file.size > 1000000) throw new Error("Draft files must be under 1 MB."); const value = parseContent(JSON.parse(await file.text())); if (window.confirm("Replace your current draft with this file? Save or export your current work first.")) { setDraft(value); setProjectIndex(null); setNotice("Draft imported. Review and save before publishing."); } } catch (error) { setError(errorMessage(error)); } }} /></label></div><button className={styles.button} disabled={busy} onClick={() => { if (!dirty || window.confirm("Discard unsaved changes and reload the saved workspace?")) { setProjectIndex(null); void load(); } }}>Reload saved workspace</button><h3 className={styles.historyTitle}><ClockCounterClockwise size={18} />Publication history</h3>{revisions.length === 0 && <p className={styles.hint}>Published versions will appear here.</p>}{revisions.map((revision) => <div className={styles.revision} key={revision.id}><span>{new Date(revision.published_at).toLocaleString()}</span><button disabled={busy} onClick={() => { if (window.confirm("Restore this published version into your draft? The live site will not change until you publish.")) void action(async () => { const { data, error } = await getSupabase().from("portfolio_revisions").select("content").eq("id", revision.id).single(); if (error) throw error; setDraft(parseContent(data.content)); setProjectIndex(null); setNotice("Version restored into your draft. Review, save, and publish to make it live."); }); }}>Restore draft</button></div>)}</section></div>}
        </>}
        <footer className={styles.footer}><span>YK / PORTFOLIO STUDIO</span><span>Made to keep your work moving.</span></footer>
      </div>
    </div>
  </div>;
}
