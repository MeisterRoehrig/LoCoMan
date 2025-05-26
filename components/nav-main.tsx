"use client";

import { ChevronRight, LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavMainItem = {
  title: string
  icon: LucideIcon
  url?: string                  // (now optional)
  onClick?: () => void          // (added)
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({ items }: { readonly items: ReadonlyArray<NavMainItem> }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem >
              {/* ========== PRIMARY LABEL: Link or Button ========== */}
              {(() => {
                let content;
                if (item.onClick) {
                  // If there's an onClick, we render a button:
                  content = (
                    <SidebarMenuButton
                      // If you want a tooltip, pass `tooltip={item.title}`
                      tooltip={item.title}
                      onClick={item.onClick}
                      className="cursor-pointer" 
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  );
                } else if (item.url) {
                  // Otherwise, if there's a url, render an <a href=...>
                  content = (
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  );
                } else {
                  // Fallback if neither url nor onClick
                  content = (
                    <SidebarMenuButton disabled>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  );
                }
                return content;
              })()}

              {/* ========== COLLAPSIBLE SUB-ITEMS (if any) ========== */}
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
