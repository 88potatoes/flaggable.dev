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

const navButton = "text-xs font-semibold text-[#77818a] hover:bg-[#f0f2f0] hover:text-[#111827] data-active:bg-[#e9edeb] data-active:text-[#111827] [&_svg]:text-[#9ba4a9] data-active:[&_svg]:text-[#f06445]";

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
    <Sidebar className="w-60 shrink-0 border-r border-[#dfe4e8] bg-[#fbfcfa] text-[#111827] max-md:w-16" collapsible="none">
      <SidebarHeader className="gap-8 p-5 max-md:items-center max-md:px-2.5">
        <Link href="https://flaggable.dev" className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.04em] max-md:justify-center" aria-label="flaggable.dev home">
          <span className="grid size-[27px] shrink-0 place-items-center rounded-[8px_8px_8px_2px] bg-[#101b2d] text-[17px] font-extrabold leading-none tracking-[-0.08em] text-white">f<span className="text-[#f06445]">.</span></span>
          <span className="max-md:hidden">flaggable<span className="font-medium opacity-50">.dev</span></span>
        </Link>

        <label className="flex items-center gap-2.5 rounded-lg border border-[#dfe4e8] bg-white p-2.5 shadow-none max-md:border-0 max-md:p-0">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#101b2d] text-xs font-extrabold text-white">A</span>
          <span className="min-w-0 max-md:hidden">
            <b className="block text-xs">Project</b>
            <select aria-label="Select project" value={projectId} onChange={(event) => onProjectChange(event.target.value)} className="mt-0.5 block w-[145px] appearance-none border-0 bg-transparent p-0 text-[11px] text-[#77818a] outline-none">
              {!projects.length && <option value="">No projects yet</option>}
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </span>
          <ChevronDown className="ml-auto size-4 text-[#9da6ac] max-md:hidden" aria-hidden="true" />
        </label>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="h-8 px-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#a0a8ae] max-md:hidden">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton className={navButton} asChild isActive={pathname === "/dashboard"}><Link href="/dashboard"><LayoutDashboard /><span className="max-md:hidden">Overview</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton className={navButton} asChild isActive={pathname === "/flags"}><Link href="/flags"><Flag /><span className="max-md:hidden">Feature flags</span></Link></SidebarMenuButton><SidebarMenuBadge className="text-[10px] text-[#a4adb2] max-md:hidden">{flagCount}</SidebarMenuBadge></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="h-8 px-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#a0a8ae] max-md:hidden">Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton className={navButton} asChild><Link href="/dashboard#activity"><Activity /><span className="max-md:hidden">Activity</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton className={navButton} asChild><Link href="/dashboard#settings"><Settings /><span className="max-md:hidden">Settings</span></Link></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-4 text-[9px] text-[#78857f] max-md:items-center max-md:px-2">
        <div className="flex items-center gap-2"><span className="size-2 shrink-0 rounded-full bg-[#1d9b69] shadow-[0_0_0_3px_rgba(29,155,105,0.12)]" /><span className="max-md:hidden">All systems operational</span></div>
        <SidebarSeparator className="mx-0 w-full bg-[#dfe4e8]" />
        <div className="flex items-center gap-2"><Avatar size="sm"><AvatarFallback className="bg-[#f7d1c7] text-[9px] font-extrabold text-[#ad503c]">AL</AvatarFallback></Avatar><span className="max-md:hidden"><b className="block text-[11px] text-[#303c4b]">Alex Lee</b><small className="mt-0.5 block text-[9px] text-[#9da6ab]">alex@flaggable.dev</small></span></div>
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
      <div className="flex min-h-svh w-full flex-row bg-[#f5f6f4] text-[#111827]">
        <DashboardSidebar projects={projects} projectId={projectId} flagCount={flagCount} onProjectChange={onProjectChange} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
