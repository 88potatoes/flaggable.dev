"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { FolderPlus, LoaderCircle } from "lucide-react";
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
import { Input } from "@flaggable/ui/input";
import { Label } from "@flaggable/ui/label";
import { useMutateCreateProject, type CreatedProject } from "@/slices/projects/queries";

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: CreatedProject) => void;
}) {
  const [name, setName] = useState("");
  const createProject = useMutateCreateProject();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Project name required", { description: "Enter a project name to continue." });
      return;
    }

    createProject.mutate(
      { name: trimmed },
      {
        onSuccess: (project) => {
          setName("");
          onOpenChange(false);
          toast.success("Project created", { description: `${project.name} is ready.` });
          onProjectCreated?.(project);
        },
        onError: (error) => {
          toast.error("Could not create project", {
            description: error.message || "Please try again.",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <FolderPlus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Create a new project</DialogTitle>
              <DialogDescription className="text-xs">
                Organize flags and issue dedicated SDK keys for this application.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="form-stack pt-2">
          <div className="form-field">
            <Label htmlFor="dialog-project-name" className="form-label">
              Project name
            </Label>
            <Input
              id="dialog-project-name"
              placeholder="e.g., Marketing Website"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value);
              }}
              required
              className="form-control-medium"
            />
            <p className="form-help">Use a name your team will recognize.</p>
          </div>

          <DialogFooter className="form-actions pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending || !name.trim()}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] font-medium"
            >
              {createProject.isPending ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
