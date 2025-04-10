"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { TreeDataItem } from "@/lib/data-provider";
import { useData } from "@/lib/data-provider";
import { useDebounce } from "@/hooks/use-debounce";

interface ItemDetailsProps {
  projectId: string;
  item: TreeDataItem;
}

/**
 * Renders detail fields for a single TreeDataItem.
 * Debounces updates so Firestore is only updated after
 * the user stops typing for ~500ms.
 */
export default function ItemDetails({ projectId, item }: ItemDetailsProps) {
  const { updateTreeItem } = useData();

  // We store all relevant fields in one local state object
  const [formValues, setFormValues] = React.useState({
    responsiblePerson: "",
    responsiblePersonValue: "",
    executionTime: "",
    costDriverLabel: "",
    costDriverValue: "",
    helperLabel: "",
    helperValue: "",
    sum: "",
  });

  // We'll track whether the user has actually "typed" or changed something,
  // so we don't update the DB immediately upon just selecting an item.
  const [dirty, setDirty] = React.useState(false);

  // On mount or when `item` changes, we set local form values
  React.useEffect(() => {
    setFormValues({
      responsiblePerson: item.responsiblePerson ?? "",
      responsiblePersonValue: item.responsiblePersonValue?.toString() ?? "",
      executionTime: item.executionTime?.toString() ?? "",
      costDriverLabel: item.costDriverLabel ?? "",
      costDriverValue: item.costDriverValue?.toString() ?? "",
      helperLabel: item.helperLabel ?? "",
      helperValue: item.helperValue?.toString() ?? "",
      sum: item.sum?.toString() ?? "",
    });
    setDirty(false); // reset dirty when a new item is selected
  }, [item]);

  // A debounced version of `formValues`.
  // This will only update 500ms after the last user keystroke.
  const debouncedFormValues = useDebounce(formValues, 500);

  // Whenever `debouncedFormValues` changes, if we are dirty, do one Firestore update
  React.useEffect(() => {
    if (!dirty) return; // do not update if user hasn’t changed anything
    if (!item.id) return; // safety check

    // Convert to partial data for Firestore
    const dataToUpdate: Partial<TreeDataItem> = {
      responsiblePerson:
        debouncedFormValues.responsiblePerson.trim() === ""
          ? null
          : debouncedFormValues.responsiblePerson.trim(),
      responsiblePersonValue:
        debouncedFormValues.responsiblePersonValue.trim() === ""
          ? null
          : parseFloat(debouncedFormValues.responsiblePersonValue),
      executionTime:
        debouncedFormValues.executionTime.trim() === ""
          ? null
          : parseFloat(debouncedFormValues.executionTime),
      costDriverLabel:
        debouncedFormValues.costDriverLabel.trim() === ""
          ? null
          : debouncedFormValues.costDriverLabel.trim(),
      costDriverValue:
        debouncedFormValues.costDriverValue.trim() === ""
          ? null
          : parseFloat(debouncedFormValues.costDriverValue),
      helperLabel:
        debouncedFormValues.helperLabel.trim() === ""
          ? null
          : debouncedFormValues.helperLabel.trim(),
      helperValue:
        debouncedFormValues.helperValue.trim() === ""
          ? null
          : parseFloat(debouncedFormValues.helperValue),
      sum:
        debouncedFormValues.sum.trim() === ""
          ? null
          : parseFloat(debouncedFormValues.sum),
    };

    updateTreeItem(projectId, item.id, dataToUpdate);
  }, [debouncedFormValues, dirty, item.id, projectId, updateTreeItem]);

  /** Helper for changing any field in the form */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof formValues) {
    // Calcuulate Summe based on entrys the sum is the sum of (responsiblePersonValue / executionTime) * costDriverValue + helperValue
    if (key === "responsiblePersonValue" || key === "executionTime" || key === "costDriverValue" || key === "helperValue") {
      const responsiblePersonValue = parseFloat(formValues.responsiblePersonValue) || 0;
      const executionTime = parseFloat(formValues.executionTime) || 0;
      const costDriverValue = parseFloat(formValues.costDriverValue) || 0;
      const helperValue = parseFloat(formValues.helperValue) || 0;
      const sum = (responsiblePersonValue / executionTime) * costDriverValue + helperValue;
      setFormValues((prev) => ({
        ...prev,
        sum: sum.toString(),
      }));
    }
  
    setDirty(true); // now we know the user typed something
    setFormValues((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  }

  return (
    <>
      <span className="font-semibold">Ausgewählter Knoten:</span>
      <div className="mt-2 mb-4">
        <p>Node ID: {item.id}</p>
        <p>Name: {item.name}</p>
      </div>

      <Separator className="mb-2" />
      <span className="font-semibold">Zuständiger</span>
      <div className="flex space-x-4 pt-2">
        <Input
          type="text"
          placeholder="Vertriebsmitarbeiter"
          value={formValues.responsiblePerson}
          onChange={(e) => handleChange(e, "responsiblePerson")}
        />
        <Input
          type="number"
          placeholder="5400"
          value={formValues.responsiblePersonValue}
          onChange={(e) => handleChange(e, "responsiblePersonValue")}
        />
      </div>

      <Separator className="mt-4" />
      <span className="font-semibold">Durchführungszeit</span>
      <div className="flex space-x-4 pt-2">
        <Input
          type="number"
          placeholder="5"
          value={formValues.executionTime}
          onChange={(e) => handleChange(e, "executionTime")}
        />
      </div>

      <Separator className="mt-4" />
      <span className="font-semibold">Kostentreiber</span>
      <div className="flex space-x-4 pt-2">
        <Input
          type="text"
          placeholder="Anzahl Angebote"
          value={formValues.costDriverLabel}
          onChange={(e) => handleChange(e, "costDriverLabel")}
        />
        <Input
          type="number"
          placeholder="504"
          value={formValues.costDriverValue}
          onChange={(e) => handleChange(e, "costDriverValue")}
        />
      </div>

      <Separator className="mt-4" />
      <span className="font-semibold">Hilfsmittel</span>
      <div className="flex space-x-4 pt-2">
        <Input
          type="text"
          placeholder="Tachograph"
          value={formValues.helperLabel}
          onChange={(e) => handleChange(e, "helperLabel")}
        />
        <Input
          type="number"
          placeholder="700"
          value={formValues.helperValue}
          onChange={(e) => handleChange(e, "helperValue")}
        />
      </div>

      <Separator className="mt-4" />
      <span className="font-semibold">Summe</span>
      <div className="flex space-x-4 pt-2">
        <Input
          type="number"
          placeholder="360"
          value={formValues.sum}
          onChange={(e) => handleChange(e, "sum")}
        />
      </div>
    </>
  );
}
