"use client";

import * as React from "react"
import { type LucideIcon, Folder, MoreHorizontal, Share, Trash2 } from "lucide-react"

import { useSidebar, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation" // Next.js App Router

// 1) Import your data layer
import { useData } from "@/lib/data-provider"
import Link from "next/link";

export function NavProjects({
  projects,
}: {
  readonly projects: readonly {
    id: string
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  // 2) Access deleteProject from your data provider
  const { deleteProject } = useData()

  // 3) A helper to handle the user’s click
  function handleDeleteProject(id: string) {
    deleteProject(id)
    // Optionally confirm or show a toast, etc.
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projekte</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <Link href={`/dashboard/${item.id}`}>
                <span>{item.name}</span>
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
                    router.push(`/dashboard/${item.id}`)
                  }}
                >
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Share className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 4) Here’s the “Delete Project” click */}
                <DropdownMenuItem onClick={() => handleDeleteProject(item.id)}>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
