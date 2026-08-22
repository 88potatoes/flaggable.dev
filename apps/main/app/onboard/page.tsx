"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@flaggable/ui/card";
import { Skeleton } from "@flaggable/ui/skeleton";
import { DashboardShell } from "@/components/dashboard-sidebar";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { useQueryOnboarding } from "@/slices/onboarding/queries";
import { useQueryProjects } from "@/slices/projects/queries";
import { setActiveProjectId } from "@/slices/http";

export default function OnboardPage() {
  const router = useRouter();
  const onboardingQuery = useQueryOnboarding();
  const projectsQuery = useQueryProjects();
  const projects = projectsQuery.data ?? [];
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  useEffect(() => {
    setActiveProjectId(projectId || null);
  }, [projectId]);

  useEffect(() => {
    if (onboardingQuery.data?.status === "completed") router.replace("/");
  }, [onboardingQuery.data?.status, router]);

  const isLoading = projectsQuery.isLoading || onboardingQuery.isLoading;

  return (
    <DashboardShell
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onNewFlag={() => router.push("/")}
      onNewProject={() => undefined}
    >
      <div className="dashboard-inner">
        {isLoading ? (
          <Card className="project-empty-state" aria-busy="true">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ) : (
          <OnboardingWizard
            initialStep={projects.length > 0 ? "flag" : "project"}
            projectId={projectId}
            projects={projects}
            onProjectSelect={setProjectId}
            onComplete={() => router.push("/")}
          />
        )}
      </div>
    </DashboardShell>
  );
}
