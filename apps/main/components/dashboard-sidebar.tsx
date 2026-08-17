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
  SidebarInset,
} from "@flaggable/ui/sidebar";
import type { Project } from "@/lib/queries";

const navButton =
  "h-10 rounded-lg px-3 text-[12px] font-semibold text-[#77818a] transition-colors hover:bg-[#eef2ef] hover:text-[#111827] data-active:bg-[#101b2d] data-active:text-white data-active:shadow-[0_5px_14px_rgba(16,27,45,0.14)] [&_svg]:size-[17px] [&_svg]:text-[#a2acb0] data-active:[&_svg]:text-[#f06445] max-md:justify-center max-md:px-0";

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
  const activeProject = projects.find((project) => project.id === projectId);
  const projectInitial = (activeProject?.name?.[0] ?? "P").toUpperCase();

  return (
    <Sidebar
      className="w-60 shrink-0 border-r border-[#e1e7e3] bg-[#f9fbf9] text-[#111827] max-md:w-16"
      collapsible="none"
    >
      <SidebarHeader className="gap-5 border-b border-[#e7ebe8] px-4 py-5 max-md:items-center max-md:px-2.5">
        <Link
          href="https://flaggable.dev"
          className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.04em] max-md:justify-center"
          aria-label="flaggable.dev home"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-[9px_9px_9px_2px] bg-[#101b2d] text-[18px] font-extrabold leading-none tracking-[-0.08em] text-white shadow-[0_4px_10px_rgba(16,27,45,0.16)]">
            f<span className="text-[#f06445]">.</span>
          </span>
          <span className="max-md:hidden">
            flaggable<span className="font-medium text-[#8c9791]">.dev</span>
          </span>
        </Link>

        <label className="group/project relative flex min-w-0 items-center gap-2.5 rounded-xl border border-[#dfe6e1] bg-white p-2.5 shadow-[0_2px_8px_rgba(16,27,45,0.04)] transition-colors focus-within:border-[#b9c9c0] focus-within:ring-2 focus-within:ring-[#dce9e1] hover:border-[#cbd8d0] max-md:size-10 max-md:justify-center max-md:rounded-[11px] max-md:border-0 max-md:p-0">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e8f0eb] text-[11px] font-extrabold text-[#315a45] max-md:size-10 max-md:rounded-[11px]">
            {projectInitial}
          </span>
          <span className="min-w-0 max-md:hidden">
            <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-[#9aa59f]">Workspace</span>
            <select
              aria-label="Select project"
              value={projectId}
              onChange={(event) => onProjectChange(event.target.value)}
              className="mt-0.5 block w-[145px] appearance-none truncate border-0 bg-transparent p-0 pr-4 text-[12px] font-semibold text-[#263342] outline-none"
            >
              {!projects.length && <option value="">No projects yet</option>}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </span>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-[#9da8a1] max-md:hidden" aria-hidden="true" />
        </label>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-7 px-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#a0aaa4] max-md:hidden">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard" title="Overview">
                    <LayoutDashboard />
                    <span className="max-md:hidden">Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild isActive={pathname === "/flags"}>
                  <Link href="/flags" title="Feature flags">
                    <Flag />
                    <span className="max-md:hidden">Feature flags</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge className="right-2 text-[10px] text-[#9ba6a0] peer-data-active/menu-button:text-[#f5a18c] max-md:hidden">
                  {flagCount}
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-7 p-0">
          <SidebarGroupLabel className="h-7 px-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#a0aaa4] max-md:hidden">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild>
                  <Link href="/dashboard#activity" title="Activity">
                    <Activity />
                    <span className="max-md:hidden">Activity</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} asChild>
                  <Link href="/dashboard#settings" title="Settings">
                    <Settings />
                    <span className="max-md:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-4 border-t border-[#e7ebe8] p-4 text-[9px] text-[#78857f] max-md:items-center max-md:px-2">
        <div className="flex items-center gap-2.5">
          <span className="size-2 shrink-0 rounded-full bg-[#1d9b69] shadow-[0_0_0_3px_rgba(29,155,105,0.12)]" />
          <span className="max-md:hidden">All systems operational</span>
        </div>
        <SidebarSeparator className="mx-0 w-full bg-[#e7ebe8]" />
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-[#f7d1c7] text-[9px] font-extrabold text-[#ad503c]">AL</AvatarFallback>
          </Avatar>
          <span className="min-w-0 max-md:hidden">
            <b className="block truncate text-[11px] text-[#303c4b]">Alex Lee</b>
            <small className="mt-0.5 block truncate text-[9px] text-[#9da6ab]">alex@flaggable.dev</small>
          </span>
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
    <SidebarProvider className="flex min-h-svh w-full flex-row bg-[#f5f6f4] text-[#111827]">
      <DashboardSidebar projects={projects} projectId={projectId} flagCount={flagCount} onProjectChange={onProjectChange} />
      <SidebarInset className="min-w-0 flex-1 bg-[#f5f6f4]">{children}</SidebarInset>
    </SidebarProvider>
  );
}
