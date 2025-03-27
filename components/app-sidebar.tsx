"use client";

import * as React from "react"
import {
  File,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Truck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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
} from "@/components/ui/sidebar"
import Link from "next/link"
import { useData } from "@/lib/data-provider"  // <-- import your data context

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 1) Access Firestore projects via the DataProvider
  const { projects, createProject, deleteProject, loading } = useData();

  // 2) Optionally replace your static `data.projects` with the real projects
  // (The "projects" array has the shape: { id, title, description, ... })

  // Example: transform it into the shape the NavProjects component expects:
  const navProjects = React.useMemo(() => {
    return projects.map((proj) => ({
      name: proj.title,
      url: `#`, // or you can define a route like `/projects/${proj.id}`
      icon: Frame, // pick an icon for all or base it on project content
      // you can store `proj.id` for use in a callback if you need it
    }));
  }, [projects]);


  // Simple handler for new projects (could be replaced with a form, etc.)
  const handleNewProject = () => {
    createProject("Neues Projekt", "An optional description");
  };


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
        <NavMain
          items={[
            {
              title: "Neues Projekt",
              icon: File,
              // By leaving out `url`, we ensure it calls onClick
              onClick: () => {
                createProject("Untitled Project", "Optional description here")
              },
              items: [],
            },
          ]}
        />

        {/* Pass in the real projects array */}
        <NavProjects projects={navProjects} />

        <NavSecondary
          items={[
            { title: "Support", url: "#", icon: LifeBuoy },
            { title: "Feedback", url: "#", icon: Send },
          ]}
          className="mt-auto"
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: "User",
            email: "u@example.com",
            avatar: "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
