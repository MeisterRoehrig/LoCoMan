"use client";

import * as React from "react";
import { File } from "lucide-react";

import { NavMain } from "@/components/nav-main";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProjects } from "@/providers/projects-provider";

export function NewProjectButton() {
  const { addProject, addProjectWithDefaultTree } = useProjects();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [useDefault, setUseDefault] = React.useState(true);

  function handleCreate() {
    if (!name.trim()) {
      alert("Bitte Projektname eingeben");
      return;
    }

    if (useDefault) {
      addProjectWithDefaultTree(name, description);
    } else {
      addProject(name, description);
    }

    // Cleanup
    setName("");
    setDescription("");
    setUseDefault(false);
    setDialogOpen(false);
  }

  return (
    <>
      <NavMain
        items={[
          {
            title: "Neues Projekt",
            icon: File,
            onClick: () => {
              setDialogOpen(true);
            },
            items: [],
          },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Neues Projekt</DialogTitle>
            <DialogDescription>
              Bitte geben Sie Ihrem neuen Projekt einen Namen und eine Beschreibung.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Name
              </Label>
              <Input
                id="project-name"
                className="col-span-3"
                value={name}
                placeholder="Projektname..."
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-desc" className="text-right">
                Beschreibung
              </Label>
              <Input
                id="project-desc"
                className="col-span-3"
                value={description}
                placeholder="Kurze Beschreibung..."
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3 px-1">
              <Switch
                id="default-project-switch"
                checked={useDefault}
                onCheckedChange={setUseDefault}
              />
              <Label htmlFor="default-project-switch">
                Standardstruktur verwenden
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreate}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
