"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronDown, Flag, LayoutDashboard, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@flaggable/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@flaggable/ui/sidebar";
import type { Project } from "@/lib/queries";

const navButton = "text-sm text-sidebar-foreground/80";

export function DashboardSidebar({
  projects,
  projectId,
  flagCount,
  onProjectChange,
}: {
  projects: Project[];
  projectId: string;
  flagCount: number;
  onProjectChange: (projectId: string) => void;
}) {
  const pathname = usePathname();
  const project = projects.find((item) => item.id === projectId);

  return (
    <Sidebar collapsible="none" className="h-svh max-h-svh border-r bg-sidebar">
      <SidebarHeader className="gap-2 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <label className="flex h-12 min-w-0 items-center gap-2 rounded-lg px-2 hover:bg-sidebar-accent">
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md border bg-background text-xs font-semibold">
                {(project?.name?.[0] ?? "P").toUpperCase()}
              </span>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{project?.name ?? "No projects yet"}</span>
                <span className="truncate text-xs text-muted-foreground">Project</span>
              </span>
              <select
                aria-label="Select project"
                value={projectId}
                onChange={(event) => onProjectChange(event.target.value)}
                className="absolute size-px opacity-0"
              >
                {!projects.length && <option value="">No projects yet</option>}
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
            </label>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard" title="Overview">
                    <LayoutDashboard />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild isActive={pathname === "/flags"}>
                  <Link href="/flags" title="Feature flags">
                    <Flag />
                    <span>Feature flags</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>{flagCount}</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild>
                  <Link href="/dashboard#activity" title="Activity">
                    <Activity />
                    <span>Activity</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild>
                  <Link href="/dashboard#settings" title="Settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-[#f7d1c7] text-xs font-semibold text-[#ad503c]">AL</AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Alex Lee</span>
                <span className="truncate text-xs text-muted-foreground">alex@flaggable.dev</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardShell({
  children,
  projects,
  projectId,
  flagCount,
  onProjectChange,
}: {
  children: React.ReactNode;
  projects: Project[];
  projectId: string;
  flagCount: number;
  onProjectChange: (projectId: string) => void;
}) {
  return (
    <SidebarProvider className="flex min-h-svh w-full flex-row bg-background">
      <DashboardSidebar projects={projects} projectId={projectId} flagCount={flagCount} onProjectChange={onProjectChange} />
      <SidebarInset className="min-w-0 bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
