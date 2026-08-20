"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Flag as FlagIcon,
  FolderPlus,
  LoaderCircle,
  Sparkles,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

import { Alert } from "@flaggable/ui/alert";
import { Badge } from "@flaggable/ui/badge";
import { Button } from "@flaggable/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flaggable/ui/card";
import { Input } from "@flaggable/ui/input";
import { Label } from "@flaggable/ui/label";
import { Switch } from "@flaggable/ui/switch";
import { generateAgentPrompt } from "@/lib/agent-docs";
import { useMutateCreateFlag } from "@/slices/flags/queries";
import { useMutateCreateProject, type CreatedProject } from "@/slices/projects/queries";
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
}: {
  initialStep?: OnboardingStep;
  projectId?: string;
  projects?: Project[];
  onComplete?: (flagId?: string) => void;
  onProjectSelect?: (projectId: string) => void;
}) {
  const [step, setStep] = useState<OnboardingStep>(
    activeProjectId && initialStep === "project" ? "flag" : initialStep,
  );
  const [projectId, setProjectId] = useState(activeProjectId);
  const [projectName, setProjectName] = useState(
    projects.find((p) => p.id === activeProjectId)?.name ?? "",
  );
  const [publicKey, setPublicKey] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newFlagName, setNewFlagName] = useState(SUGGESTED_FLAGS[0]);
  const [createdFlag, setCreatedFlag] = useState<Flag | null>(null);
  const [isDemoFlagActive, setIsDemoFlagActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const schemasQuery = useQuerySchemas(projectId);
  const createProject = useMutateCreateProject();
  const createFlag = useMutateCreateFlag(projectId);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://flaggable.dev";

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
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
    if (!name) return;
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
  const activeSdkKey = publicKey || "pk_your_project_public_key";

  const promptText = generateAgentPrompt({
    baseUrl,
    publicKey: activeSdkKey,
    flagName: targetFlagName,
    projectName: projectName || "My App",
  });

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success("AI Agent Prompt Copied!", {
        description: "Paste this prompt into Cursor, Claude Code, Pi, Windsurf, or ChatGPT.",
      });
      setTimeout(() => setCopied(false), 3000);
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
            <span className="flex size-7 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
              {step === "project" ? "1" : step === "flag" ? "2" : "3"}
            </span>
            <span className="text-sm font-semibold text-zinc-900">
              {step === "project"
                ? "Step 1: Create your project"
                : step === "flag"
                  ? "Step 2: Create your first flag"
                  : "Step 3: Setup SDK with your AI Agent"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`font-medium ${step === "project" ? "text-orange-600" : ""}`}>
              1. Project
            </span>
            <ChevronRight className="size-3 text-zinc-400" />
            <span className={`font-medium ${step === "flag" ? "text-orange-600" : ""}`}>
              2. First Flag
            </span>
            <ChevronRight className="size-3 text-zinc-400" />
            <span className={`font-medium ${step === "sdk" ? "text-orange-600" : ""}`}>
              3. AI Setup
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full bg-orange-600 transition-all duration-300 ease-out"
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mb-2">
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
                  placeholder="e.g., Web App, Marketing Site, Storefront"
                  value={newProjectName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProjectName(e.target.value)}
                  required
                  className="mt-1.5 h-11"
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  You can rename or create more projects later.
                </p>
              </div>

              <Button
                type="submit"
                disabled={createProject.isPending || !newProjectName.trim()}
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mb-2">
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
                  className="mt-1.5 h-11 font-mono text-sm"
                />
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-xs font-medium text-zinc-600">Quick suggestions:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_FLAGS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewFlagName(suggestion)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-mono transition-colors ${
                        newFlagName === suggestion
                          ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
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
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
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
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm">
                <Sparkles className="size-5" />
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Next.js Ready
              </Badge>
            </div>
            <CardTitle className="text-2xl mt-2">Setup with your AI Agent</CardTitle>
            <CardDescription className="text-sm">
              Copy this prompt and paste it directly into Cursor, Claude Code, Pi, Windsurf, or
              ChatGPT to set up your app.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Primary Action Button */}
            <Button
              size="lg"
              onClick={handleCopyPrompt}
              className={`w-full h-14 text-base font-semibold shadow-md transition-all ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="mr-2 size-5" />
                  Prompt Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-5" />
                  Copy AI Agent Prompt
                </>
              )}
            </Button>

            {/* What this prompt does */}
            <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900 mb-2">
                What the Agent will implement:
              </h4>
              <ul className="space-y-1.5 text-xs text-orange-950">
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 mt-0.5 text-orange-600 shrink-0" />
                  <span>
                    Installs <code>@flaggable/sdk</code> in your project.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 mt-0.5 text-orange-600 shrink-0" />
                  <span>
                    Configures <code>.env.local</code> with your public key & base URL.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 mt-0.5 text-orange-600 shrink-0" />
                  <span>
                    Sets up <code>FlagProvider</code> in your Next.js layout.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 mt-0.5 text-orange-600 shrink-0" />
                  <span>
                    Adds a live demo indicator component reading <code>{targetFlagName}</code>.
                  </span>
                </li>
              </ul>
            </div>

            {/* Prompt Preview */}
            <div>
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                  <Terminal className="size-3.5" />
                  Prompt Preview
                </div>
                <a
                  href="/docs/sdk.md"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  View SDK Docs <ExternalLink className="size-3" />
                </a>
              </div>
              <pre className="max-h-56 overflow-y-auto rounded-lg border bg-zinc-950 p-3.5 font-mono text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
                {promptText}
              </pre>
            </div>

            {/* Interactive Live Demo Preview Box */}
            <div className="rounded-xl border bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">
                    Live Demo Component Preview
                  </h4>
                  <p className="text-xs text-zinc-500">
                    This is the widget the AI agent will add to your frontend app:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Simulate Flag:</span>
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
                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                    : "border-zinc-200 bg-white text-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`size-2.5 rounded-full ${
                        isDemoFlagActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-mono font-medium">{targetFlagName}</p>
                      <p className="text-[11px] text-zinc-500">
                        Status:{" "}
                        <strong className={isDemoFlagActive ? "text-emerald-700" : "text-zinc-600"}>
                          {isDemoFlagActive ? "ACTIVE (Flag is ON)" : "INACTIVE (Flag is OFF)"}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isDemoFlagActive ? "default" : "secondary"}
                    className={
                      isDemoFlagActive
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"
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
                onClick={() => onComplete?.(createdFlag?.id)}
                className="w-full h-11 border-zinc-300 font-medium hover:bg-zinc-100"
              >
                Go to Dashboard
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
