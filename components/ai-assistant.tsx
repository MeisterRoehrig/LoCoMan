'use client'

import { useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { streamFlow } from '@genkit-ai/next/client'
import { projectAssistantFlow } from '@/genAi/genkit/projectAssistantFlow'

/* UI primitives from your design-system */
import { ChatForm } from '@/components/ui/chat'
import { MessageInput } from '@/components/ui/message-input'
import { MessageList } from '@/components/ui/message-list'
import { ScrollDiv } from '@/components/ui/scroll-div'

/* ------------------------------------------------------------------ */
/*                             Types                                  */
/* ------------------------------------------------------------------ */

type Role = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
  content: string
}



interface AiAssistantProps {
  /** Summary JSON that you were previously passing as a closure variable */
  summary?: Record<string, unknown>
  /** Optional extra classes for the outermost container */
  className?: string
  /** Start the chat with predefined messages, useful for testing or demos */
  initialMessages?: ChatMessage[]
}

/* ------------------------------------------------------------------ */
/*                        Helper utilities                            */
/* ------------------------------------------------------------------ */

const copyToClipboard = (text: string) =>
  navigator.clipboard.writeText(text).catch(() => { })

/* ------------------------------------------------------------------ */
/*                         Main component                             */
/* ------------------------------------------------------------------ */

export function AiAssistant({
  summary,
  className = '',
  initialMessages = [],
}: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [value, setValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const assistantId = useRef<string | null>(null)
  const abortController = useRef<AbortController | null>(null)

  /**   * Replace a single message atomically to keep the typing concise   */
  const updateMsg = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    setMessages(prev => prev.map(m => (m.id === id ? fn(m) : m)))

  /* ----------------------- submit handler -------------------------- */
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

  /* ----------------------- component UI --------------------------- */
  return (
    <main className={`flex flex-col h-full w-full overflow-hidden ${className}`}>
      {/* Messages */}
      <ScrollDiv className="flex-1 overflow-y-auto px-4 pt-4">
        <div className="pb-4">
          <MessageList messages={messages} />
        </div>
      </ScrollDiv>

      {/* Input */}
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
