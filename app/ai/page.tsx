'use client'

import { useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { streamFlow } from '@genkit-ai/next/client'
import { projectAssistantFlow } from '@/genAi/genkit/projectAssistantFlow'

/* ――― UI primitives from your new library ――― */
import { ChatForm } from '@/components/ui/chat'
import { MessageInput } from '@/components/ui/message-input'
import { MessageList } from '@/components/ui/message-list'
import { ScrollDiv } from '@/components/ui/scroll-div'

type Role = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: Role
  content: string
}

/* ---------- helper ---------- */

const copyToClipboard = (text: string) =>
  navigator.clipboard.writeText(text).catch(() => { })

/* ---------- page ---------- */

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [value, setValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const assistantId = useRef<string | null>(null)
  const abortController = useRef<AbortController | null>(null)

  const updateMsg = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    setMessages(prev => prev.map(m => (m.id === id ? fn(m) : m)))

  /* ----- submit handler (supports streaming) ----- */
  async function handleSubmit(
    event?: { preventDefault?: (() => void) | undefined } | undefined,
    options?: { experimental_attachments?: FileList | undefined } | undefined
  ) {
    event?.preventDefault?.()

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
      const result = streamFlow<typeof projectAssistantFlow>({
        url: '/api/projectAssistant',
        input: { question },
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

  /* ----- render ----- */
  return (
    <main className="flex flex-col h-screen w-full overflow-hidden">
      {/* messages */}
      {/* <section className=""> */}
      <ScrollDiv className="flex-1 overflow-y-auto px-4 pt-4">
        <div className="pb-4">
          <MessageList messages={messages} />
        </div>
      </ScrollDiv>
      {/* </section> */}

      {/* input */}
      <ChatForm
        className="w-full shrink-0 bg-background px-4 pb-4"  // border for visual separation
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
