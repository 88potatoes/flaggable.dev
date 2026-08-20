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
import { generateAgentPrompt } from "@/lib/agent-docs";
import { useQueryPublicKeys, useMutateCreatePublicKey } from "@/slices/public-keys/queries";

export function AgentPromptDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  flagName,
  knownPublicKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName?: string;
  flagName: string;
  knownPublicKey?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const publicKeysQuery = useQueryPublicKeys(projectId);
  const createPublicKey = useMutateCreatePublicKey(projectId);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://flaggable.dev";
  const activeKey = knownPublicKey || generatedKey || "pk_your_public_key";

  const promptText = generateAgentPrompt({
    baseUrl,
    publicKey: activeKey,
    flagName,
    projectName,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success("AI Agent prompt copied to clipboard", {
        description: "Paste this into Cursor, Claude Code, Pi, Windsurf, or ChatGPT.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleCreateNewKey = () => {
    createPublicKey.mutate(undefined, {
      onSuccess: (created) => {
        setGeneratedKey(created.publicKey);
        toast.success("New public SDK key generated and injected into prompt.");
      },
    });
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
                Copy this prompt and paste it directly into Cursor, Claude Code, Pi, Windsurf, or
                Copilot.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-lg border bg-zinc-50 p-3.5 text-xs text-zinc-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900">
                Flag: <code className="font-mono bg-zinc-200 px-1 py-0.5 rounded">{flagName}</code>
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
            {activeKey === "pk_your_public_key" && !publicKeysQuery.isLoading && (
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200">
                <span className="text-amber-700">Need an active public key in this prompt?</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateNewKey}
                  disabled={createPublicKey.isPending}
                  className="h-7 text-xs"
                >
                  {createPublicKey.isPending ? "Generating..." : "Generate Key"}
                </Button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Agent Prompt
              </span>
              <span className="text-xs text-zinc-500">
                Includes Next.js setup + demo toggle recipe
              </span>
            </div>
            <pre className="max-h-72 overflow-y-auto rounded-lg border bg-zinc-950 p-4 font-mono text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
              {promptText}
            </pre>
          </div>
        </div>

        <DialogFooter className="border-t bg-zinc-50/50 px-6 py-3.5 flex items-center justify-between sm:justify-between">
          <p className="text-xs text-zinc-500">
            Works with Cursor, Claude Code, Pi, Windsurf, ChatGPT, and Copilot.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleCopy}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied Prompt!" : "Copy Agent Prompt"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
