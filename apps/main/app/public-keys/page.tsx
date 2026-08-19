"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

import { Card } from "@flaggable/ui/card";
import { Skeleton } from "@flaggable/ui/skeleton";
import { DashboardShell } from "@/components/dashboard-sidebar";
import { PublicKeysPanel } from "@/components/public-keys-panel";
import { useQueryProjects } from "@/slices/projects/queries";

export default function PublicKeysPage() {
  const projectsQuery = useQueryProjects();
  const projects = projectsQuery.data ?? [];
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  if (projectsQuery.isLoading) {
    return (
      <DashboardShell
        projects={projects}
        projectId={projectId}
        onProjectChange={setProjectId}
        onNewFlag={() => undefined}
      >
        <div className="dashboard-inner">
          <Card className="grid gap-4 p-6" aria-busy="true">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onNewFlag={() => undefined}
    >
      <div className="dashboard-inner">
        {projects.length === 0 ? (
          <Card className="grid justify-items-start gap-3 p-8">
            <KeyRound className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Public keys</h1>
            <p className="text-sm text-muted-foreground">
              Create a project first to generate a public SDK key.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Public keys</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage the keys used by your frontend SDK to evaluate flags for this project.
              </p>
            </div>
            <PublicKeysPanel projectId={projectId} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
