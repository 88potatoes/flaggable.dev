"use client";

import Link from "next/link";
import { FormEvent, type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Flag, Plus, Search } from "lucide-react";

import { Alert } from "@flaggable/ui/alert";
import { Button } from "@flaggable/ui/button";
import { Card } from "@flaggable/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flaggable/ui/dialog";
import { Input } from "@flaggable/ui/input";
import { Skeleton } from "@flaggable/ui/skeleton";
import { Label } from "@flaggable/ui/label";
import { Switch } from "@flaggable/ui/switch";
import { DashboardShell } from "@/components/dashboard-sidebar";
import { FlagTable } from "@/components/flag-table";
import { useMutateCreateFlag, useMutateUpdateFlag, useQueryFlags } from "@/slices/flags/queries";
import { useMutateCreateProject, useQueryProjects } from "@/slices/projects/queries";
import { useQuerySchemas } from "@/slices/value-schemas/queries";
import { toast } from "sonner";

export default function Dashboard() {
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
        onSuccess: (updated) => {
          const message = `${updated.name} is now ${updated.enabled ? "on" : "off"}.`;
          setNotice(message);
          toast.success("Flag updated", { description: message });
        },
        onError: (mutationError) => {
          setError(mutationError.message);
          toast.error("Could not update flag", { description: mutationError.message });
        },
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
          const message = `${project.name} is ready.`;
          setNotice(message);
          toast.success("Project created", { description: message });
        },
        onError: (mutationError) => {
          setError(mutationError.message);
          toast.error("Could not create project", { description: mutationError.message });
        },
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
        name: newFlagName,
        fallbackValue: false,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewFlagName("");
          setNotice("Flag created.");
          toast.success("Flag created", { description: `${newFlagName} is ready to use.` });
        },
        onError: (mutationError) => {
          setError(mutationError.message);
          toast.error("Could not create flag", { description: mutationError.message });
        },
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
          <Card className="project-empty-state" aria-busy="true">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-8 w-full" />
          </Card>
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
              <Button type="button" variant="primary" onClick={() => setIsCreateOpen(true)}>
                <Plus /> New flag
              </Button>
            </div>

            {alerts && (
              <Alert
                variant={
                  error || projectsQuery.error || flagsQuery.error ? "destructive" : "success"
                }
                className="mb-6 flex items-center justify-between"
              >
                <span>
                  {error || projectsQuery.error?.message || flagsQuery.error?.message || notice}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setError("");
                    setNotice("");
                  }}
                  aria-label="Dismiss message"
                >
                  ×
                </Button>
              </Alert>
            )}

            <div className="dashboard-grid" id="flags">
              <Card className="flags-panel gap-0 p-0">
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
                  <div className="search-field">
                    <Search aria-hidden="true" />
                    <Label htmlFor="dashboard-flag-search" className="sr-only">
                      Search flags
                    </Label>
                    <Input
                      id="dashboard-flag-search"
                      placeholder="Search flags"
                      value={query}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setQuery(event.target.value)
                      }
                    />
                  </div>
                  <Button type="button" variant="outline" className="filter-button">
                    All flags <ChevronDown />
                  </Button>
                </div>
                <FlagTable
                  flags={visibleFlags}
                  selectedFlagId={selectedFlag?.id}
                  onSelect={(flagId) => setSelected(flags.findIndex((flag) => flag.id === flagId))}
                  isLoading={flagsQuery.isLoading}
                  emptyMessage="No flags yet. Create your first flag to get started."
                />
              </Card>

              <Card className="activity-panel gap-0 p-0" id="activity">
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
              </Card>
            </div>

            {selectedFlag && (
              <Card className="change-inspector">
                <div className="inspector-label">SELECTED FLAG</div>
                <div className="inspector-content">
                  <div>
                    <h2>{selectedFlag.name}</h2>
                    <p>
                      {selectedFlag.description ?? "No description yet."} · Last changed{" "}
                      {formatUpdated(selectedFlag.updatedAt)}
                    </p>
                  </div>
                  <Switch
                    checked={selectedFlag.enabled}
                    onCheckedChange={() => toggleFlag(selected)}
                    disabled={updateFlag.isPending}
                    aria-label={`Turn ${selectedFlag.enabled ? "off" : "on"} ${selectedFlag.name}`}
                  />
                  <span className="inspector-action">
                    {selectedFlag.enabled ? "Enabled" : "Currently off"}
                  </span>
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() => setError("Flag editing is next; use the CRUD API for now.")}
                  >
                    Edit flag <ArrowUpRight />
                  </Button>
                </div>
              </Card>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogContent className="create-panel">
                <DialogHeader>
                  <DialogTitle>Create a flag</DialogTitle>
                  <DialogDescription>
                    Flags need a value schema so every result stays valid.
                  </DialogDescription>
                </DialogHeader>
                {schemasQuery.data?.length === 0 ? (
                  <div className="inline-empty">
                    Create a value schema first, then return here to create a flag.
                  </div>
                ) : (
                  <form className="grid gap-4" onSubmit={submitCreateFlag}>
                    <div className="grid gap-2">
                      <Label htmlFor="dashboard-new-flag-name">Flag name</Label>
                      <Input
                        id="dashboard-new-flag-name"
                        required
                        value={newFlagName}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setNewFlagName(event.target.value)
                        }
                        placeholder="Checkout redesign"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createFlag.isPending}>
                        {createFlag.isPending ? "Creating…" : "Create flag"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
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
    <Card className="project-empty-state">
      <div className="project-empty-icon">
        <Flag />
      </div>
      <h1>Create your first project</h1>
      <p>Projects keep your feature flags organized. Create one to get started.</p>
      {message && (
        <Alert variant={isError ? "destructive" : "success"} className="mb-5">
          {message}
        </Alert>
      )}
      <form onSubmit={onSubmit}>
        <Label htmlFor="project-name" className="sr-only">
          Project name
        </Label>
        <Input
          id="project-name"
          placeholder="Project name"
          value={newProjectName}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setNewProjectName(event.target.value)}
          required
        />
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create project"}
        </Button>
      </form>
    </Card>
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
