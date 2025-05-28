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
import { AutoComplete, type Option } from "@/lib/autocomplete";
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
  const { addStep, steps } = useSteps();
  const [loadingSteps] = React.useState(false); // Add loadingSteps state
  const { addStepToCategory } = useTree();

  const stepOptions: Option[] = steps.map((step) => ({
    value: step.id,
    label: step.name,
  }));

  const [selected, setSelected] = React.useState<Option | undefined>(undefined);

  const [name, setName] = React.useState("");
  const [person, setPerson] = React.useState("");
  const [salary, setSalary] = React.useState<number | "">("");
  const [driver, setDriver] = React.useState("");
  const [driverValue, setDriverValue] = React.useState<number | "">("");
  const [duration, setDuration] = React.useState<number | "">("");
  const [resources, setResources] = React.useState("");
  const [resourceValue, setResourceValue] = React.useState<number | "">("");

  const resetForm = () => {
    setSelected(undefined);
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
    if (selected) {
      await addStepToCategory(projectId, categoryId, {
        id: selected.value,
        name: selected.label,
      });
      resetForm();
      onOpenChange(false);
      return;
    }

    if (!name.trim()) {
      alert("Bitte Schrittname eingeben");
      return;
    }

    const newStep: Omit<StepDoc, "id"> = {
      name,
      person: person ? [person] : [],
      costDriver: driver,
      costDriverValue: Number(driverValue),
      stepDuration: Number(duration),
      additionalResources: resources ? resources.split(",").map(r => r.trim()).filter(Boolean) : [],
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
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neuen Schritt hinzufügen</DialogTitle>
          <DialogDescription>
            Wähle einen bestehenden Schritt oder erstelle einen neuen.
          </DialogDescription>
        </DialogHeader>

        <AutoComplete
          options={stepOptions}
          emptyMessage="Keine Ergebnisse"
          placeholder="Vorhandenen Schritt suchen..."
          onValueChange={setSelected}
          value={selected}
          disabled={false}
          isLoading={loadingSteps}
        />

        {!selected && (
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
          </div>
        )}

        {selected && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span>Ausgewählter Schritt: <strong>{selected.label}</strong></span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(undefined)}>
              Auswahl entfernen
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSubmit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
