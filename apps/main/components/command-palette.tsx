"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Command, FileText, FolderPlus, Plus, Search, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@flaggable/ui/dialog";
import { Input } from "@flaggable/ui/input";

export function CommandPalette({
  open,
  onOpenChange,
  onCreateFlag,
  onCreateProject,
  onOpenAgentPrompt,
  canCreateFlag,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFlag: () => void;
  onCreateProject?: () => void;
  onOpenAgentPrompt?: () => void;
  canCreateFlag: boolean;
}) {
  const [search, setSearch] = useState("");
  const lowerSearch = search.trim().toLowerCase();
  const canShowCreateFlag =
    canCreateFlag &&
    (lowerSearch === "" ||
      "create a new flag".includes(lowerSearch) ||
      "new flag".includes(lowerSearch));

  const canShowCreateProject =
    Boolean(onCreateProject) &&
    (lowerSearch === "" ||
      "create a new project".includes(lowerSearch) ||
      "new project".includes(lowerSearch) ||
      "create project".includes(lowerSearch));

  const canShowAgentPrompt =
    Boolean(onOpenAgentPrompt) &&
    (lowerSearch === "" ||
      "ai prompt".includes(lowerSearch) ||
      "agent".includes(lowerSearch) ||
      "setup sdk".includes(lowerSearch) ||
      "prompt".includes(lowerSearch));

  const canShowDocs =
    lowerSearch === "" ||
    "sdk docs".includes(lowerSearch) ||
    "documentation".includes(lowerSearch) ||
    "docs".includes(lowerSearch);

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      if (canShowCreateFlag) {
        event.preventDefault();
        onCreateFlag();
      } else if (canShowAgentPrompt && onOpenAgentPrompt) {
        event.preventDefault();
        onOpenAgentPrompt();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Command className="h-4 w-4 text-muted-foreground" />
            Command menu
          </DialogTitle>
          <DialogDescription>Quickly jump to an action with your keyboard.</DialogDescription>
        </DialogHeader>
        <div className="border-b px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
              placeholder="Search actions..."
              aria-label="Search actions"
              className="h-10 border-0 bg-muted/60 pl-9 shadow-none focus-visible:ring-1"
            />
          </div>
        </div>
        <div className="p-2 space-y-1">
          {canShowCreateFlag && (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              onClick={onCreateFlag}
              disabled={!canCreateFlag}
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                <Plus className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Create a new flag</span>
                <span className="block text-xs text-muted-foreground">
                  {canCreateFlag ? "Add a feature flag to this project" : "Create a project first"}
                </span>
              </span>
              <span className="rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                Enter
              </span>
            </button>
          )}

          {canShowCreateProject && onCreateProject && (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                onOpenChange(false);
                onCreateProject();
              }}
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--text-primary)]">
                <FolderPlus className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Create a new project</span>
                <span className="block text-xs text-muted-foreground">
                  Group feature flags and issue public SDK credentials
                </span>
              </span>
            </button>
          )}

          {canShowAgentPrompt && onOpenAgentPrompt && (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                onOpenChange(false);
                onOpenAgentPrompt();
              }}
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--warning)]">
                <Sparkles className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Get AI Agent Setup Prompt</span>
                <span className="block text-xs text-muted-foreground">
                  Generate copyable prompt for Cursor, Claude Code, Pi, Windsurf
                </span>
              </span>
            </button>
          )}

          {canShowDocs && (
            <a
              href="/docs/sdk.md"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--text-primary)]">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">View SDK Documentation</span>
                <span className="block text-xs text-muted-foreground">
                  Open full @flaggable/sdk Markdown integration guide
                </span>
              </span>
            </a>
          )}

          {!canShowCreateFlag && !canShowAgentPrompt && !canShowDocs && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No actions found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
