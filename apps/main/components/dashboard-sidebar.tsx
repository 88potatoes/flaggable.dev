"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FolderPlus,
  Rocket,
  KeyRound,
  LayoutDashboard,
  Plus,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@flaggable/ui/button";

import { Avatar, AvatarFallback, AvatarImage } from "@flaggable/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@flaggable/ui/dropdown-menu";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryOnboarding } from "@/slices/onboarding/queries";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@flaggable/ui/sidebar";
import type { Project } from "@flaggable/contracts";
import { logoutUrl } from "./auth-provider";

const navButton = "text-sm text-sidebar-foreground/80";

export function DashboardSidebar({
  projects,
  projectId,
  onProjectChange,
  onNewFlag,
  onNewProject,
}: {
  projects: Project[];
  projectId: string;
  onProjectChange: (projectId: string) => void;
  onNewFlag?: () => void;
  onNewProject?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { state } = useSidebar();
  const onboardingQuery = useQueryOnboarding();
  const project = projects.find((item) => item.id === projectId);
  const userName = user?.name ?? user?.nickname ?? user?.email ?? "Account";
  const userEmail = user?.email ?? "";
  const userInitials = getInitials(userName);
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="h-svh max-h-svh border-r bg-sidebar">
      <SidebarHeader className="gap-2 p-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <Select value={projectId} onValueChange={onProjectChange}>
                <SelectTrigger
                  aria-label="Select project"
                  className={`h-12 w-full border-0 bg-transparent shadow-none hover:bg-[var(--surface-2)] ${
                    isCollapsed ? "px-0 [&>svg]:hidden" : "px-2"
                  }`}
                >
                  <div
                    className={`flex min-w-0 flex-1 items-center text-left ${
                      isCollapsed ? "justify-center" : "gap-2"
                    }`}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-primary)]">
                      {(project?.name?.[0] ?? "P").toUpperCase()}
                    </span>
                    {!isCollapsed && (
                      <span className="grid min-w-0 text-sm leading-tight">
                        <SelectValue placeholder="No projects yet" />
                        <span className="truncate text-xs text-muted-foreground">Project</span>
                      </span>
                    )}
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
            </div>
            {!isCollapsed && onNewProject && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onNewProject}
                title="Create new project"
                aria-label="Create new project"
                className="size-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <FolderPlus className="size-4" />
              </Button>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {onNewFlag && (
          <SidebarGroup className="pb-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-9 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:text-white"
                    tooltip="New flag"
                    onClick={onNewFlag}
                  >
                    <Plus />
                    {!isCollapsed && <span>New flag</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
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
                    {!isCollapsed && <span>Overview</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {onboardingQuery.data?.status !== "completed" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={navButton}
                    tooltip="Onboarding"
                    asChild
                    isActive={pathname === "/onboard"}
                  >
                    <Link href="/onboard" title="Onboarding">
                      <Rocket />
                      {!isCollapsed && <span>Onboarding</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={navButton}
                  tooltip="API Keys"
                  asChild
                  isActive={pathname === "/api-keys" || pathname === "/public-keys"}
                >
                  <Link href="/api-keys" title="API Keys">
                    <KeyRound />
                    {!isCollapsed && <span>API Keys</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className={navButton} tooltip="SDK Docs" asChild>
                  <a href="/docs/sdk.md" target="_blank" rel="noreferrer" title="SDK Docs">
                    <BookOpen />
                    {!isCollapsed && <span>SDK Docs</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Collapse sidebar"
              className="mb-2 hover:bg-sidebar-accent"
            >
              <SidebarTrigger className="flex items-center gap-2">
                <PanelLeftClose className="h-4 w-4" />
                {!isCollapsed && <span>Collapse</span>}
              </SidebarTrigger>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="Account" className="hover:bg-sidebar-accent">
                  <Avatar className="size-8 rounded-lg">
                    {user?.picture && (
                      <AvatarImage src={user.picture} alt="" className="rounded-lg" />
                    )}
                    <AvatarFallback className="rounded-lg bg-[#f7d1c7] text-xs font-semibold text-[#ad503c]">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <span className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userName}</span>
                      <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                    </span>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => window.location.assign(logoutUrl)}
                  >
                    Log out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
  onNewFlag,
  onNewProject,
  flagSidebar,
}: {
  children: React.ReactNode;
  projects: Project[];
  projectId: string;
  onProjectChange: (projectId: string) => void;
  onNewFlag?: () => void;
  onNewProject?: () => void;
  flagSidebar?: React.ReactNode;
}) {
  return (
    <SidebarProvider className="flex min-h-svh w-full flex-row bg-background">
      <DashboardSidebar
        projects={projects}
        projectId={projectId}
        onProjectChange={onProjectChange}
        onNewFlag={onNewFlag}
        onNewProject={onNewProject}
      />
      <FlagSidebarWrapper flagSidebar={flagSidebar} />
      <SidebarInset className={`min-w-0 bg-background flex-1 ${flagSidebar ? "ml-80" : ""}`}>
        {children}
      </SidebarInset>
      <SidebarRail />
    </SidebarProvider>
  );
}

function FlagSidebarWrapper({ flagSidebar }: { flagSidebar?: React.ReactNode }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!flagSidebar) return null;

  return (
    <div
      className={`fixed top-0 z-10 flex h-svh w-80 flex-col border-r border-sidebar-border bg-sidebar/30 overflow-hidden transition-[left] duration-200 ease-linear ${
        isCollapsed ? "left-12" : "left-64"
      }`}
    >
      {flagSidebar}
    </div>
  );
}
