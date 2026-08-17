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
  SidebarSeparator,
} from "@flaggable/ui/sidebar";
import type { Project } from "@/lib/queries";

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

  return (
    <Sidebar className="dashboard-sidebar" collapsible="offcanvas">
      <SidebarHeader className="gap-6 p-5">
        <Link href="https://flaggable.dev" className="brand brand-dark" aria-label="flaggable.dev home">
          <span className="brand-mark">f<span>.</span></span>
          <span>flaggable<span className="brand-domain">.dev</span></span>
        </Link>

        <label className="workspace-switcher m-0">
          <span className="workspace-avatar">A</span>
          <span className="min-w-0">
            <b>Project</b>
            <select aria-label="Select project" value={projectId} onChange={(event) => onProjectChange(event.target.value)}>
              {!projects.length && <option value="">No projects yet</option>}
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </span>
          <ChevronDown className="chevron" aria-hidden="true" />
        </label>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === "/dashboard"}><Link href="/dashboard"><LayoutDashboard /><span>Overview</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === "/flags"}><Link href="/flags"><Flag /><span>Feature flags</span></Link></SidebarMenuButton><SidebarMenuBadge>{flagCount}</SidebarMenuBadge></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton asChild><Link href="/dashboard#activity"><Activity /><span>Activity</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild><Link href="/dashboard#settings"><Settings /><span>Settings</span></Link></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-4">
        <div className="sidebar-status"><span className="online-dot" /><span>All systems operational</span></div>
        <SidebarSeparator className="mx-0 w-full" />
        <div className="sidebar-user">
          <Avatar size="sm"><AvatarFallback className="user-avatar-fallback">AL</AvatarFallback></Avatar>
          <span><b>Alex Lee</b><small>alex@flaggable.dev</small></span>
        </div>
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
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-[var(--paper)] text-[var(--ink)]">
        <DashboardSidebar projects={projects} projectId={projectId} flagCount={flagCount} onProjectChange={onProjectChange} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
