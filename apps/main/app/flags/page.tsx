"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Search } from "lucide-react";

import { Badge } from "@flaggable/ui/badge";
import { Button } from "@flaggable/ui/button";
import { Input } from "@flaggable/ui/input";
import { useFlagsQuery, useProjectsQuery } from "@/lib/queries";
import { DashboardShell } from "@/components/dashboard-sidebar";

export default function FlagsPage() {
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useState("");
  const projectsQuery = useProjectsQuery();
  const flagsQuery = useFlagsQuery(projectId);
  const projects = projectsQuery.data ?? [];
  const flags = flagsQuery.data ?? [];

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);
  const visibleFlags = flags.filter((flag) =>
    `${flag.name} ${flag.description ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <DashboardShell
      projects={projects}
      projectId={projectId}
      flagCount={flags.length}
      onProjectChange={setProjectId}
    >
      <div className="dashboard-inner flags-page">
        {projectsQuery.isLoading ? (
          <div className="project-empty-state">
            <p>Loading projects…</p>
          </div>
        ) : projects.length === 0 ? (
          <section className="project-empty-state">
            <div className="project-empty-icon">
              <FlagIcon />
            </div>
            <h1>Create your first project</h1>
            <p>Projects keep your feature flags organized. Create one to get started.</p>
            <Button className="button-primary" type="button">
              Create project
            </Button>
          </section>
        ) : (
          <>
            <div className="dashboard-title-row">
              <div>
                <h1>Feature flags</h1>
                <p className="dashboard-subtitle">Manage and monitor your releases.</p>
              </div>
              <Button type="button" className="button-primary">
                <Plus /> New flag
              </Button>
            </div>

            <section className="flags-panel flags-page-panel">
              <div className="panel-heading">
                <div>
                  <h2>All flags</h2>
                  <p>{flags.length} flags in this project.</p>
                </div>
                <ArrowUpRight className="page-icon" aria-hidden="true" />
              </div>
              <div className="flag-toolbar">
                <label className="search-field">
                  <Search />
                  <Input
                    aria-label="Search flags"
                    placeholder="Search flags"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>
              <div className="flags-table">
                <div className="flag-row table-heading">
                  <span>Flag</span>
                  <span>Status</span>
                  <span>Updated</span>
                  <span />
                </div>
                {flagsQuery.isLoading && projectId ? (
                  <div className="table-empty">Loading flags…</div>
                ) : visibleFlags.length === 0 ? (
                  <div className="table-empty">No flags match your search.</div>
                ) : (
                  visibleFlags.map((flag) => (
                    <div className="flag-row" key={flag.id}>
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
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function FlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="page-icon">
      <path
        d="M5 5h14v14H5zM9 9h6M9 12h6M9 15h3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - date.valueOf()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}
