'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*                            Public API                              */
/* ------------------------------------------------------------------ */

export interface ScrollDivProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * ScrollDiv
 * ----------
 * • Hides the native scrollbar and draws a custom thumb  
 * • Exposes its scrollable viewport through a forwarded ref  
 * • Passes through normal DOM props such as onScroll
 */
export const ScrollDiv = React.forwardRef<HTMLDivElement, ScrollDivProps>(
  ({ className, children, ...rest }, forwardedRef) => {
    /* -------- internal refs & state ---------- */
    const viewportRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(forwardedRef, () => viewportRef.current as HTMLDivElement)

    const [thumbHeight, setThumbHeight] = React.useState(0)
    const [thumbOffset, setThumbOffset] = React.useState(0)
    const [isScrolling, setIsScrolling] = React.useState(false)
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    /* -------- scroll/resize bookkeeping ------- */
    React.useEffect(() => {
      const el = viewportRef.current
      if (!el) return

      const updateThumb = () => {
        if (!viewportRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current

        const maxScrollTop = scrollHeight - clientHeight
        const visibleRatio = clientHeight / scrollHeight
        const newThumbHeight = clientHeight * visibleRatio
        setThumbHeight(newThumbHeight)

        const trackSpace = clientHeight - newThumbHeight
        const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
        setThumbOffset(trackSpace * scrollRatio)
      }

      const handleScroll = () => {
        updateThumb()
        setIsScrolling(true)
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000)
      }

      updateThumb()
      el.addEventListener('scroll', handleScroll)
      const resizeObserver = new ResizeObserver(updateThumb)
      resizeObserver.observe(el)

      return () => {
        el.removeEventListener('scroll', handleScroll)
        resizeObserver.disconnect()
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      }
    }, [])

    /* ------------------- render ---------------- */
    return (
      <div className={cn('relative', className)}>
        {/* scrollable viewport — gets all DOM props & the forwarded ref */}
        <div
          ref={viewportRef}
          {...rest}
          className={cn('h-full w-full overflow-auto scrollbar-none')}
        >
          {children}
        </div>

        <ScrollBar
          isVisible={isScrolling}
          thumbHeight={thumbHeight}
          thumbOffset={thumbOffset}
        />
      </div>
    )
  }
)
ScrollDiv.displayName = 'ScrollDiv'

/* ------------------------------------------------------------------ */
/*                     Custom scrollbar thumb                         */
/* ------------------------------------------------------------------ */

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly isVisible: boolean
  readonly thumbHeight: number
  readonly thumbOffset: number
}

function ScrollBar({
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
        'pointer-events-none absolute inset-y-0 right-0 w-1.5',
        className
      )}
    >
      <div className="relative h-full w-full">
        <div
          className={cn(
            'pointer-events-auto absolute left-0 w-full rounded-full bg-border transition-opacity duration-250',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
          style={{ height: thumbHeight, top: thumbOffset }}
        />
      </div>
    </div>
  )
}
