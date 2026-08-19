"use client";

import { FormEvent, type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";

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
import { DashboardShell } from "@/components/dashboard-sidebar";
import { FlagBrowser } from "@/components/flag-browser";
import { FlagDetail } from "@/components/flag-detail";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMutateCreateFlag, useQueryFlags } from "@/slices/flags/queries";
import { useMutateCreateProject, useQueryProjects } from "@/slices/projects/queries";
import { useQuerySchemas } from "@/slices/value-schemas/queries";
import { toast } from "sonner";

export default function Dashboard() {
  const [selectedFlagId, setSelectedFlagId] = useState("");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const projectsQuery = useQueryProjects();
  const projects = projectsQuery.data ?? [];
  const schemasQuery = useQuerySchemas(projectId);
  const debouncedQuery = useDebouncedValue(query);
  const flagsQuery = useQueryFlags(projectId, debouncedQuery);
  const createFlag = useMutateCreateFlag(projectId);
  const createProject = useMutateCreateProject();
  const flags = useMemo(
    () => flagsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [flagsQuery.data],
  );
  const selectedFlag = flags.find((flag) => flag.id === selectedFlagId) ?? flags[0];

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setSelectedFlagId("");
    setError("");
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
      onProjectChange={selectProject}
      onNewFlag={() => setIsCreateOpen(true)}
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

            <div className="flag-workspace" id="flags">
              <FlagBrowser
                flags={flags}
                search={query}
                onSearchChange={setQuery}
                selectedFlagId={selectedFlag?.id}
                onSelect={setSelectedFlagId}
                isLoading={flagsQuery.isLoading}
                isFetchingNextPage={flagsQuery.isFetchingNextPage}
                hasNextPage={Boolean(flagsQuery.hasNextPage)}
                onLoadMore={() => {
                  if (flagsQuery.hasNextPage && !flagsQuery.isFetchingNextPage)
                    flagsQuery.fetchNextPage();
                }}
              />
              <FlagDetail flag={selectedFlag} projectId={projectId} />
            </div>

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
