"use client";

import * as React from "react"
import {
  Sparkles,
  Truck,
  Folder, 
  MoreHorizontal, 
  Share, 
  Trash2
} from "lucide-react"
import { useRouter } from "next/navigation" // Next.js App Router

import { NavSecondary } from "@/components/nav-secondary"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useUser();
  const { projects, loadingProjects, removeProject } = useProjects();
  const { isMobile } = useSidebar()
  const router = useRouter()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="#">
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
                <span className="text-sm text-muted-foreground">No projects found</span>
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
                          <span>Edit Data</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <Share className="text-muted-foreground" />
                          <span>Share Project</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* 4) Here’s the “Delete Project” click */}
                        <DropdownMenuItem onClick={() => removeProject(item.id)}>
                          <Trash2 className="text-muted-foreground" />
                          <span>Delete Project</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroup>

        <NavSecondary
          items={[
            { title: "Assistant", url: "/assistant", icon: Sparkles },
          ]}
          className="mt-auto"
        />
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
