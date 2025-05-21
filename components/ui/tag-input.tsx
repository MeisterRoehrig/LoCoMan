import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Badge } from "@/components/ui/badge";
import { XIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import React, {
  forwardRef,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
  KeyboardEvent,
} from "react";

/* ──────────────────────────────────────────
 * public API
 * ──────────────────────────────────────────*/
export interface TagOption {
  /** the database id */
  id: string;
  /** what the user sees */
  label: string;
  /** any extra metadata */
  [key: string]: unknown;
}

export type InputTagsProps = {
  /** selected tag IDs */
  value: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
  /** the universe of selectable tags */
  options: TagOption[];
  /** show when nothing matches */
  emptyMessage?: string;
  /** allow user‑created tags */
  allowCustom?: boolean;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

/* ──────────────────────────────────────────
 * component – blueprint: components/ui/autocomplete.tsx
 * ──────────────────────────────────────────*/
export const InputTags = forwardRef<HTMLInputElement, InputTagsProps>(
  (
    {
      value,
      onChange,
      options,
      emptyMessage = "No results",
      allowCustom = true,
      placeholder,
      disabled,
      isLoading = false,
      className,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    /* merge forwarded ref */
    const setRefs = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    const [isOpen, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    /* ───────────────────────── helpers */
    const closeDropdown = () => {
      setOpen(false);
      /* defocus in next tick so cmdk doesn’t reopen */
      setTimeout(() => inputRef.current?.blur(), 0);
    };

    const addId = (id: string) => {
      if (!id || value.includes(id)) return;
      onChange((prev) => [...prev, id]);
    };

    const commitSelection = (opt: TagOption) => {
      addId(opt.id);
      setInputValue("");
      closeDropdown();
    };

    const commitFreeText = (text: string) => {
      const trimmed = text.trim();
      if (trimmed === "") return;
      /* see if text matches an option label first */
      const match = options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase());
      if (match) addId(match.id);
      else if (allowCustom) addId(trimmed);
      setInputValue("");
      closeDropdown();
    };

    /* ───────────────────────── key handling (blueprint) */
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const el = inputRef.current;
      if (!el) return;

      if (!isOpen) setOpen(true);

      if (e.key === "Enter" && el.value.trim() !== "") {
        /* let cmdk handle ENTER when an item is highlighted; if none highlighted → fall back */
        const highlighted = document.querySelector("[cmdk-item][aria-selected='true']") as HTMLElement | null;
        if (!highlighted) {
          e.preventDefault();
          commitFreeText(el.value);
        }
      }
      if (e.key === "Escape") el.blur();
    };

    const handleBlur = () => {
      closeDropdown();
      /* revert half‑typed text */
      setInputValue("");
    };

    /* ───────────────────────── filtered list */
    const filtered = options.filter(
      (o) =>
        o.label.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(o.id),
    );

    const labelFor = (id: string) => options.find((o) => o.id === id)?.label ?? id;

    /* ───────────────────────── render */
    return (
      <div className={cn("space-y-2", className)}>
        <CommandPrimitive onKeyDown={handleKeyDown} className="w-full">
          <CommandInput
            ref={setRefs}
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
                    <div className="p-1 text-sm">Loading…</div>
                  </CommandPrimitive.Loading>
                )}

                {!isLoading && filtered.length > 0 && (
                  <CommandGroup>
                    {filtered.map((opt) => {
                      const isSelected = value.includes(opt.id);
                      return (
                        <CommandItem
                          key={opt.id}
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

                {!isLoading && filtered.length === 0 && (
                  <CommandPrimitive.Empty className="select-none rounded-sm px-2 py-3 text-center text-sm">
                    {emptyMessage}
                  </CommandPrimitive.Empty>
                )}
              </CommandList>
            </div>
          </div>
        </CommandPrimitive>

        {/* selected tags */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 border rounded-md p-2 min-h-[2.5rem]">
            {value.map((id) => (
              <Badge key={id} variant="secondary">
                {labelFor(id)}
                <button
                  type="button"
                  className="ml-2 cursor-pointer"
                  onClick={() => onChange((prev) => prev.filter((i) => i !== id))}
                >
                  <XIcon className="w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  },
);

InputTags.displayName = "InputTags";
