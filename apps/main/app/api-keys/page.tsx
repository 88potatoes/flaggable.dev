"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

import { Card } from "@flaggable/ui/card";
import { Skeleton } from "@flaggable/ui/skeleton";
import { ApiKeysPanel } from "@/components/api-keys-panel";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DashboardShell } from "@/components/dashboard-sidebar";
import { useQueryProjects } from "@/slices/projects/queries";

export default function ApiKeysPage() {
  const projectsQuery = useQueryProjects();
  const projects = projectsQuery.data ?? [];
  const [projectId, setProjectId] = useState("");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

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
        onNewProject={() => setIsCreateProjectOpen(true)}
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
      onNewProject={() => setIsCreateProjectOpen(true)}
    >
      <div className="dashboard-inner">
        {projects.length === 0 ? (
          <Card className="grid justify-items-start gap-3 p-8">
            <KeyRound className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
            <p className="text-sm text-muted-foreground">
              Create a project first to generate API and SDK keys.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage your Internal API keys (for CLI typegen & devtools) and Public SDK keys (for
                frontend evaluation).
              </p>
            </div>
            <ApiKeysPanel projectId={projectId} />
          </div>
        )}
      </div>
      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        onProjectCreated={(project) => setProjectId(project.id)}
      />
    </DashboardShell>
  );
}
