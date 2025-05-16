// autocomplete.tsx
import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { useState, useRef, useEffect, type KeyboardEvent } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Option = Record<"value" | "label", string> & Record<string, string>;

type AutoCompleteProps = {
  options: Option[];
  emptyMessage: string;
  /** the *selected* option – controlled from the outside */
  value?: Option;
  /** called when the user picks a new option */
  onValueChange?: (opt: Option) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export const AutoComplete = ({
  options,
  placeholder,
  emptyMessage,
  value,
  onValueChange,
  disabled,
  isLoading = false,
}: AutoCompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setOpen] = useState(false);
  /** what the user is *currently typing* */
  const [inputValue, setInputValue] = useState(value?.label ?? "");

  /* ──────────────────────────────────────────
   * keep the text box in sync with the selection
   * ──────────────────────────────────────────*/
  useEffect(() => {
    if (!isOpen) {
      setInputValue(value?.label ?? "");
    }
  }, [value, isOpen]);

  /* ──────────────────────────────────────────
   * helpers
   * ──────────────────────────────────────────*/
  const closeDropdown = () => {
    setOpen(false);
    /* defocus in the next tick so cmdk doesn’t reopen */
    setTimeout(() => inputRef.current?.blur(), 0);
  };

  const commitSelection = (opt: Option) => {
    onValueChange?.(opt);
    setInputValue(opt.label);
    closeDropdown();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    if (!isOpen) setOpen(true);

    if (e.key === "Enter" && inputEl.value.trim() !== "") {
      const found = options.find((o) => o.label === inputEl.value.trim());
      if (found) commitSelection(found);
    }
    if (e.key === "Escape") inputEl.blur();
  };

  const handleBlur = () => {
    closeDropdown();
    /* user clicked away ⇒ revert half-typed search text */
    setInputValue(value?.label ?? "");
  };

  /* ──────────────────────────────────────────
   * render
   * ──────────────────────────────────────────*/
  return (
    <CommandPrimitive onKeyDown={handleKeyDown}>
      {/* input */}
      <CommandInput
        ref={inputRef}
        value={inputValue}
        onValueChange={isLoading ? undefined : setInputValue}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="text-base"
      />

      {/* dropdown */}
      <div className="relative mt-1">
        <div
          className={cn(
            "animate-in fade-in-0 absolute top-0 w-full max-h-60 overflow-y-auto bg-popover text-popover-foreground z-50 rounded-md border p-2 shadow-md outline-hidden",
            isOpen && inputValue.trim() !== "" ? "block" : "hidden",
          )}
        >
          <CommandList className="overflow-visible">
            {isLoading && (
              <CommandPrimitive.Loading>
                <div className="p-1">
                  <Skeleton className="h-8 w-full" />
                </div>
              </CommandPrimitive.Loading>
            )}

            {!isLoading && options.length > 0 && (
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = opt.value === value?.value;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onMouseDown={(e) => {
                        /* prevent cmdk from closing before we handle it */
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => commitSelection(opt)}
                      className={cn(
                        "flex w-full items-center gap-2",
                        isSelected ? "pl-2 font-medium" : "pl-8",
                      )}
                    >
                      {isSelected ? <Check className="w-4" /> : null}
                      {opt.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {!isLoading && (
              <CommandPrimitive.Empty className="select-none rounded-sm px-2 py-3 text-center text-sm">
                {emptyMessage}
              </CommandPrimitive.Empty>
            )}
          </CommandList>
        </div>
      </div>
    </CommandPrimitive>
  );
};
