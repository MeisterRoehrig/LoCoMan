"use client";

import * as React from "react";
import { File } from "lucide-react";

import { useData } from "@/lib/data-provider";
import { NavMain } from "@/components/nav-main";

// ShadCN UI imports (adjust paths as needed):
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


export function NewProjectButton() {
  const { createProject } = useData();

  // Local states for dialog usage
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Called when user clicks "Create" in the dialog
  function handleCreate() {
    if (!name.trim()) {
      alert("Bitte Projektname eingeben");
      return;
    }

    createProject(name, description);
    // Reset fields, close the dialog
    setName("");
    setDescription("");
    setDialogOpen(false);
  }

  return (
    <>
      {/* 
        NavMain uses onClick to open the dialog 
        (instead of calling createProject directly). 
      */}
      <NavMain
        items={[
          {
            title: "Neues Projekt",
            icon: File,
            onClick: () => setDialogOpen(true), // Open the dialog
            items: [],
          },
        ]}
      />

      {/* The dialog that prompts for name/description */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Neues Projekt</DialogTitle>
            <DialogDescription>
              Bitte geben Sie Ihrem neuen Projekt einen Namen und eine Beschreibung.
            </DialogDescription>
          </DialogHeader>

          {/* Dialog Body */}
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
          </div>

          {/* Dialog Footer */}
          <DialogFooter>
            {/* Cancel button just closes the dialog */}

            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
