'use client'

import { useRef, useState, useEffect, forwardRef } from 'react'
import { v4 as uuid } from 'uuid'
import { MoveDown } from "lucide-react";

import { streamFlow } from '@genkit-ai/next/client'
import { projectAssistantFlow } from '@/genAi/genkit/projectAssistantFlow'

/* UI primitives from your design-system */
import { ChatForm } from '@/components/ui/chat'
import { MessageInput } from '@/components/ui/message-input'
import { MessageList } from '@/components/ui/message-list'
import { ScrollDiv as ScrollDivBase } from '@/components/ui/scroll-div'

/* ------------------------------------------------------------------ */
/*                     Types (unchanged)                              */
/* ------------------------------------------------------------------ */

type Role = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
  content: string
}

interface AiAssistantProps {
  summary?: Record<string, unknown>
  className?: string
  initialMessages?: ChatMessage[]
}

/* ------------------------------------------------------------------ */
/*         ScrollDiv now forwards its ref to let us observe it        */
/* ------------------------------------------------------------------ */

const ScrollDiv = forwardRef<HTMLDivElement, React.ComponentProps<typeof ScrollDivBase>>(
  function ScrollDivWithRef(props, ref) {
    return <ScrollDivBase ref={ref} {...props} />
  }
)

/* ------------------------------------------------------------------ */
/*                         Main component                             */
/* ------------------------------------------------------------------ */

export default function AiAssistant({
  summary,
  className = '',
  initialMessages = [],
}: AiAssistantProps) {
  /* ----------------------- state & refs --------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [value, setValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  /** Scroll handling */
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true) // we start at bottom
  /** A stable helper so we can call it from many places */
  const scrollToBottom = () =>
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })

  /** ----------------------------------------------------------------
   *  Detect whether the user is near the bottom
   *  --------------------------------------------------------------- */
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    /* How far are we from the bottom? 24-32 px feels right */
    const tolerance = 128
    const shouldStick = scrollHeight - scrollTop - clientHeight < tolerance
    setIsAtBottom(shouldStick)
  }

  /** ----------------------------------------------------------------
   *  Every time messages change, stick to the bottom only if the
   *  user was already at the bottom. This prevents “jumping” while
   *  they read older messages.
   *  --------------------------------------------------------------- */
  useEffect(() => {
    if (isAtBottom) scrollToBottom()
  }, [messages, isAtBottom])

  /** The rest of the code is your original business logic */
  const assistantId = useRef<string | null>(null)

  const updateMsg = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    setMessages(prev => prev.map(m => (m.id === id ? fn(m) : m)))

  async function handleSubmit(
    ev?: { preventDefault?: () => void },
    opts?: { experimental_attachments?: FileList }
  ) {
    ev?.preventDefault?.()

    const question = value.trim()
    if (!question || isGenerating) return

    setValue('')
    setIsGenerating(true)

    /* 1. push user message */
    const userId = uuid()
    setMessages(prev => [...prev, { id: userId, role: 'user', content: question }])

    /* 2. placeholder for assistant */
    assistantId.current = uuid()
    const curAssistantId = assistantId.current
    setMessages(prev => [...prev, { id: curAssistantId, role: 'assistant', content: '' }])

    try {
      /* 3. call your Genkit flow with streaming */
      const result = streamFlow<typeof projectAssistantFlow>({
        url: '/api/projectAssistant',
        input: { question, summary: JSON.stringify(summary ?? {}) },
      })

      for await (const token of result.stream) {
        updateMsg(curAssistantId, m => ({ ...m, content: m.content + token }))
      }

      const final = await result.output
      updateMsg(curAssistantId, m => ({ ...m, content: final.assistantAnwser }))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error(err)
        updateMsg(curAssistantId, m => ({
          ...m,
          content: 'Sorry, something went wrong.',
        }))
      }
    } finally {
      setIsGenerating(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /*                          component UI                              */
  /* ------------------------------------------------------------------ */
  return (
    <main className={`relative flex h-full w-full flex-col overflow-hidden ${className}`}>
      {/* Messages area */}
      <ScrollDiv
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-4"
      >
        <div className="pb-4">
          <MessageList messages={messages} />
        </div>
      </ScrollDiv>

      {/* Floating “scroll to bottom” button */}
      {!isAtBottom && (
        <div className="absolute bottom-28 left-1/2 z-10 flex -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to newest"
            className="rounded-full bg-background p-2 shadow-lg transition hover:bg-accent cursor-pointer"
          >
            <MoveDown className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Input area */}
      <ChatForm
        className="w-full shrink-0 bg-background px-4 pb-4"
        isPending={false}
        handleSubmit={handleSubmit}
      >
        {() => (
          <MessageInput
            value={value}
            onChange={e => setValue(e.target.value)}
            isGenerating={isGenerating}
          />
        )}
      </ChatForm>
    </main>
  )
}
