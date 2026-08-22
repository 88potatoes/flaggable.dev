"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  Flag as FlagIcon,
  FolderPlus,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Alert } from "@flaggable/ui/alert";
import { Badge } from "@flaggable/ui/badge";
import { Button } from "@flaggable/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flaggable/ui/card";
import { Input } from "@flaggable/ui/input";
import { Label } from "@flaggable/ui/label";
import { Switch } from "@flaggable/ui/switch";
import { generateAgentPrompt, generateEnvSnippet } from "@/lib/agent-docs";
import { useMutateCreateFlag } from "@/slices/flags/queries";
import { useMutateCreateProject, type CreatedProject } from "@/slices/projects/queries";
import { useMutateAcknowledgeSdkSetup } from "@/slices/onboarding/queries";
import { useQuerySchemas } from "@/slices/value-schemas/queries";
import type { Flag, Project } from "@flaggable/contracts";

export type OnboardingStep = "project" | "flag" | "sdk";

const SUGGESTED_FLAGS = [
  "show-promo-banner",
  "new-checkout-flow",
  "beta-feature-preview",
  "enable-ai-assistant",
];

export function OnboardingWizard({
  initialStep = "project",
  projectId: activeProjectId = "",
  projects = [],
  onComplete,
  onProjectSelect,
  onCredentials,
}: {
  initialStep?: OnboardingStep;
  projectId?: string;
  projects?: Project[];
  onComplete?: (flagId?: string) => void;
  onProjectSelect?: (projectId: string) => void;
  onCredentials?: (credentials: {
    projectId: string;
    publicKey: string;
    internalKey: string;
  }) => void;
}) {
  const [step, setStep] = useState<OnboardingStep>(
    activeProjectId && initialStep === "project" ? "flag" : initialStep,
  );
  const [projectId, setProjectId] = useState(activeProjectId);
  const [projectName, setProjectName] = useState(
    projects.find((p) => p.id === activeProjectId)?.name ?? "",
  );
  const [publicKey, setPublicKey] = useState<string>("");
  const [internalKey, setInternalKey] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newFlagName, setNewFlagName] = useState(SUGGESTED_FLAGS[0]);
  const [createdFlag, setCreatedFlag] = useState<Flag | null>(null);
  const [isDemoFlagActive, setIsDemoFlagActive] = useState(true);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [error, setError] = useState("");

  const schemasQuery = useQuerySchemas(projectId);
  const createProject = useMutateCreateProject();
  const createFlag = useMutateCreateFlag(projectId);
  const acknowledgeSdkSetup = useMutateAcknowledgeSdkSetup();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://flaggable.dev";

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) {
      setError("Enter a project name.");
      return;
    }
    setError("");

    createProject.mutate(
      { name },
      {
        onSuccess: (project: CreatedProject) => {
          setProjectId(project.id);
          setProjectName(project.name);
          if (project.publicKey) {
            setPublicKey(project.publicKey);
          }
          if (project.internalKey) {
            setInternalKey(project.internalKey);
          }
          if (project.publicKey && project.internalKey) {
            onCredentials?.({
              projectId: project.id,
              publicKey: project.publicKey,
              internalKey: project.internalKey,
            });
          }
          if (onProjectSelect) {
            onProjectSelect(project.id);
          }
          toast.success("Project created", { description: `${project.name} is ready.` });
          setStep("flag");
        },
        onError: (err) => {
          setError(err.message || "Failed to create project.");
        },
      },
    );
  };

  const handleCreateFlag = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newFlagName.trim();
    if (!name) {
      setError("Enter a flag name.");
      return;
    }
    setError("");

    const schema = schemasQuery.data?.[0];
    if (!schema) {
      setError("Default boolean schema is loading. Please try again in a moment.");
      return;
    }

    createFlag.mutate(
      {
        valueSchemaId: schema.id,
        name,
        description: "Initial onboarding feature flag",
      },
      {
        onSuccess: (flag) => {
          setCreatedFlag(flag);
          setIsDemoFlagActive(flag.enabled);
          toast.success("Flag created", { description: `Flag "${name}" created successfully!` });
          setStep("sdk");
        },
        onError: (err) => {
          setError(err.message || "Failed to create feature flag.");
        },
      },
    );
  };

  const targetFlagName = createdFlag?.name || newFlagName || "show-promo-banner";
  const envPublicKey = publicKey || "pk_your_project_public_key";
  const envInternalKey = internalKey || "ik_your_internal_api_key";
  const rawEnvSnippet = generateEnvSnippet({
    baseUrl,
    publicKey: envPublicKey,
    internalKey: envInternalKey,
  });

  const displayMaskedInternalKey = internalKey
    ? `${internalKey.slice(0, 5)}••••••••••••••••••••••••`
    : "ik_••••••••••••••••••••••••";

  const maskedEnvSnippet = generateEnvSnippet({
    baseUrl,
    publicKey: envPublicKey,
    internalKey: displayMaskedInternalKey,
  });

  const promptText = generateAgentPrompt({
    baseUrl,
    flagName: targetFlagName,
    projectName: projectName || "My App",
  });

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(rawEnvSnippet);
      setCopiedEnv(true);
      toast.success("Environment variables copied to clipboard!", {
        description: "Paste these into your .env.local file.",
      });
      setTimeout(() => setCopiedEnv(false), 3000);
    } catch {
      toast.error("Failed to copy environment variables to clipboard");
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      toast.success("AI Agent Prompt Copied!", {
        description: "Paste this prompt into Cursor, Claude Code, Pi, Windsurf, or ChatGPT.",
      });
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      toast.error("Failed to copy prompt to clipboard");
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-6">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">
              {step === "project" ? "1" : step === "flag" ? "2" : "3"}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {step === "project"
                ? "Step 1: Create your project"
                : step === "flag"
                  ? "Step 2: Create your first flag"
                  : "Step 3: Setup SDK with your AI Agent"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className={`font-medium ${step === "project" ? "text-[var(--accent)]" : ""}`}>
              1. Project
            </span>
            <ChevronRight className="size-3 text-[var(--text-muted)]" />
            <span className={`font-medium ${step === "flag" ? "text-[var(--accent)]" : ""}`}>
              2. First Flag
            </span>
            <ChevronRight className="size-3 text-[var(--text-muted)]" />
            <span className={`font-medium ${step === "sdk" ? "text-[var(--accent)]" : ""}`}>
              3. AI Setup
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
            style={{
              width: step === "project" ? "33%" : step === "flag" ? "66%" : "100%",
            }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Step 1: Create Project */}
      {step === "project" && (
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] mb-2">
              <FolderPlus className="size-5" />
            </div>
            <CardTitle className="text-xl">Create your first project</CardTitle>
            <CardDescription>
              Projects group feature flags and issue public SDK keys for your frontend applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <Label htmlFor="onboarding-project-name" className="text-sm font-medium">
                  Project name
                </Label>
                <Input
                  id="onboarding-project-name"
                  placeholder="e.g., Web App"
                  value={newProjectName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProjectName(e.target.value)}
                  required
                  aria-invalid={Boolean(error)}
                  className="form-control-medium mt-1.5"
                />
                <p
                  className={error ? "form-error" : "form-help"}
                  role={error ? "alert" : undefined}
                >
                  {error || "You can rename or create more projects later."}
                </p>
              </div>

              <Button
                type="submit"
                disabled={createProject.isPending || !newProjectName.trim()}
                className="bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
              >
                {createProject.isPending ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Creating project...
                  </>
                ) : (
                  <>
                    Continue to Flag Setup
                    <ChevronRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create First Flag */}
      {step === "flag" && (
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] mb-2">
              <FlagIcon className="size-5" />
            </div>
            <CardTitle className="text-xl">Create your first feature flag</CardTitle>
            <CardDescription>
              Name a feature you want to toggle or test in your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFlag} className="space-y-5">
              <div>
                <Label htmlFor="onboarding-flag-name" className="text-sm font-medium">
                  Flag key / name
                </Label>
                <Input
                  id="onboarding-flag-name"
                  placeholder="e.g., show-promo-banner"
                  value={newFlagName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFlagName(e.target.value)}
                  required
                  aria-invalid={Boolean(error)}
                  className="form-control-medium mt-1.5 font-mono text-sm"
                />
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Quick suggestions:
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_FLAGS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewFlagName(suggestion)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-mono transition-colors ${
                        newFlagName === suggestion
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                          : "border-[var(--line)] bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={createFlag.isPending || !newFlagName.trim()}
                className="bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
              >
                {createFlag.isPending ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Creating flag...
                  </>
                ) : (
                  <>
                    Create Flag & Get AI Prompt
                    <ChevronRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Setup SDK in Next.js App with AI Prompt */}
      {step === "sdk" && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm">
                <Sparkles className="size-5" />
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Next.js Ready
              </Badge>
            </div>
            <CardTitle className="text-2xl mt-2">Setup with your AI Agent</CardTitle>
            <CardDescription className="text-sm">
              Follow these two quick steps to connect your Next.js application.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 3.1: Copy Environment Variables */}
            <div className="rounded-xl border bg-[var(--surface-1)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      Copy Environment Variables
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Paste into your project&apos;s{" "}
                      <code className="font-mono font-semibold">.env.local</code> file (internal key
                      is masked for display).
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyEnv}
                  className={`h-8 text-xs font-medium border shadow-xs transition-all ${
                    copiedEnv
                      ? "border-[var(--success)] bg-[var(--accent-soft)] text-[var(--success)] hover:bg-[var(--accent-soft)]"
                      : "bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {copiedEnv ? (
                    <>
                      <Check className="mr-1.5 size-3.5" />
                      Copied .env!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 size-3.5" />
                      Copy .env.local
                    </>
                  )}
                </Button>
              </div>

              <pre className="overflow-x-auto rounded-lg border bg-[var(--surface-0)] p-3 font-mono text-xs text-[var(--text-primary)] leading-relaxed">
                {maskedEnvSnippet}
              </pre>
            </div>

            {/* Step 3.2: Copy AI Agent Setup Prompt */}
            <div className="rounded-xl border bg-[var(--surface-1)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      Copy AI Agent Setup Prompt
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Paste this prompt into Cursor, Claude Code, Pi, Windsurf, or ChatGPT.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleCopyPrompt}
                  className={`h-8 text-xs font-medium shadow-xs transition-all ${
                    copiedPrompt
                      ? "bg-[var(--success)] hover:bg-[var(--success)] text-[var(--accent-foreground)]"
                      : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)]"
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="mr-1.5 size-3.5" />
                      Copied Prompt!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 size-3.5" />
                      Copy Agent Prompt
                    </>
                  )}
                </Button>
              </div>

              {/* Prompt Preview */}
              <div>
                <pre className="max-h-56 overflow-y-auto rounded-lg border bg-[var(--surface-0)] p-3 font-mono text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {promptText}
                </pre>
              </div>
            </div>

            {/* Interactive Live Demo Preview Box */}
            <div className="rounded-xl border bg-[var(--surface-1)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Live Demo Component Preview
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    This is the widget the AI agent will add to your frontend app:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">Simulate Flag:</span>
                  <Switch
                    checked={isDemoFlagActive}
                    onCheckedChange={setIsDemoFlagActive}
                    aria-label="Toggle demo flag state"
                  />
                </div>
              </div>

              <div
                className={`mt-3 rounded-lg border p-3.5 transition-all ${
                  isDemoFlagActive
                    ? "border-[var(--line)] bg-[var(--accent-soft)] text-[var(--success)]"
                    : "border-[var(--line)] bg-[var(--surface-1)] text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`size-2.5 rounded-full ${
                        isDemoFlagActive
                          ? "bg-[var(--success)] animate-pulse"
                          : "bg-[var(--text-muted)]"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-mono font-medium">{targetFlagName}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Status:{" "}
                        <strong
                          className={
                            isDemoFlagActive ? "text-[var(--success)]" : "text-[var(--text-muted)]"
                          }
                        >
                          {isDemoFlagActive ? "ACTIVE (Flag is ON)" : "INACTIVE (Flag is OFF)"}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isDemoFlagActive ? "default" : "secondary"}
                    className={
                      isDemoFlagActive
                        ? "bg-[var(--accent-soft)] text-[var(--success)] hover:bg-[var(--accent-soft)]"
                        : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                    }
                  >
                    {isDemoFlagActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Completion Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  acknowledgeSdkSetup.mutate(undefined, {
                    onSuccess: () => onComplete?.(createdFlag?.id),
                    onError: () => {
                      toast.error("Could not save onboarding progress", {
                        description: "Please try again.",
                      });
                    },
                  });
                }}
                disabled={acknowledgeSdkSetup.isPending}
                className="w-full h-11 border-[var(--line)] font-medium hover:bg-[var(--surface-2)]"
              >
                {acknowledgeSdkSetup.isPending ? "Saving…" : "Go to Dashboard"}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
