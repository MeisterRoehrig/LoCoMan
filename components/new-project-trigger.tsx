"use client";

import * as React from "react";
import { File } from "lucide-react";

// ShadCN UI imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sidebar menu (same as NavMain uses)
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Collapsible } from "@/components/ui/collapsible";

// Your data hook (adjust import to your setup)
import { useData } from "@/lib/data-provider";

export function NavMainNewProject() {
  const { createProject } = useData();

  // State for dialog fields
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Handler for creating the project
  const handleCreateProject = () => {
    if (!name.trim()) {
      alert("Bitte Projektname eingeben.");
      return;
    }
    createProject(name, description);
    // Clear and close
    setName("");
    setDescription("");
    setDialogOpen(false);
  };

  return (
    <SidebarGroup>
      {/* You can rename "Platform" to whatever section heading you want */}
      <SidebarMenu>
        {/* A single top-level “NavMain” item: collapsible just for consistent structure */}
        <Collapsible asChild defaultOpen={false}>
          <SidebarMenuItem>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              {/* The main button that looks exactly like a NavMain item */}
              <DialogTrigger asChild>
                <SidebarMenuButton asChild tooltip="Neues Projekt">
                  <span className="flex items-center gap-2">
                    <File />
                    <span>Neues Projekt</span>
                  </span>
                </SidebarMenuButton>
              </DialogTrigger>

              {/* No sub-items here, but if you wanted them: 
                  <CollapsibleTrigger asChild> + <SidebarMenuAction> ... 
                  <CollapsibleContent> ... 
              */}

              {/* The dialog that prompts for project name/desc */}
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Neues Projekt</DialogTitle>
                  <DialogDescription>
                    Geben Sie einen Namen und eine kurze Beschreibung für Ihr neues Projekt ein.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="projectName" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="projectName"
                      className="col-span-3"
                      placeholder="Projektname..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="projectDesc" className="text-right">
                      Beschreibung
                    </Label>
                    <Input
                      id="projectDesc"
                      className="col-span-3"
                      placeholder="Kurze Projektbeschreibung..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreateProject}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
