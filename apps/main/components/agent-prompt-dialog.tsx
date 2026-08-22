"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@flaggable/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flaggable/ui/dialog";
import { generateAgentPrompt, generateEnvSnippet } from "@/lib/agent-docs";
import { useMutateCreateInternalKey, useQueryInternalKeys } from "@/slices/internal-keys/queries";
import { useMutateCreatePublicKey } from "@/slices/public-keys/queries";

export function AgentPromptDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  flagName,
  knownPublicKey,
  knownInternalKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName?: string;
  flagName: string;
  knownPublicKey?: string;
  knownInternalKey?: string;
}) {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    publicKey: string;
    internalKey: string;
  } | null>(null);
  const createPublicKey = useMutateCreatePublicKey(projectId);
  const createInternalKey = useMutateCreateInternalKey(projectId);
  const internalKeysQuery = useQueryInternalKeys(projectId);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://flaggable.dev";
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const activePublicKey = knownPublicKey || generatedCredentials?.publicKey || "";
  const activeInternalKey =
    knownInternalKey ||
    generatedCredentials?.internalKey ||
    internalKeysQuery.data?.find((key) => !key.revokedAt)?.internalKey ||
    "";

  const rawEnvSnippet = generateEnvSnippet({
    baseUrl,
    publicKey: activePublicKey,
    internalKey: activeInternalKey,
  });

  const hasRealCredentials = Boolean(activePublicKey && activeInternalKey);
  const isCreatingCredentials = createPublicKey.isPending || createInternalKey.isPending;

  const displayMaskedInternalKey = activeInternalKey
    ? `${activeInternalKey.slice(0, 5)}••••••••••••••••••••••••`
    : "ik_••••••••••••••••••••••••";

  const maskedEnvSnippet = generateEnvSnippet({
    baseUrl,
    publicKey: activePublicKey,
    internalKey: displayMaskedInternalKey,
  });

  const promptText = generateAgentPrompt({
    baseUrl,
    flagName,
    projectName,
  });

  const handleCopyEnv = async () => {
    try {
      let publicKey = activePublicKey;
      let internalKey = activeInternalKey;

      if (!publicKey) {
        const created = await createPublicKey.mutateAsync();
        publicKey = created.publicKey;
      }
      if (!internalKey) {
        const created = await createInternalKey.mutateAsync({ name: "AI Agent Setup" });
        internalKey = created.internalKey;
      }

      setGeneratedCredentials({ publicKey, internalKey });
      const envSnippet = generateEnvSnippet({ baseUrl, publicKey, internalKey });
      await navigator.clipboard.writeText(envSnippet);
      setCopiedEnv(true);
      toast.success("Environment variables copied to clipboard", {
        description: "Paste these into your .env.local file.",
      });
      setTimeout(() => setCopiedEnv(false), 2500);
    } catch (error) {
      toast.error("Could not prepare environment variables", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      toast.success("AI Agent prompt copied to clipboard", {
        description: "Paste this into Cursor, Claude Code, Pi, Windsurf, or ChatGPT.",
      });
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      toast.error("Failed to copy prompt to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Set up with AI Coding Agent</DialogTitle>
              <DialogDescription className="text-xs">
                Follow these two steps to connect your Next.js application.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-zinc-50 p-3 text-xs">
            <span className="font-semibold text-zinc-900">
              Target Flag:{" "}
              <code className="font-mono bg-zinc-200 px-1 py-0.5 rounded">{flagName}</code>
            </span>
            <a
              href="/docs/sdk.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
            >
              View SDK Docs <ExternalLink className="size-3" />
            </a>
          </div>

          {/* Step 1: Environment Variables */}
          <div className="rounded-lg border bg-zinc-50 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                  1
                </span>
                <span className="text-xs font-semibold text-zinc-800">
                  Copy Environment Variables (<code className="font-mono">.env.local</code>)
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyEnv}
                className="h-7 text-xs"
                disabled={isCreatingCredentials}
              >
                {copiedEnv ? <Check className="mr-1 size-3" /> : <Copy className="mr-1 size-3" />}
                {copiedEnv ? "Copied .env!" : "Copy .env.local"}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md border bg-zinc-950 p-3 font-mono text-xs text-zinc-100 leading-relaxed">
              {hasRealCredentials
                ? maskedEnvSnippet
                : "Click Copy .env.local to generate and copy your project keys."}
            </pre>
          </div>

          {/* Step 2: Agent Prompt */}
          <div className="rounded-lg border bg-zinc-50 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                  2
                </span>
                <span className="text-xs font-semibold text-zinc-800">
                  Copy AI Agent Setup Prompt
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleCopyPrompt}
                className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white"
              >
                {copiedPrompt ? (
                  <Check className="mr-1 size-3" />
                ) : (
                  <Copy className="mr-1 size-3" />
                )}
                {copiedPrompt ? "Copied Prompt!" : "Copy Prompt"}
              </Button>
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-md border bg-zinc-950 p-3 font-mono text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
              {promptText}
            </pre>
          </div>
        </div>

        <DialogFooter className="border-t bg-zinc-50/50 px-6 py-3.5 flex items-center justify-between sm:justify-between">
          <p className="text-xs text-zinc-500">
            Works with Cursor, Claude Code, Pi, Windsurf, ChatGPT, and Copilot.
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
