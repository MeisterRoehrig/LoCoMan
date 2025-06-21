import { Dot } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="justify-left flex space-x-1">
      <div className="rounded-lg bg-muted">
        <div className="flex -space-x-2.5">
          <Dot className="h-5 w-5 animate-typing-dot-bounce nimate-typing-dot-bounce-delay-0" />
          <Dot className="h-5 w-5 animate-typing-dot-bounce animate-typing-dot-bounce-delay-1" />
          <Dot className="h-5 w-5 animate-typing-dot-bounce animate-typing-dot-bounce-delay-2" />
        </div>
      </div>
    </div>
  )
}
