"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@flaggable/ui/avatar";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flaggable/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
} from "@flaggable/ui/sidebar";
import type { Project } from "@flaggable/contracts";

const navButton = "text-sm text-sidebar-foreground/80";

export function DashboardSidebar({
  projects,
  projectId,
  onProjectChange,
}: {
  projects: Project[];
  projectId: string;
  onProjectChange: (projectId: string) => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const project = projects.find((item) => item.id === projectId);
  const userName = user?.name ?? user?.nickname ?? user?.email ?? "Account";
  const userEmail = user?.email ?? "";
  const userInitials = getInitials(userName);

  return (
    <Sidebar collapsible="icon" className="h-svh max-h-svh border-r bg-sidebar">
      <SidebarHeader className="gap-2 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Select value={projectId} onValueChange={onProjectChange}>
              <SelectTrigger
                aria-label="Select project"
                className="h-12 w-full border-0 bg-transparent px-2 shadow-none hover:bg-sidebar-accent"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-xs font-semibold">
                    {(project?.name?.[0] ?? "P").toUpperCase()}
                  </span>
                  <span className="grid min-w-0 text-sm leading-tight">
                    <SelectValue placeholder="No projects yet" />
                    <span className="truncate text-xs text-muted-foreground">Project</span>
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent align="start" className="min-w-(--radix-select-trigger-width)">
                {projects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={navButton}
                  tooltip="Overview"
                  asChild
                  isActive={pathname === "/"}
                >
                  <Link href="/" title="Overview">
                    <LayoutDashboard />
                    <span>Overview</span>
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
                {user?.picture && <AvatarImage src={user.picture} alt="" className="rounded-lg" />}
                <AvatarFallback className="rounded-lg bg-[#f7d1c7] text-xs font-semibold text-[#ad503c]">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return initials.toUpperCase() || "A";
}

export function DashboardShell({
  children,
  projects,
  projectId,
  onProjectChange,
}: {
  children: React.ReactNode;
  projects: Project[];
  projectId: string;
  onProjectChange: (projectId: string) => void;
}) {
  return (
    <SidebarProvider className="flex min-h-svh w-full flex-row bg-background">
      <DashboardSidebar
        projects={projects}
        projectId={projectId}
        onProjectChange={onProjectChange}
      />
      <SidebarInset className="min-w-0 bg-background">
        <div className="dashboard-page-header">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
      <SidebarRail />
    </SidebarProvider>
  );
}
