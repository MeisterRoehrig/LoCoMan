"use client";

import * as React from "react"
import {
  Frame,
  LifeBuoy,
  Send,
  Truck,
} from "lucide-react"

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
import { useData } from "@/lib/data-provider" 
import { NewProjectButton } from "@/components/new-project-dialog";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 1) Access Firestore projects via the DataProvider
  const {userProfile, projects } = useData();

  // Example: transform it into the shape the NavProjects component expects:
  const navProjects = React.useMemo(() => {
    return projects.map((proj) => ({
      id: proj.id, // include the id property
      name: proj.title,
      url: `#`, // or you can define a route like `/projects/${proj.id}`
      icon: Frame, // pick an icon for all or base it on project content
    }));
  }, [projects]);


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
        <NewProjectButton
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
            name: userProfile?.displayName ?? "Loading...",
            email: userProfile?.email ?? "",
            avatar: userProfile?.avatarUrl ?? "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
