import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEuro(amount: number): string {
  return '€' + amount
    .toFixed(2)                          // Ensure two decimal places: "13206.67"
    .replace('.', ',')                  // Convert decimal point to comma: "13206,67"
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Add dots as thousand separators: "13.206,67"
}

// array.ts
/** Shallow compare two string-ID arrays, ignoring order */
export function equalIds(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

