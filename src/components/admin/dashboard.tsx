"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { projects as initialProjects, type Project } from "@/content/projects";
import { deploymentStatus, loadProjects, publishProjects, repositoryUrl, validateProjects } from "@/lib/admin";
import { ArrowDown, ArrowUp, ArrowUpRight, CheckCircle, Code, DownloadSimple, Eye, FolderSimple, GearSix, GitBranch, GridFour, MagnifyingGlass, Plus, RocketLaunch, SignOut, Trash, X } from "@phosphor-icons/react";
import styles from "./dashboard.module.css";

type Section = "Overview" | "Projects" | "Publishing";
const copy = (value: Project[]) => structuredClone(value);

export function AdminDashboard() {
  const [section, setSection] = useState<Section>("Overview");
  const [projects, setProjects] = useState(() => copy(initialProjects));
  const [baseline, setBaseline] = useState(() => JSON.stringify(initialProjects));
  const [token, setToken] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [sha, setSha] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Project | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [commit, setCommit] = useState("");
  const [deployment, setDeployment] = useState("");
  const dirty = JSON.stringify(projects) !== baseline;
  const changed = projects.filter((p) => JSON.stringify(p) !== JSON.stringify((JSON.parse(baseline) as Project[]).find((b) => b.slug === p.slug))).length;
  const removed = (JSON.parse(baseline) as Project[]).filter((p) => !projects.some((v) => v.slug === p.slug)).length;

  useEffect(() => {
    if (!dirty && !editor) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty, editor]);

  function edit(project: Project, isNew = false) {
    setError(""); setOriginalSlug(isNew ? null : project.slug); setEditor(structuredClone(project)); setPreview(false);
    const { challenge, approach, capabilities, architecture, outcome, credits, links } = project;
    setAdvanced(JSON.stringify({ challenge, approach, capabilities, architecture, outcome, credits, links }, null, 2));
  }

  function saveEditor() {
    if (!editor) return;
    try {
      const extra = JSON.parse(advanced);
      if (!extra || typeof extra !== "object" || Array.isArray(extra)) throw new Error("Case study details must be an object.");
      const allowed = ["challenge", "approach", "capabilities", "architecture", "outcome", "credits", "links"];
      if (Object.keys(extra).some((key) => !allowed.includes(key))) throw new Error("Only the listed case study detail fields can be changed here.");
      const project = { ...editor };
      for (const key of allowed) if (!(key in extra)) delete (project as unknown as Record<string, unknown>)[key];
      Object.assign(project, { links: [] }, extra);
      project.stack = project.stack.map((item) => item.trim()).filter(Boolean);
      project.overview = project.overview.map((item) => item.trim()).filter(Boolean);
      if (projects.some((p) => p.slug === project.slug && p.slug !== originalSlug)) throw new Error("A project already uses that URL.");
      const next = originalSlug ? projects.map((p) => p.slug === originalSlug ? project : p) : [...projects, project];
      validateProjects(next); setProjects(next); setEditor(null); setError(""); setNotice("Draft updated. Publish when you're ready.");
    } catch (error) { setError(error instanceof Error ? error.message : "Check the project fields."); }
  }

  async function connect(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await loadProjects(inputToken.trim());
      if (dirty && JSON.stringify(result.projects) !== baseline) throw new Error("The repository has changed since this page loaded. Export your draft, then reload before connecting.");
      setToken(inputToken.trim()); setInputToken(""); setSha(result.sha);
      if (!dirty) { setProjects(result.projects); setBaseline(JSON.stringify(result.projects)); }
      setNotice("Connected to GitHub. Your token is kept in memory for this tab only.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not connect."); }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!token || !sha || busy || !dirty) return;
    setBusy(true); setError("");
    try {
      const result = await publishProjects(token, projects, sha);
      setSha(result.sha); setBaseline(JSON.stringify(projects)); setCommit(result.commit); setDeployment("Changes committed. Deployment is starting.");
      setNotice("Published to GitHub. The live site updates after deployment succeeds.");
    } catch (error) { setError(error instanceof Error ? error.message : "Publishing failed. Your draft is still here."); }
    finally { setBusy(false); }
  }

  function reorder(index: number, direction: number) {
    const next = [...projects];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setProjects(next.map((p, i) => ({ ...p, index: String(i + 1).padStart(2, "0") })));
  }

  function exportDraft() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(projects, null, 2) + "\n"], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "projects.json"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className={styles.app}>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/" target="_blank" rel="noreferrer"><span>YK<span className={styles.red}>.</span></span><small>PORTFOLIO / ADMIN</small></Link>
      <div className={styles.workspace}><span className={styles.avatar}>YK</span><div>Yahya Kashkoush<small>Personal workspace</small></div></div>
      <div className={styles.navLabel}>WORKSPACE</div>
      <nav aria-label="Admin navigation">{([ ["Overview", GridFour], ["Projects", FolderSimple], ["Publishing", RocketLaunch] ] as const).map(([label, Icon]) => <button key={label} className={section === label ? styles.active : ""} onClick={() => { setSection(label); setError(""); }}><Icon size={19} />{label}{label === "Projects" && <span className={styles.count}>{projects.length}</span>}</button>)}</nav>
      <div className={styles.sidebarBottom}><a href="/" target="_blank" rel="noreferrer">View portfolio <ArrowUpRight size={16} /></a><div className={styles.connection}><span className={token ? styles.greenDot : styles.dot} />{token ? "GitHub connected" : "Preview workspace"}</div><small>kashkoush.me</small></div>
    </aside>

    <div className={styles.main}>
      <header className={styles.topbar}><span>Workspace <span className={styles.slash}>/</span> <strong>{section}</strong></span><div><span className={styles.localBadge}>{dirty ? "Unpublished changes" : "No pending changes"}</span><span className={styles.smallAvatar}>YK</span></div></header>
      <div className={styles.content}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>YOUR PORTFOLIO, IN FOCUS</p><h1>{section === "Overview" ? "Workspace overview" : section === "Projects" ? "Your projects" : "Publish your work"}</h1><p>{section === "Publishing" ? "Review your changes and send them to the live portfolio." : "A little maintenance. A better first impression."}</p></div><button className={styles.primary} disabled={busy} onClick={() => edit({ slug: "", index: String(projects.length + 1).padStart(2, "0"), title: "", subtitle: "", year: null, date: null, role: "", summary: "", overview: [""], stack: [], links: [] }, true)}><Plus size={17} /> Add project</button></div>
        {error && <div role="alert" className={styles.error}>{error}</div>}
        {notice && <div role="status" className={styles.notice}><CheckCircle size={18} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X /></button></div>}

        {section === "Overview" && <>
          <div className={styles.stats}>
            <article><div><span>Total projects</span><FolderSimple size={19} /></div><strong>{String(projects.length).padStart(2, "0")}</strong><small>Case studies in your portfolio</small></article>
            <article><div><span>Technologies</span><Code size={19} /></div><strong>{new Set(projects.flatMap((p) => p.stack)).size}</strong><small>Across your project collection</small></article>
            <article><div><span>Pending changes</span><GitBranch size={19} /></div><strong>{String(changed + removed).padStart(2, "0")}</strong><small>{dirty ? "Ready for your review" : "Your workspace is up to date"}</small></article>
          </div>
          <div className={styles.banner}><div className={styles.bannerIcon}><RocketLaunch size={25} /></div><div><h2>Good work deserves to be seen.</h2><p>Keep your projects current. Publish when everything feels right.</p></div><button onClick={() => setSection("Publishing")}>Go to publishing <ArrowUpRight size={17} /></button></div>
        </>}

        {section !== "Publishing" ? <div className={styles.projectGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}><div><h2>Project collection <span>{projects.length}</span></h2><p>Your work, in the order visitors see it.</p></div><label className={styles.search}><MagnifyingGlass size={17} /><input aria-label="Search projects" placeholder="Search projects..." value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
            <div className={styles.tableHeading}><span>PROJECT</span><span>YEAR</span><span>ACTIONS</span></div>
            {projects.filter((p) => `${p.title} ${p.subtitle} ${p.stack.join(" ")}`.toLowerCase().includes(query.toLowerCase())).map((p) => {
              const index = projects.indexOf(p);
              return <div className={styles.projectRow} key={p.slug}>
                <button className={styles.projectInfo} onClick={() => edit(p)} disabled={busy}><span className={styles.projectMark}>{p.title.slice(0, 2).toUpperCase()}</span><span><strong>{p.title}</strong><small>{p.subtitle}</small><span className={styles.tags}>{p.stack.slice(0, 2).map((s) => <span key={s}>{s}</span>)}</span></span></button>
                <span className={styles.year}>{p.year || "—"}</span><div className={styles.rowActions}><button title="Move up" aria-label={`Move ${p.title} up`} disabled={busy || index === 0 || !!query} onClick={() => reorder(index, -1)}><ArrowUp /></button><button title="Move down" aria-label={`Move ${p.title} down`} disabled={busy || index === projects.length - 1 || !!query} onClick={() => reorder(index, 1)}><ArrowDown /></button><button className={styles.editButton} disabled={busy} onClick={() => edit(p)}>Edit <ArrowUpRight /></button></div>
              </div>;
            })}
            {!projects.some((p) => `${p.title} ${p.subtitle} ${p.stack.join(" ")}`.toLowerCase().includes(query.toLowerCase())) && <div className={styles.empty}>No projects match “{query}”. <button onClick={() => setQuery("")}>Clear search</button></div>}
            <div className={styles.panelFooter}><span>{projects.length} projects in collection</span><span>Ordered for your portfolio</span></div>
          </section>
          <aside className={styles.rightColumn}><section className={styles.panel}><div className={styles.sideContent}><p className={styles.eyebrow}>PUBLISHING</p><div className={styles.statusIcon}><GitBranch size={24} /></div><h2>{dirty ? "Changes in progress" : "A clean workspace"}</h2><p>{dirty ? "Your draft is only in this tab. Review and publish it to update your portfolio." : "Make your next update here. Changes stay in this tab until you publish."}</p><button className={styles.wideButton} onClick={() => setSection("Publishing")}>{dirty ? "Review changes" : "Manage publishing"}<ArrowUpRight /></button></div></section><section className={styles.note}><GearSix size={20} /><h3>Made for your workflow</h3><p>Edit your story, arrange your work, and ship an update. Every publish is versioned in GitHub.</p><a href={`${repositoryUrl}/commits/main`} target="_blank" rel="noreferrer">View change history <ArrowUpRight size={14} /></a></section></aside>
        </div> : <div className={styles.publishGrid}>
          <section className={styles.panel}><div className={styles.sideContent}><p className={styles.eyebrow}>01 / CONNECT</p><h2>{token ? "Connected to your repository" : "Authorize publishing"}</h2><p>Use a fine-grained GitHub token for this repository with Contents read/write and Actions read permissions. Your token stays in memory and is cleared when you disconnect or reload.</p>{!token ? <form onSubmit={connect}><label className={styles.field}>GitHub access token<input type="password" autoComplete="off" required value={inputToken} onChange={(e) => setInputToken(e.target.value)} placeholder="github_pat_..." /></label><button className={styles.primary} disabled={busy}>{busy ? "Connecting…" : "Connect GitHub"}</button><a className={styles.helpLink} href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">Create a token <ArrowUpRight size={14} /></a></form> : <button className={styles.wideButton} disabled={busy} onClick={() => { setToken(""); setSha(""); setNotice("Disconnected. Your draft remains in this tab."); }}><SignOut size={17} />Disconnect</button>}</div></section>
          <section className={styles.panel}><div className={styles.sideContent}><p className={styles.eyebrow}>02 / REVIEW & PUBLISH</p><h2>{changed + removed} pending changes</h2><p>Publishing creates a commit on main and starts the portfolio deployment.</p><ul className={styles.changeList}>{projects.filter((p) => JSON.stringify(p) !== JSON.stringify((JSON.parse(baseline) as Project[]).find((b) => b.slug === p.slug))).map((p) => <li key={p.slug}><span>{p.title}</span><span>Updated / added</span></li>)}{(JSON.parse(baseline) as Project[]).filter((p) => !projects.some((v) => v.slug === p.slug)).map((p) => <li key={p.slug}><span>{p.title}</span><span>Removed</span></li>)}</ul><div className={styles.publishActions}><button className={styles.primary} disabled={!token || !dirty || busy} onClick={publish}><RocketLaunch size={17} />{busy ? "Working…" : "Publish changes"}</button><button onClick={exportDraft}><DownloadSimple size={17} />Export draft</button></div><label className={styles.importLabel}>Restore an exported draft<input type="file" accept="application/json,.json" disabled={busy} onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { const data: unknown = JSON.parse(await file.text()); validateProjects(data); if (dirty && !window.confirm("Replace the current unpublished draft?")) return; setProjects(data); setNotice("Draft imported. Review it before publishing."); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Invalid draft file."); } }} /></label>{commit && <div className={styles.deployment}><p role="status">{deployment}</p><button disabled={busy} onClick={async () => { setBusy(true); try { setDeployment(await deploymentStatus(token, commit)); } catch (error) { setError(error instanceof Error ? error.message : "Could not check deployment."); } finally { setBusy(false); } }}>Refresh deployment status</button></div>}<a className={styles.helpLink} href={`${repositoryUrl}/actions/workflows/deploy.yml`} target="_blank" rel="noreferrer">Open deployment history <ArrowUpRight size={14} /></a></div></section>
        </div>}
        <footer className={styles.footer}><span>YK / PORTFOLIO ADMIN</span><span>Built around your work.</span></footer>
      </div>
    </div>

    {editor && <div className={styles.overlay}><section role="dialog" aria-modal="true" aria-labelledby="editor-title" className={styles.editor} onKeyDown={(event) => { if (event.key === "Escape") { if (window.confirm("Close this editor and discard its unsaved fields?")) setEditor(null); } if (event.key === "Tab") { const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, a[href]')); const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } }}>
      <div className={styles.editorHeader}><div><p className={styles.eyebrow}>{originalSlug ? "EDIT PROJECT" : "NEW PROJECT"}</p><h2 id="editor-title">{editor.title || "Your next case study"}</h2></div><button autoFocus aria-label="Close editor" onClick={() => { if (window.confirm("Close this editor and discard its unsaved fields?")) setEditor(null); }}><X size={22} /></button></div>
      {error && <div role="alert" className={styles.error}>{error}</div>}
      <div className={styles.editorTabs}><button className={!preview ? styles.selectedTab : ""} onClick={() => setPreview(false)}>Project details</button><button className={preview ? styles.selectedTab : ""} onClick={() => setPreview(true)}><Eye size={16} />Draft preview</button></div>
      {preview ? <article className={styles.preview}><p className={styles.eyebrow}>{editor.year || "UNDATED"} / {editor.role}</p><h2>{editor.title}</h2><h3>{editor.subtitle}</h3><p>{editor.summary}</p>{editor.overview.map((p, i) => <p key={i}>{p}</p>)}<div className={styles.tags}>{editor.stack.map((s, i) => <span key={i}>{s}</span>)}</div><small>Summary preview. Screenshots remain managed in the media registry.</small></article> : <div className={styles.editorFields}>
        {([ ["title", "Project name"], ["slug", "Project URL slug"], ["subtitle", "Subtitle"], ["role", "Your role"], ["year", "Year (optional)"], ["date", "Display date (optional)"] ] as const).map(([key, label]) => <label key={key} className={styles.field}>{label}<input disabled={key === "slug" && originalSlug !== null} value={editor[key] ?? ""} onChange={(e) => setEditor({ ...editor, [key]: ["year", "date"].includes(key) ? e.target.value || null : e.target.value })} /></label>)}
        <label className={`${styles.field} ${styles.full}`}>Summary<textarea rows={3} value={editor.summary} onChange={(e) => setEditor({ ...editor, summary: e.target.value })} /></label>
        <label className={`${styles.field} ${styles.full}`}>Overview (one paragraph per line)<textarea rows={4} value={editor.overview.join("\n")} onChange={(e) => setEditor({ ...editor, overview: e.target.value.split("\n") })} /></label>
        <label className={`${styles.field} ${styles.full}`}>Technologies (one per line)<textarea rows={3} value={editor.stack.join("\n")} onChange={(e) => setEditor({ ...editor, stack: e.target.value.split("\n") })} /></label>
        <details className={styles.full}><summary>Case study details & links · JSON</summary><p className={styles.detailsHelp}>Optional sections: challenge, approach, outcome, credits (text lists); architecture (text); capabilities (label/body); links (label/href). Existing content is preserved.</p><label className={styles.field}>Case study JSON<textarea className={styles.code} rows={12} value={advanced} onChange={(e) => setAdvanced(e.target.value)} spellCheck={false} /></label></details>
      </div>}
      <div className={styles.editorFooter}>{originalSlug && <button className={styles.danger} disabled={projects.length <= 1} onClick={() => { if (window.confirm(`Remove ${editor.title} from the draft? The live site changes only after publishing.`)) { setProjects(projects.filter((p) => p.slug !== originalSlug).map((p, i) => ({ ...p, index: String(i + 1).padStart(2, "0") }))); setEditor(null); } }}><Trash size={17} />Remove project</button>}<button className={styles.primary} onClick={saveEditor}>Save to draft <CheckCircle size={17} /></button></div>
    </section></div>}
  </div>;
}
