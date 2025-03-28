"use client"; // so it works in the browser environment

import { useState, useEffect } from "react";

/**
 * Returns a debounced version of `value` that only updates
 * after `delay` milliseconds have passed without changes.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
