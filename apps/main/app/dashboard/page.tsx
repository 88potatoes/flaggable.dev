"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  useCreateFlagMutation,
  useFlagsQuery,
  useProjectsQuery,
  useSchemasQuery,
  useUpdateFlagMutation,
  type Flag,
} from "@/lib/queries";

type ApiError = { error: string; details?: unknown };

const previewFlags: Flag[] = [
  { id: "demo-checkout", key: "checkout-redesign", name: "checkout-redesign", description: "New checkout experience", enabled: true, fallbackValue: false, archivedAt: null, updatedAt: new Date().toISOString() },
  { id: "demo-search", key: "new-search-api", name: "new-search-api", description: "Faster search infrastructure", enabled: true, fallbackValue: false, archivedAt: null, updatedAt: new Date().toISOString() },
  { id: "demo-billing", key: "billing-portal", name: "billing-portal", description: "Self-serve billing portal", enabled: true, fallbackValue: false, archivedAt: null, updatedAt: new Date().toISOString() },
  { id: "demo-recommendations", key: "smart-recommendations", name: "smart-recommendations", description: "Personalized recommendations", enabled: false, fallbackValue: false, archivedAt: null, updatedAt: new Date().toISOString() },
];

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="nav-svg" aria-hidden="true">{children}</span>;
}

function ArrowUpRight() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="icon"><path d="M5 15 15 5M7 5h8v8" /></svg>;
}

export default function Dashboard() {
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagName, setNewFlagName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const projectsQuery = useProjectsQuery();
  const flagsQuery = useFlagsQuery(projectId);
  const schemasQuery = useSchemasQuery(projectId);
  const updateFlag = useUpdateFlagMutation(projectId);
  const createFlag = useCreateFlagMutation(projectId);
  const projects = projectsQuery.data ?? [];
  const flags = projectId ? (flagsQuery.data ?? []) : previewFlags;
  const selectedFlag = flags[selected] ?? flags[0];
  const visibleFlags = flags.filter((flag) => `${flag.name} ${flag.description ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const activeCount = flags.filter((flag) => flag.enabled && !flag.archivedAt).length;

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setSelected(0);
    setError("");
  }

  function toggleFlag(index: number) {
    const flag = flags[index];
    if (!projectId || !flag || flag.id.startsWith("demo-")) {
      setError("Select a saved project before changing a flag.");
      return;
    }
    setError("");
    updateFlag.mutate(
      { flagId: flag.id, enabled: !flag.enabled },
      {
        onSuccess: (updated) => setNotice(`${updated.key} is now ${updated.enabled ? "on" : "off"}.`),
        onError: (mutationError) => setError(mutationError.message),
      },
    );
  }

  function submitCreateFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const schema = schemasQuery.data?.[0];
    if (!schema) {
      setError("Create a value schema first, then create a flag.");
      return;
    }
    createFlag.mutate(
      { valueSchemaId: schema.id, key: newFlagKey, name: newFlagName || newFlagKey, fallbackValue: false },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewFlagKey("");
          setNewFlagName("");
          setNotice("Flag created.");
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    );
  }

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <Link href="https://flaggable.dev" className="brand brand-dark" aria-label="flaggable.dev home">
          <span className="brand-mark">f<span>.</span></span>
          <span>flaggable<span className="brand-domain">.dev</span></span>
        </Link>
        <label className="workspace-switcher">
          <span className="workspace-avatar">A</span>
          <span>
            <b>Project</b>
            <select aria-label="Select project" value={projectId} onChange={(event) => selectProject(event.target.value)}>
              <option value="">Demo preview</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </span>
          <span className="chevron">⌄</span>
        </label>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="app-nav">
          <Link href="/dashboard" className="app-nav-item active"><Icon>◈</Icon>Overview</Link>
          <Link href="#flags" className="app-nav-item"><Icon>◇</Icon>Feature flags <span className="nav-count">{flags.length}</span></Link>
          <Link href="#environments" className="app-nav-item"><Icon>⌁</Icon>Environments</Link>
        </nav>
        <div className="sidebar-section-label">Manage</div>
        <nav className="app-nav">
          <Link href="#activity" className="app-nav-item"><Icon>◌</Icon>Activity</Link>
          <Link href="#settings" className="app-nav-item"><Icon>⊙</Icon>Settings</Link>
        </nav>
        <div className="sidebar-footer"><span className="online-dot" /><span><b>All systems operational</b><small>Updated 2 min ago</small></span></div>
      </aside>

      <section className="app-content">
        <header className="app-header"><div className="breadcrumb">{projects.find((project) => project.id === projectId)?.name ?? "Demo preview"} <span>/</span> Overview</div><div className="header-actions"><button type="button" className="icon-button" aria-label="Notifications">♢<i /></button><span className="header-divider" /><div className="user-avatar">AL</div><span className="user-name">Alex Lee</span><span className="chevron">⌄</span></div></header>
        <div className="dashboard-inner">
          <div className="dashboard-title-row"><div><p className="dashboard-kicker">MONDAY, MAY 12, 2025</p><h1>Good morning, Alex.</h1><p className="dashboard-subtitle">Here&apos;s what&apos;s moving across your workspace.</p></div><button type="button" className="button button-primary" onClick={() => setIsCreateOpen(true)}><span>+</span> New flag</button></div>
          {(projectsQuery.error || flagsQuery.error || error || notice) && <div className={`dashboard-alert ${error || projectsQuery.error || flagsQuery.error ? "is-error" : "is-success"}`} role="status"><span>{error || projectsQuery.error?.message || flagsQuery.error?.message || notice}</span><button type="button" onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss message">×</button></div>}
          <div className="summary-row"><div className="summary-item"><span>Active flags</span><strong>{activeCount}</strong><small><b className="green-text">Live</b> in this project</small></div><div className="summary-item"><span>Value schemas</span><strong>{schemasQuery.data?.length ?? 0}</strong><small><b className="blue-text">Pinned</b> value types</small></div><div className="summary-item"><span>Flag changes</span><strong>—</strong><small>Activity tracking next</small></div><div className="summary-health"><span className="online-dot" /><div><b>API connected</b><small>Data syncs automatically</small></div></div></div>
          <div className="dashboard-grid" id="flags">
            <section className="flags-panel"><div className="panel-heading"><div><h2>Feature flags</h2><p>Manage and monitor your releases.</p></div><Link href="#all-flags" className="panel-link">View all <ArrowUpRight /></Link></div><div className="flag-toolbar"><div className="search-field"><span>⌕</span><input aria-label="Search flags" placeholder="Search flags" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button type="button" className="filter-button">All flags <span>⌄</span></button></div><div className="flags-table"><div className="flag-row table-heading"><span>Flag</span><span>Project</span><span>Status</span><span>Updated</span><span /></div>{flagsQuery.isLoading && projectId ? <div className="table-empty">Loading flags…</div> : visibleFlags.length === 0 ? <div className="table-empty">No flags yet. Create your first flag to get started.</div> : visibleFlags.map((flag) => { const originalIndex = flags.indexOf(flag); return <button type="button" className={`flag-row ${selected === originalIndex ? "selected" : ""}`} key={flag.id} onClick={() => setSelected(originalIndex)}><span className="flag-name"><i className={`status-dot ${flag.enabled ? "green" : "purple"}`} /><span><b>{flag.key}</b><small>{flag.description ?? flag.name}</small></span></span><span className="environment"><i className="env-dot" />{projectId ? "Project" : "Preview"}</span><span><span className={`rollout-pill ${flag.enabled ? "on" : "off"}`}><i />{flag.enabled ? "Enabled" : "Off"}</span></span><span className="updated">{formatUpdated(flag.updatedAt)}</span><span className="row-arrow">→</span></button>; })}</div></section>
            <aside className="activity-panel" id="activity"><div className="panel-heading"><div><h2>Recent activity</h2><p>The latest changes in your workspace.</p></div><Link href="#activity" className="panel-link">View all <ArrowUpRight /></Link></div><div className="activity-list"><div className="activity-day">TODAY</div><ActivityItem icon="↗" tone="orange" title="Feature flags" body="Activity history will appear here" actor="System" time="Ready" /><div className="activity-day yesterday">NEXT</div><ActivityItem icon="↑" tone="blue" title="Targeting rules" body="Build ordered conditions from the flag detail view" actor="flaggable" time="Coming soon" /></div></aside>
          </div>
          {selectedFlag && <section className="change-inspector" id="environments"><div className="inspector-label">SELECTED FLAG</div><div className="inspector-content"><div><h2>{selectedFlag.key}</h2><p>{selectedFlag.description ?? "No description yet."} · Last changed {formatUpdated(selectedFlag.updatedAt)}</p></div><button type="button" className={`toggle ${selectedFlag.enabled ? "on" : ""}`} aria-label={`Turn ${selectedFlag.enabled ? "off" : "on"} ${selectedFlag.key}`} onClick={() => toggleFlag(selected)} disabled={updateFlag.isPending}><span /></button><span className="inspector-action">{selectedFlag.enabled ? "Enabled" : "Currently off"}</span><button type="button" className="button button-quiet" onClick={() => setError("Flag editing is next; use the CRUD API for now.")}>Edit flag <ArrowUpRight /></button></div></section>}
          {isCreateOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setIsCreateOpen(false)}><form className="create-panel" onSubmit={submitCreateFlag} onMouseDown={(event) => event.stopPropagation()}><div className="create-panel-heading"><div><h2>Create a flag</h2><p>Flags need a value schema so every result stays valid.</p></div><button type="button" className="dialog-close" onClick={() => setIsCreateOpen(false)} aria-label="Close">×</button></div>{!projectId ? <div className="inline-empty">Select a saved project in the sidebar to create a flag.</div> : schemasQuery.data?.length === 0 ? <div className="inline-empty">Create a value schema first, then return here to create a flag.</div> : <><label>Flag key<input required pattern="[a-z0-9_-]+" value={newFlagKey} onChange={(event) => setNewFlagKey(event.target.value)} placeholder="checkout-redesign" /></label><label>Display name<input value={newFlagName} onChange={(event) => setNewFlagName(event.target.value)} placeholder="Checkout redesign" /></label><button className="button button-primary" type="submit" disabled={createFlag.isPending}>{createFlag.isPending ? "Creating…" : "Create flag"}</button></>}</form></div>}
        </div>
      </section>
    </main>
  );
}

function formatUpdated(value: string) { const date = new Date(value); if (Number.isNaN(date.valueOf())) return "Recently"; const minutes = Math.max(1, Math.round((Date.now() - date.valueOf()) / 60000)); return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`; }

function ActivityItem({ icon, tone, title, body, actor, time }: { icon: string; tone: string; title: string; body: string; actor: string; time: string }) { return <div className="activity-item"><span className={`activity-icon ${tone}`}>{icon}</span><div><b>{title}</b><p>{body}</p><small>{actor} · {time}</small></div></div>; }
