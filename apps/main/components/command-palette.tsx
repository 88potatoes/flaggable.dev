"use client";

import { useEffect, useState } from "react";
import { Command, Plus, Search } from "lucide-react";

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
  canCreateFlag,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFlag: () => void;
  canCreateFlag: boolean;
}) {
  const [search, setSearch] = useState("");
  const canShowCreateFlag =
    canCreateFlag &&
    (search.trim() === "" ||
      "create a new flag".includes(search.trim().toLowerCase()) ||
      "new flag".includes(search.trim().toLowerCase()));

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && canShowCreateFlag) {
      event.preventDefault();
      onCreateFlag();
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
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search actions..."
              aria-label="Search actions"
              className="h-10 border-0 bg-muted/60 pl-9 shadow-none focus-visible:ring-1"
            />
          </div>
        </div>
        <div className="p-2">
          {canShowCreateFlag && (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              onClick={onCreateFlag}
              disabled={!canCreateFlag}
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-orange-100 text-orange-700">
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
          {!canShowCreateFlag && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No actions found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
