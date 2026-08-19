"use client";

import { FormEvent, type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Flag, LoaderCircle } from "lucide-react";

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
import { CommandPalette } from "@/components/command-palette";
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
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");
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

  useEffect(() => {
    function handleCommandShortcut(event: KeyboardEvent) {
      if (projectId && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen(true);
      }
    }

    window.addEventListener("keydown", handleCommandShortcut);
    return () => window.removeEventListener("keydown", handleCommandShortcut);
  }, []);

  function openCreateFlag() {
    setIsCommandOpen(false);
    setIsCreateOpen(true);
  }

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
    createProject.mutate(
      { name },
      {
        onSuccess: (project) => {
          setNewProjectName("");
          setProjectId(project.id);
          const message = `${project.name} is ready.`;
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
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewFlagName("");
          toast.success("Flag created", { description: `${newFlagName} is ready to use.` });
        },
        onError: (mutationError) => {
          setError(mutationError.message);
          toast.error("Could not create flag", { description: mutationError.message });
        },
      },
    );
  }

  const alerts = projectsQuery.error || flagsQuery.error || error;

  const flagSidebar =
    projects.length > 0 ? (
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
          if (flagsQuery.hasNextPage && !flagsQuery.isFetchingNextPage) flagsQuery.fetchNextPage();
        }}
      />
    ) : null;

  return (
    <DashboardShell
      projects={projects}
      projectId={projectId}
      onProjectChange={selectProject}
      onNewFlag={openCreateFlag}
      onOpenCommandPalette={() => setIsCommandOpen(true)}
      flagSidebar={flagSidebar}
    >
      <div className="dashboard-inner">
        {selectedFlag ? (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-sm font-bold text-white">
                {selectedFlag.name[0]?.toUpperCase() || "F"}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {selectedFlag.name}
              </h1>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedFlag.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}
              >
                {selectedFlag.enabled ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-base text-gray-600">
              {selectedFlag.description ||
                "Configure targeting conditions and manage rollout for this feature flag."}
            </p>
          </div>
        ) : (
          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Feature Flags</h1>
            <p className="mt-2 text-base text-gray-600">
              Control feature rollouts and manage your application's behavior
            </p>
          </div>
        )}
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
            message={error || projectsQuery.error?.message}
            isError={Boolean(error || projectsQuery.error)}
          />
        ) : (
          <>
            {alerts && (
              <Alert
                variant={
                  error || projectsQuery.error || flagsQuery.error ? "destructive" : "success"
                }
                className="mb-8 flex items-center justify-between rounded-lg border shadow-sm"
              >
                <span className="font-medium">
                  {error || projectsQuery.error?.message || flagsQuery.error?.message}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError("");
                  }}
                  aria-label="Dismiss message"
                  className="h-6 w-6 rounded-md p-0 hover:bg-gray-100"
                >
                  ×
                </Button>
              </Alert>
            )}

            <div className="flag-detail-container">
              {/* Mobile flag browser - only show on small screens when we have flags */}
              <div className="mb-8 block md:hidden">
                {flags.length > 0 && (
                  <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold">Select Flag</h3>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {flags.slice(0, 5).map((flag) => (
                        <button
                          key={flag.id}
                          onClick={() => setSelectedFlagId(flag.id)}
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                            selectedFlag?.id === flag.id
                              ? "bg-orange-50 ring-1 ring-orange-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white ${
                              flag.enabled ? "bg-green-500" : "bg-gray-400"
                            }`}
                          >
                            {flag.name[0]?.toUpperCase() || "F"}
                          </div>
                          <span className="text-sm font-medium">{flag.name}</span>
                        </button>
                      ))}
                      {flags.length > 5 && (
                        <p className="text-xs text-gray-500">+ {flags.length - 5} more flags</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <FlagDetail flag={selectedFlag} projectId={projectId} />
            </div>
            <CommandPalette
              open={isCommandOpen}
              onOpenChange={setIsCommandOpen}
              onCreateFlag={openCreateFlag}
              canCreateFlag={Boolean(projectId)}
            />
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogContent className="create-panel max-w-md">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-xl font-semibold">Create a new flag</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Feature flags need a value schema to ensure consistent results across
                    environments.
                  </DialogDescription>
                </DialogHeader>
                {schemasQuery.data?.length === 0 ? (
                  <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-200">
                        <span className="text-xs font-bold">!</span>
                      </div>
                      <div>
                        <p className="font-medium">Value schema required</p>
                        <p className="mt-1 text-amber-700">
                          Create a value schema first, then return here to create a flag.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form className="grid gap-4" onSubmit={submitCreateFlag}>
                    <div className="space-y-3">
                      <div>
                        <Label
                          htmlFor="dashboard-new-flag-name"
                          className="text-sm font-medium text-gray-900"
                        >
                          Flag name
                        </Label>
                        <Input
                          id="dashboard-new-flag-name"
                          required
                          value={newFlagName}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setNewFlagName(event.target.value)
                          }
                          placeholder="e.g., checkout-redesign"
                          className="mt-2 block w-full rounded-md"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Choose a descriptive name that identifies the feature
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button
                        type="submit"
                        disabled={createFlag.isPending}
                        className="w-full bg-orange-600 hover:bg-orange-700 focus:ring-orange-500/20"
                      >
                        {createFlag.isPending ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Creating flag...
                          </>
                        ) : (
                          "Create feature flag"
                        )}
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
        <Flag className="h-6 w-6" />
      </div>
      <h1>Create your first project</h1>
      <p>
        Projects organize your feature flags and help manage releases across different environments.
      </p>
      {message && (
        <Alert variant={isError ? "destructive" : "success"} className="mb-6">
          {message}
        </Alert>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="project-name" className="sr-only">
            Project name
          </Label>
          <Input
            id="project-name"
            placeholder="Enter project name"
            value={newProjectName}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNewProjectName(event.target.value)
            }
            required
            className="h-12 rounded-lg border-gray-300 text-base"
          />
        </div>
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 w-full bg-orange-600 text-base font-semibold hover:bg-orange-700 focus:ring-orange-500/20"
        >
          {isPending ? (
            <>
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
              Creating project...
            </>
          ) : (
            "Create project"
          )}
        </Button>
      </form>
    </Card>
  );
}
