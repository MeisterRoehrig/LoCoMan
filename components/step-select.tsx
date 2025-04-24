// StepSelect.tsx
"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useSteps } from "@/providers/steps-provider";
import { Check } from "lucide-react";
import React from "react";

type Props = {
  onSelect: (step: { id: string; name: string } | null) => void;
  selected?: { id: string; name: string } | null;
};

export default function StepSelect({ onSelect, selected }: Props) {
  const { steps } = useSteps();

  return (
    <Command shouldFilter={false} className="w-full">
      <CommandInput placeholder="Bestehenden Schritt suchen…" />
      <CommandList>
        <CommandEmpty>Kein Treffer – neuen Schritt anlegen ↓</CommandEmpty>

        <CommandGroup heading="Alle Schritte">
          {steps.map((s) => (
            <CommandItem
              key={s.id}
              value={s.name}
              onSelect={() => onSelect({ id: s.id, name: s.name })}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selected?.id === s.id ? "opacity-100" : "opacity-0"
                )}
              />
              {s.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
