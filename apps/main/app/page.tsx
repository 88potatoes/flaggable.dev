"use client";

import Link from "next/link";
import { FormEvent, type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Flag, Plus, Search } from "lucide-react";

import { Badge } from "@flaggable/ui/badge";
import { Button } from "@flaggable/ui/button";
import { Input } from "@flaggable/ui/input";
import { Switch } from "@flaggable/ui/switch";
import { DashboardShell } from "@/components/dashboard-sidebar";
import { useMutateCreateFlag, useMutateUpdateFlag, useQueryFlags } from "@/slices/flags/queries";
import type { Flag as FlagRecord } from "@flaggable/contracts";
import { useMutateCreateProject, useQueryProjects } from "@/slices/projects/queries";
import { useQuerySchemas } from "@/slices/value-schemas/queries";

export default function Dashboard() {
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagName, setNewFlagName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const projectsQuery = useQueryProjects();
  const projects = projectsQuery.data ?? [];
  const flagsQuery = useQueryFlags(projectId);
  const schemasQuery = useQuerySchemas(projectId);
  const updateFlag = useMutateUpdateFlag(projectId);
  const createFlag = useMutateCreateFlag(projectId);
  const createProject = useMutateCreateProject();
  const flags = flagsQuery.data ?? [];
  const selectedFlag = flags[selected] ?? flags[0];
  const visibleFlags = flags.filter((flag) =>
    `${flag.name} ${flag.description ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setSelected(0);
    setError("");
  }

  function toggleFlag(index: number) {
    const flag = flags[index];
    if (!flag) return;
    setError("");
    updateFlag.mutate(
      { flagId: flag.id, values: { enabled: !flag.enabled } },
      {
        onSuccess: (updated) =>
          setNotice(`${updated.key} is now ${updated.enabled ? "on" : "off"}.`),
        onError: (mutationError) => setError(mutationError.message),
      },
    );
  }

  function submitCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    setError("");
    setNotice("");
    createProject.mutate(
      { name },
      {
        onSuccess: (project) => {
          setNewProjectName("");
          setProjectId(project.id);
          setNotice(`${project.name} is ready.`);
        },
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
      {
        valueSchemaId: schema.id,
        key: newFlagKey,
        name: newFlagName || newFlagKey,
        fallbackValue: false,
      },
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

  const alerts = projectsQuery.error || flagsQuery.error || error || notice;

  return (
    <DashboardShell
      projects={projects}
      projectId={projectId}
      flagCount={flags.length}
      onProjectChange={selectProject}
    >
      <div className="dashboard-inner">
        {projectsQuery.isLoading ? (
          <div className="project-empty-state">
            <p>Loading projects…</p>
          </div>
        ) : projects.length === 0 ? (
          <ProjectEmptyState
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            onSubmit={submitCreateProject}
            isPending={createProject.isPending}
            message={error || projectsQuery.error?.message || notice}
            isError={Boolean(error || projectsQuery.error)}
          />
        ) : (
          <>
            <div className="dashboard-title-row">
              <div>
                <h1>Overview</h1>
                <p className="dashboard-subtitle">Manage the flags powering your product.</p>
              </div>
              <Button
                type="button"
                className="button-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus /> New flag
              </Button>
            </div>

            {alerts && (
              <div
                className={`dashboard-alert ${error || projectsQuery.error || flagsQuery.error ? "is-error" : "is-success"}`}
                role="status"
              >
                <span>
                  {error || projectsQuery.error?.message || flagsQuery.error?.message || notice}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                  }}
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            )}

            <div className="dashboard-grid" id="flags">
              <section className="flags-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Feature flags</h2>
                    <p>Manage and monitor your releases.</p>
                  </div>
                  <Link href="/flags" className="panel-link">
                    View all <ArrowUpRight />
                  </Link>
                </div>
                <div className="flag-toolbar">
                  <label className="search-field">
                    <Search />
                    <Input
                      aria-label="Search flags"
                      placeholder="Search flags"
                      value={query}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setQuery(event.target.value)
                      }
                    />
                  </label>
                  <Button type="button" variant="outline" className="filter-button">
                    All flags <ChevronDown />
                  </Button>
                </div>
                <FlagTable
                  flags={flags}
                  visibleFlags={visibleFlags}
                  selected={selected}
                  setSelected={setSelected}
                  isLoading={flagsQuery.isLoading}
                />
              </section>

              <aside className="activity-panel" id="activity">
                <div className="panel-heading">
                  <div>
                    <h2>Recent activity</h2>
                    <p>The latest changes in your workspace.</p>
                  </div>
                  <Link href="#activity" className="panel-link">
                    View all <ArrowUpRight />
                  </Link>
                </div>
                <div className="activity-list">
                  <div className="activity-day">TODAY</div>
                  <ActivityItem
                    icon={<ArrowUpRight />}
                    tone="orange"
                    title="Feature flags"
                    body="Activity history will appear here"
                    actor="System"
                    time="Ready"
                  />
                  <div className="activity-day yesterday">NEXT</div>
                  <ActivityItem
                    icon={<Flag />}
                    tone="blue"
                    title="Targeting rules"
                    body="Build ordered conditions from the flag detail view"
                    actor="flaggable"
                    time="Coming soon"
                  />
                </div>
              </aside>
            </div>

            {selectedFlag && (
              <section className="change-inspector">
                <div className="inspector-label">SELECTED FLAG</div>
                <div className="inspector-content">
                  <div>
                    <h2>{selectedFlag.key}</h2>
                    <p>
                      {selectedFlag.description ?? "No description yet."} · Last changed{" "}
                      {formatUpdated(selectedFlag.updatedAt)}
                    </p>
                  </div>
                  <Switch
                    checked={selectedFlag.enabled}
                    onCheckedChange={() => toggleFlag(selected)}
                    disabled={updateFlag.isPending}
                    aria-label={`Turn ${selectedFlag.enabled ? "off" : "on"} ${selectedFlag.key}`}
                  />
                  <span className="inspector-action">
                    {selectedFlag.enabled ? "Enabled" : "Currently off"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="button-quiet"
                    onClick={() => setError("Flag editing is next; use the CRUD API for now.")}
                  >
                    Edit flag <ArrowUpRight />
                  </Button>
                </div>
              </section>
            )}

            {isCreateOpen && (
              <div
                className="dialog-backdrop"
                role="presentation"
                onMouseDown={() => setIsCreateOpen(false)}
              >
                <form
                  className="create-panel"
                  onSubmit={submitCreateFlag}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <div className="create-panel-heading">
                    <div>
                      <h2>Create a flag</h2>
                      <p>Flags need a value schema so every result stays valid.</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="dialog-close"
                      onClick={() => setIsCreateOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </Button>
                  </div>
                  {schemasQuery.data?.length === 0 ? (
                    <div className="inline-empty">
                      Create a value schema first, then return here to create a flag.
                    </div>
                  ) : (
                    <>
                      <label>
                        Flag key
                        <Input
                          required
                          pattern="[a-z0-9_-]+"
                          value={newFlagKey}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setNewFlagKey(event.target.value)
                          }
                          placeholder="checkout-redesign"
                        />
                      </label>
                      <label>
                        Display name
                        <Input
                          value={newFlagName}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setNewFlagName(event.target.value)
                          }
                          placeholder="Checkout redesign"
                        />
                      </label>
                      <Button
                        className="button-primary"
                        type="submit"
                        disabled={createFlag.isPending}
                      >
                        {createFlag.isPending ? "Creating…" : "Create flag"}
                      </Button>
                    </>
                  )}
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function ProjectEmptyState({
  newProjectName,
  setNewProjectName,
  onSubmit,
  isPending,
  message,
  isError,
}: {
  newProjectName: string;
  setNewProjectName: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  message: string;
  isError: boolean;
}) {
  return (
    <section className="project-empty-state">
      <div className="project-empty-icon">
        <Flag />
      </div>
      <h1>Create your first project</h1>
      <p>Projects keep your feature flags organized. Create one to get started.</p>
      {message && (
        <div className={`dashboard-alert ${isError ? "is-error" : "is-success"}`} role="status">
          <span>{message}</span>
        </div>
      )}
      <form onSubmit={onSubmit}>
        <Input
          aria-label="Project name"
          placeholder="Project name"
          value={newProjectName}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setNewProjectName(event.target.value)}
          required
        />
        <Button className="button-primary" type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create project"}
        </Button>
      </form>
    </section>
  );
}

function FlagTable({
  flags,
  visibleFlags,
  selected,
  setSelected,
  isLoading,
}: {
  flags: FlagRecord[];
  visibleFlags: FlagRecord[];
  selected: number;
  setSelected: (index: number) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flags-table">
      <div className="flag-row table-heading">
        <span>Flag</span>
        <span>Status</span>
        <span>Updated</span>
        <span />
      </div>
      {isLoading ? (
        <div className="table-empty">Loading flags…</div>
      ) : visibleFlags.length === 0 ? (
        <div className="table-empty">No flags yet. Create your first flag to get started.</div>
      ) : (
        visibleFlags.map((flag) => {
          const originalIndex = flags.indexOf(flag);
          return (
            <button
              type="button"
              className={`flag-row ${selected === originalIndex ? "selected" : ""}`}
              key={flag.id}
              onClick={() => setSelected(originalIndex)}
            >
              <span className="flag-name">
                <i className={`status-dot ${flag.enabled ? "green" : "purple"}`} />
                <span>
                  <b>{flag.key}</b>
                  <small>{flag.description ?? flag.name}</small>
                </span>
              </span>
              <span>
                <Badge
                  variant={flag.enabled ? "default" : "secondary"}
                  className={`rollout-pill ${flag.enabled ? "on" : "off"}`}
                >
                  <i />
                  {flag.enabled ? "Enabled" : "Off"}
                </Badge>
              </span>
              <span className="updated">{formatUpdated(flag.updatedAt)}</span>
              <span className="row-arrow">
                <ArrowUpRight />
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - date.valueOf()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}

function ActivityItem({
  icon,
  tone,
  title,
  body,
  actor,
  time,
}: {
  icon: ReactNode;
  tone: string;
  title: string;
  body: string;
  actor: string;
  time: string;
}) {
  return (
    <div className="activity-item">
      <span className={`activity-icon ${tone}`}>{icon}</span>
      <div>
        <b>{title}</b>
        <p>{body}</p>
        <small>
          {actor} · {time}
        </small>
      </div>
    </div>
  );
}
