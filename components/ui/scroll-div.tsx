"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // Or your own classnames helper

/**
 * ScrollArea
 * ----------
 * A scrollable container that:
 * - Hides the native scrollbar.
 * - Shows a custom thumb overlay while scrolling.
 * - Fades out the custom thumb after being idle for 0.5s.
 * - Accurately spans from top to bottom (no gaps).
 */
export function ScrollDiv({
  className,
  children,
  ...props
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Thumb position + size
  const [thumbHeight, setThumbHeight] = React.useState(0);
  const [thumbOffset, setThumbOffset] = React.useState(0);

  // Toggle to show/hide the scrollbar
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    function updateThumb() {
      // If the element is gone (unmounted), stop
      if (!viewportRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      // The max distance from the very top to the very bottom
      const maxScrollTop = scrollHeight - clientHeight;

      // Ratio of visible area
      const visibleRatio = clientHeight / scrollHeight;
      // No minimum thumb size => the thumb shrinks/grows exactly
      const newThumbHeight = clientHeight * visibleRatio;
      setThumbHeight(newThumbHeight);

      // The offset for the thumb from the top
      // so it goes from top (0) to bottom (clientHeight - thumbHeight)
      const trackSpace = clientHeight - newThumbHeight;
      const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
      setThumbOffset(trackSpace * scrollRatio);
    }

    function handleScroll() {
      updateThumb();

      // Show scrollbar while scrolling
      setIsScrolling(true);

      // Reset any previous fade-out timer
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000); // 1s
    }

    // Compute once on mount
    updateThumb();

    // On scroll, update thumb + reset fade-out
    el.addEventListener("scroll", handleScroll);

    // If container resizes (e.g., window resize), recalc thumb
    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div {...props} className={cn("relative", className)}>
      {/* Scrollable viewport with native scrollbar hidden */}
      <div
        ref={viewportRef}
        className={cn("h-full w-full overflow-auto scrollbar-none")}
      >
        {children}
      </div>

      {/* Our custom overlay scrollbar */}
      <ScrollBar
        isVisible={isScrolling}
        thumbHeight={thumbHeight}
        thumbOffset={thumbOffset}
      />
    </div>
  );
}

/**
 * ScrollBar
 * ---------
 * - Absolutely positioned on the right side
 * - Fades in/out with opacity
 * - Moves from top to bottom based on scroll offset
 */
interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly isVisible: boolean;
  readonly thumbHeight: number;
  readonly thumbOffset: number;
}

export function ScrollBar({
  isVisible,
  thumbHeight,
  thumbOffset,
  className,
  ...props
}: ScrollBarProps) {
  return (
    <div
      {...props}
      className={cn(
        // Track covers the entire vertical area
        "pointer-events-none absolute right-0 top-0 bottom-0 w-1.5",
        className
      )}
    >
      <div className="relative h-full w-full">
        {/* The thumb is clickable */}
        <div
          className={cn(
            "pointer-events-auto absolute left-0 w-full rounded-full",
            // Some Shadcn-like color (bg-border), adjust as needed
            "bg-border",
            // Fade in/out
            "transition-opacity duration-250",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{
            height: thumbHeight,
            top: thumbOffset,
          }}
        />
      </div>
    </div>
  );
}
