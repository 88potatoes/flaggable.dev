"use client";

import { FormEvent, type ChangeEvent, useEffect, useMemo, useState } from "react";
import { LoaderCircle, MoreHorizontal, Sparkles } from "lucide-react";

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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@flaggable/ui/tabs";
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
  const [openFlagIds, setOpenFlagIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [knownPublicKey, setKnownPublicKey] = useState("");
  const [knownInternalKey, setKnownInternalKey] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAgentPromptOpen, setIsAgentPromptOpen] = useState(false);
  const [agentPromptFlagName, setAgentPromptFlagName] = useState("");
  const [newFlagName, setNewFlagName] = useState("");

  const projectsQuery = useQueryProjects();
  const onboardingQuery = useQueryOnboarding();
  const projects = projectsQuery.data ?? [];
  const schemasQuery = useQuerySchemas(projectId);
  const debouncedQuery = useDebouncedValue(query);
  const flagsQuery = useQueryFlags(projectId, debouncedQuery);
  const createFlag = useMutateCreateFlag(projectId);
  const updateFlag = useMutateUpdateFlag(projectId);
  const archiveFlag = useMutateArchiveFlag(projectId);
  const activeProject = projects.find((p) => p.id === projectId);
  const rememberCredentials = (credentials: {
    projectId: string;
    publicKey?: string;
    internalKey?: string;
  }) => {
    if (credentials.publicKey) setKnownPublicKey(credentials.publicKey);
    if (credentials.internalKey) setKnownInternalKey(credentials.internalKey);
    if (typeof window !== "undefined" && (credentials.publicKey || credentials.internalKey)) {
      const saved = JSON.parse(sessionStorage.getItem("flaggable-project-credentials") || "{}");
      const previous = saved[credentials.projectId] || {};
      sessionStorage.setItem(
        "flaggable-project-credentials",
        JSON.stringify({
          ...saved,
          [credentials.projectId]: {
            publicKey: credentials.publicKey || previous.publicKey || "",
            internalKey: credentials.internalKey || previous.internalKey || "",
          },
        }),
      );
    }
  };
  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    try {
      const saved = JSON.parse(sessionStorage.getItem("flaggable-project-credentials") || "{}");
      const credentials = saved[projectId];
      if (credentials) rememberCredentials({ ...credentials, projectId });
    } catch {
      // Ignore malformed session storage and let the API keys page generate fresh keys.
    }
  }, [projectId]);
  const flags = useMemo(
    () => flagsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [flagsQuery.data],
  );
  const selectedFlag = flags.find((flag) => flag.id === selectedFlagId) ?? flags[0];
  const openFlags = openFlagIds
    .map((id) => flags.find((flag) => flag.id === id))
    .filter((flag): flag is (typeof flags)[number] => Boolean(flag));

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
  }

  function submitCreateFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newFlagName.trim();
    if (!trimmedName) {
      toast.error("Flag name required", { description: "Enter a flag name to continue." });
      return;
    }
    const schema = schemasQuery.data?.[0];
    if (!schema) {
      toast.error("Value schema unavailable", {
        description: "Please wait for the default schema to finish loading, then try again.",
      });
      return;
    }
    createFlag.mutate(
      {
        valueSchemaId: schema.id,
        name: trimmedName,
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
          toast.error("Could not create flag", { description: message });
        },
      },
    );
  }

  const flagSidebar =
    projects.length > 0 && flags.length > 0 ? (
      <FlagBrowser
        flags={flags}
        search={query}
        onSearchChange={setQuery}
        selectedFlagId={selectedFlag?.id}
        onSelect={(flagId) => {
          setSelectedFlagId(flagId);
          setOpenFlagIds((current) => (current.includes(flagId) ? current : [...current, flagId]));
        }}
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
      flagSidebar={flagSidebar}
    >
      <>
        {projectsQuery.isLoading || onboardingQuery.isLoading ? (
          <Card className="project-empty-state" aria-busy="true">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ) : projects.length === 0 ? (
          <Card className="project-empty-state">
            <p className="text-sm text-[var(--text-muted)]">No project found.</p>
          </Card>
        ) : flagsQuery.isLoading ? (
          <Card className="project-empty-state" aria-busy="true">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ) : (
          <>
            <Tabs
              value={selectedFlag?.id}
              onValueChange={setSelectedFlagId}
              className="flag-tabs w-full"
            >
              {/* Mobile flag browser - only show on small screens when we have flags */}
              <div className="mb-8 block md:hidden">
                {flags.length > 0 && (
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
                    <h3 className="mb-4 text-lg font-semibold">Select Flag</h3>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {flags.slice(0, 5).map((flag) => (
                        <button
                          key={flag.id}
                          onClick={() => {
                            setSelectedFlagId(flag.id);
                            setOpenFlagIds((current) =>
                              current.includes(flag.id) ? current : [...current, flag.id],
                            );
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                            selectedFlag?.id === flag.id
                              ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]"
                              : "hover:bg-[var(--surface-1)]"
                          }`}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-[var(--accent-foreground)] ${
                              flag.enabled ? "bg-[var(--success)]" : "bg-[var(--text-muted)]"
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
              <TabsList className="mb-6 max-w-full overflow-x-auto bg-[var(--surface-2)]">
                {openFlags.map((flag) => (
                  <TabsTrigger key={flag.id} value={flag.id}>
                    {flag.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {openFlags.map((flag) => (
                <TabsContent key={flag.id} value={flag.id}>
                  <div className="dashboard-inner flag-tab-panel">
                    <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-5">
                      <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                          {flag.name}
                        </h1>
                        <span className="text-xs text-[var(--text-muted)]">
                          {flag.enabled ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAgentPromptFlagName(flag.name);
                            setIsAgentPromptOpen(true);
                          }}
                          className="gap-1.5 border-[var(--line)] bg-[var(--accent-soft)] font-medium text-[var(--accent)] hover:bg-[var(--surface-2)]"
                        >
                          <Sparkles className="size-3.5" />
                          AI Setup Prompt
                        </Button>
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={(enabled: boolean) =>
                            updateFlag.mutate({ flagId: flag.id, values: { enabled } })
                          }
                          disabled={updateFlag.isPending}
                          aria-label={`${flag.enabled ? "Disable" : "Enable"} ${flag.name}`}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              aria-label={`More actions for ${flag.name}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setAgentPromptFlagName(flag.name);
                                setIsAgentPromptOpen(true);
                              }}
                            >
                              <Sparkles className="mr-2 size-4 text-[var(--accent)]" />
                              Get AI Agent Prompt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => archiveFlag.mutate({ flagId: flag.id })}
                              disabled={archiveFlag.isPending}
                            >
                              Archive flag
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <FlagDetail
                      flag={flag}
                      onOpenAgentPrompt={() => {
                        setAgentPromptFlagName(flag.name);
                        setIsAgentPromptOpen(true);
                      }}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <AgentPromptDialog
              open={isAgentPromptOpen}
              onOpenChange={setIsAgentPromptOpen}
              projectId={projectId}
              projectName={activeProject?.name}
              flagName={agentPromptFlagName || selectedFlag?.name || "my-first-flag"}
              knownPublicKey={knownPublicKey}
              knownInternalKey={knownInternalKey}
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
                rememberCredentials({
                  projectId: project.id,
                  publicKey: project.publicKey,
                  internalKey: project.internalKey,
                });
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
                  <div className="rounded-lg bg-[var(--accent-soft)] p-4 text-sm text-[var(--warning)]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
                        <span className="text-xs font-bold">!</span>
                      </div>
                      <div>
                        <p className="font-medium">Value schema required</p>
                        <p className="mt-1 text-[var(--warning)]">
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
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            setNewFlagName(event.target.value);
                          }}
                          placeholder="e.g., checkout-redesign"
                          className="form-control-medium mt-1.5"
                        />
                        <p className="form-help">Use lowercase words separated by hyphens.</p>
                      </div>
                    </div>
                    <DialogFooter className="form-actions pt-4">
                      <Button
                        type="submit"
                        disabled={
                          createFlag.isPending || schemasQuery.isLoading || !schemasQuery.data?.[0]
                        }
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
      </>
    </DashboardShell>
  );
}
