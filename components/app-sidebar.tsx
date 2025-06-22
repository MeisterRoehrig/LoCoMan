"use client";

import * as React from "react"
import {
  Truck,
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  MessageSquareText,
  PhoneCall
} from "lucide-react"
import { useRouter } from "next/navigation" // Next.js App Router

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction
} from "@/components/ui/sidebar"
import Link from "next/link"
import { NewProjectButton } from "@/components/new-project-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useUser } from "@/providers/user-provider";
import { useProjects } from "@/providers/projects-provider";
import { toast } from "sonner";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useUser();
  const { projects, loadingProjects, removeProject } = useProjects();
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleShareProject = React.useCallback(
    async (projectId: string) => {
      try {
        if (typeof window === "undefined") return;
        const url = `${window.location.origin}/dashboard/${projectId}`;

        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          // Fallback for very old browsers: create a temporary textarea
          const textarea = document.createElement("textarea");
          textarea.value = url;
          textarea.style.position = "fixed"; // ensure it isn't scrolled into view
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        toast("Project link copied to your clipboard.");
      } catch (err) {
        console.error("Error copying project link:", err);
        toast("Something went wrong while copying. Please try again.");
      }
    },
    [toast]
  );

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Truck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">LoCoMan</span>
                  <span className="truncate text-xs">DHBW Friedrichshafen</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Example of a "New Project" link or button in the main nav: */}

        <NewProjectButton />
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Projekte</SidebarGroupLabel>
          {/* 5) Use the loading state to show a spinner or skeleton */}
          {loadingProjects && (
            <div className="flex items-center justify-center py-2">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          )}

          {/* 6) Use the projects data to render the list */}
          {!loadingProjects && projects.length === 0 && (
            <div className="flex items-center justify-center py-2">
              <span className="text-sm text-muted-foreground">Keine Projekte gefunden</span>
            </div>
          )}

          {/* 7) Render the project list */}
          {!loadingProjects && projects.length > 0 && (
            <SidebarMenu>
              {projects.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/dashboard/${item.id}`}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      className="w-48"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(`/dashboard/${item.id}/data`)
                        }}
                      >
                        <Folder className="text-muted-foreground" />
                        <span>Daten Editieren</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(`/dashboard/${item.id}/chat`)
                        }}
                      >
                        <MessageSquareText className="text-muted-foreground" />
                        <span>AI Chat</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(`/dashboard/${item.id}/call`)
                        }}
                      >
                        <PhoneCall className="text-muted-foreground" />
                        <span>Sprach Assistent</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => handleShareProject(item.id)}>
                        <Share className="text-muted-foreground" />
                        <span>Projekt Teilen</span>
                      </DropdownMenuItem>

                      {/* 4) Here’s the “Delete Project” click */}
                      <DropdownMenuItem onClick={() => removeProject(item.id)}>
                        <Trash2 className="text-muted-foreground" />
                        <span>Projekt Löschen</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: userProfile?.displayName ?? "Loading...",
            email: userProfile?.email ?? "",
            avatar: userProfile?.avatarUrl ?? "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
