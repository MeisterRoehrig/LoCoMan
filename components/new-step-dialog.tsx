"use client";

import React from "react";
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
import { useSteps } from "@/providers/steps-provider";
import { useTree } from "@/providers/tree-provider";
import { StepDoc } from "@/providers/steps-provider";

export function NewStepDialog({
  open,
  onOpenChange,
  projectId,
  categoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  categoryId: string;
}) {
  const { addStep } = useSteps();
  const { addStepToCategory } = useTree();

  const [name, setName] = React.useState("");
  const [person, setPerson] = React.useState("");
  const [salary, setSalary] = React.useState<number | "">("");
  const [driver, setDriver] = React.useState("");
  const [driverValue, setDriverValue] = React.useState<number | "">("");
  const [duration, setDuration] = React.useState<number | "">("");
  const [resources, setResources] = React.useState("");
  const [resourceValue, setResourceValue] = React.useState<number | "">("");

  const resetForm = () => {
    setName("");
    setPerson("");
    setSalary("");
    setDriver("");
    setDriverValue("");
    setDuration("");
    setResources("");
    setResourceValue("");
  };

  async function handleSubmit() {
    if (!name.trim()) {
      alert("Bitte Schrittname eingeben");
      return;
    }

    const newStep: Omit<StepDoc, "id"> = {
      name,
      person,
      personMonthlySalary: Number(salary),
      costDriver: driver,
      costDriverValue: Number(driverValue),
      stepDuration: Number(duration),
      additionalResources: resources,
      additionalResourcesValue: Number(resourceValue),
      createdAt: null,
      updatedAt: null,
    };

    const stepId = await addStep(newStep);

    if (stepId) {
      await addStepToCategory(projectId, categoryId, {
        id: stepId,
        name: newStep.name,
      });
    }

    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neuen Schritt hinzufügen</DialogTitle>
          <DialogDescription>
            Erstelle einen neuen Schritt direkt in dieser Kategorie.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <Input
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Verpackung vorbereiten"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Person</Label>
            <Input
              className="col-span-3"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="z.B. Lagerist"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Gehalt (€)</Label>
            <Input
              type="number"
              className="col-span-3"
              value={salary}
              onChange={(e) => setSalary(e.target.valueAsNumber || "")}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Kosten-Treiber</Label>
            <Input
              className="col-span-3"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="z.B. Pakete pro Tag"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Treiberwert</Label>
            <Input
              type="number"
              className="col-span-3"
              value={driverValue}
              onChange={(e) => setDriverValue(e.target.valueAsNumber || "")}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Dauer (min)</Label>
            <Input
              type="number"
              className="col-span-3"
              value={duration}
              onChange={(e) => setDuration(e.target.valueAsNumber || "")}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Zusatzressourcen</Label>
            <Input
              className="col-span-3"
              value={resources}
              onChange={(e) => setResources(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Ressourcenkosten (€)</Label>
            <Input
              type="number"
              className="col-span-3"
              value={resourceValue}
              onChange={(e) => setResourceValue(e.target.valueAsNumber || "")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
