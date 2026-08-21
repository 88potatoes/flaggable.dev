"use client";

import { FormEvent, type ChangeEvent, useEffect, useMemo, useState } from "react";
import { LoaderCircle, MoreHorizontal, Sparkles } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@flaggable/ui/dropdown-menu";
import { AgentPromptDialog } from "@/components/agent-prompt-dialog";
import { CommandPalette } from "@/components/command-palette";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DashboardShell } from "@/components/dashboard-sidebar";
import { FlagBrowser } from "@/components/flag-browser";
import { FlagDetail } from "@/components/flag-detail";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useMutateArchiveFlag,
  useMutateCreateFlag,
  useMutateUpdateFlag,
  useQueryFlags,
} from "@/slices/flags/queries";
import { useQueryProjects } from "@/slices/projects/queries";
import { useQueryOnboarding } from "@/slices/onboarding/queries";
import { setActiveProjectId } from "@/slices/http";
import { useQuerySchemas } from "@/slices/value-schemas/queries";
import { toast } from "sonner";

function getApiErrorMessage(error: Error, fallback: string) {
  if ("response" in error && error.response instanceof Response) {
    return fallback;
  }
  return error.message || fallback;
}

export default function Dashboard() {
  const [selectedFlagId, setSelectedFlagId] = useState("");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAgentPromptOpen, setIsAgentPromptOpen] = useState(false);
  const [agentPromptFlagName, setAgentPromptFlagName] = useState("");
  const [showManualOnboarding, setShowManualOnboarding] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");
  const [error, setError] = useState("");
  const projectsQuery = useQueryProjects();
  const onboardingQuery = useQueryOnboarding();
  const projects = projectsQuery.data ?? [];
  const hasCompletedOnboarding = onboardingQuery.data?.status === "completed";
  const schemasQuery = useQuerySchemas(projectId);
  const debouncedQuery = useDebouncedValue(query);
  const flagsQuery = useQueryFlags(projectId, debouncedQuery);
  const createFlag = useMutateCreateFlag(projectId);
  const updateFlag = useMutateUpdateFlag(projectId);
  const archiveFlag = useMutateArchiveFlag(projectId);
  const activeProject = projects.find((p) => p.id === projectId);
  const flags = useMemo(
    () => flagsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [flagsQuery.data],
  );
  const selectedFlag = flags.find((flag) => flag.id === selectedFlagId) ?? flags[0];

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  useEffect(() => {
    setActiveProjectId(projectId || null);
  }, [projectId]);

  useEffect(() => {
    function handleCommandShortcut(event: KeyboardEvent) {
      if (projectId && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen(true);
      }
    }

    window.addEventListener("keydown", handleCommandShortcut);
    return () => window.removeEventListener("keydown", handleCommandShortcut);
  }, [projectId]);

  function openCreateFlag() {
    setIsCommandOpen(false);
    setIsCreateOpen(true);
  }

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setSelectedFlagId("");
    setError("");
  }

  function submitCreateFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const schema = schemasQuery.data?.[0];
    if (!schema) {
      setError("Create a value schema first, then create a flag.");
      return;
    }
    const createdName = newFlagName;
    createFlag.mutate(
      {
        valueSchemaId: schema.id,
        name: createdName,
      },
      {
        onSuccess: (flag) => {
          setIsCreateOpen(false);
          setNewFlagName("");
          setSelectedFlagId(flag.id);
          toast.success("Flag created", {
            description: `${flag.name} is ready to use.`,
            action: {
              label: "AI Setup Prompt",
              onClick: () => {
                setAgentPromptFlagName(flag.name);
                setIsAgentPromptOpen(true);
              },
            },
          });
        },
        onError: (mutationError) => {
          const message = getApiErrorMessage(mutationError, "Could not create flag.");
          setError(message);
          toast.error("Could not create flag", { description: message });
        },
      },
    );
  }

  const alerts = projectsQuery.error || flagsQuery.error || error;

  const flagSidebar =
    projects.length > 0 && flags.length > 0 ? (
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
      onNewProject={() => setIsCreateProjectOpen(true)}
      onOpenCommandPalette={() => setIsCommandOpen(true)}
      flagSidebar={flagSidebar}
    >
      <div className="dashboard-inner">
        {selectedFlag && flags.length > 0 && !showManualOnboarding ? (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
                {selectedFlag.name[0]?.toUpperCase() || "F"}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {selectedFlag.name}
              </h1>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedFlag.enabled
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                }`}
              >
                {selectedFlag.enabled ? "Active" : "Inactive"}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAgentPromptFlagName(selectedFlag.name);
                    setIsAgentPromptOpen(true);
                  }}
                  className="gap-1.5 border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--surface-2)] font-medium"
                >
                  <Sparkles className="size-3.5 text-orange-600" />
                  AI Setup Prompt
                </Button>
                <Switch
                  checked={selectedFlag.enabled}
                  onCheckedChange={(enabled: boolean) =>
                    updateFlag.mutate({ flagId: selectedFlag.id, values: { enabled } })
                  }
                  disabled={updateFlag.isPending}
                  aria-label={`${selectedFlag.enabled ? "Disable" : "Enable"} ${selectedFlag.name}`}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      aria-label={`More actions for ${selectedFlag.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setAgentPromptFlagName(selectedFlag.name);
                        setIsAgentPromptOpen(true);
                      }}
                    >
                      <Sparkles className="mr-2 size-4 text-orange-600" />
                      Get AI Agent Prompt
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => archiveFlag.mutate({ flagId: selectedFlag.id })}
                      disabled={archiveFlag.isPending}
                    >
                      Archive flag
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ) : projects.length > 0 && flags.length > 0 ? (
          <div className="mb-12">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              Feature Flags
            </h1>
            <p className="mt-2 text-base text-[var(--text-muted)]">
              Control feature rollouts and manage your application's behavior
            </p>
          </div>
        ) : null}

        {projectsQuery.isLoading || onboardingQuery.isLoading ? (
          <Card className="project-empty-state" aria-busy="true">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ) : projects.length === 0 ? (
          <OnboardingWizard
            initialStep="project"
            onProjectSelect={(id) => setProjectId(id)}
            onComplete={(flagId) => {
              if (flagId) setSelectedFlagId(flagId);
            }}
          />
        ) : flagsQuery.isLoading ? (
          <Card className="project-empty-state" aria-busy="true">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ) : (flags.length === 0 && !hasCompletedOnboarding) || showManualOnboarding ? (
          <OnboardingWizard
            initialStep="flag"
            projectId={projectId}
            projects={projects}
            onComplete={(flagId) => {
              setShowManualOnboarding(false);
              if (flagId) setSelectedFlagId(flagId);
            }}
          />
        ) : (
          <>
            {alerts && (
              <Alert
                variant={
                  error || projectsQuery.error || flagsQuery.error ? "destructive" : "success"
                }
                className="mb-8 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-1)]"
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
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
                    <h3 className="mb-4 text-lg font-semibold">Select Flag</h3>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {flags.slice(0, 5).map((flag) => (
                        <button
                          key={flag.id}
                          onClick={() => setSelectedFlagId(flag.id)}
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                            selectedFlag?.id === flag.id
                              ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]"
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
                        <p className="text-xs text-[var(--text-subtle)]">
                          + {flags.length - 5} more flags
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <FlagDetail
                flag={selectedFlag}
                onOpenAgentPrompt={() => {
                  if (selectedFlag) {
                    setAgentPromptFlagName(selectedFlag.name);
                    setIsAgentPromptOpen(true);
                  }
                }}
              />
            </div>

            <AgentPromptDialog
              open={isAgentPromptOpen}
              onOpenChange={setIsAgentPromptOpen}
              projectId={projectId}
              projectName={activeProject?.name}
              flagName={agentPromptFlagName || selectedFlag?.name || "my-first-flag"}
            />

            <CommandPalette
              open={isCommandOpen}
              onOpenChange={setIsCommandOpen}
              onCreateFlag={openCreateFlag}
              onCreateProject={() => setIsCreateProjectOpen(true)}
              onOpenAgentPrompt={() => {
                if (selectedFlag) {
                  setAgentPromptFlagName(selectedFlag.name);
                  setIsAgentPromptOpen(true);
                }
              }}
              canCreateFlag={Boolean(projectId)}
            />

            <CreateProjectDialog
              open={isCreateProjectOpen}
              onOpenChange={setIsCreateProjectOpen}
              onProjectCreated={(project) => {
                setProjectId(project.id);
                setSelectedFlagId("");
              }}
            />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogContent className="create-panel max-w-md">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-xl font-semibold">Create a new flag</DialogTitle>
                  <DialogDescription className="text-[var(--text-muted)]">
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
                          className="text-sm font-medium text-[var(--text-primary)]"
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
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Choose a descriptive name that identifies the feature
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button
                        type="submit"
                        disabled={createFlag.isPending}
                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:ring-[var(--accent-soft)]"
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
