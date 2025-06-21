'use client'

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
} from 'react'
import { v4 as uuid } from 'uuid'
import { MoveDown, Trash2 } from 'lucide-react'

import { streamFlow } from '@genkit-ai/next/client'
import { projectAssistantFlow } from '@/genAi/genkit/projectAssistantFlow'

/* UI primitives from your design system */
import { ChatForm } from '@/components/ui/chat'
import { MessageInput } from '@/components/ui/message-input'
import { MessageList } from '@/components/ui/message-list'
import { ScrollDiv as ScrollDivBase } from '@/components/ui/scroll-div'
import { useParams } from 'next/navigation'
import { useProjects } from '@/providers/projects-provider'
import Loader from '@/components/loader'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Role = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
  content: string
}

/**
 * The canonical props type, kept in sync with page-checker.ts
 */
// export interface PageProps {
//   className?: string
//   summary?: string
//   initialMessages?: ChatMessage[]
// }

/* ------------------------------------------------------------------ */
/* ScrollDiv forwards its ref so we can observe it                    */
/* ------------------------------------------------------------------ */

const ScrollDiv = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ScrollDivBase>
>(function ScrollDivWithRef(props, ref) {
  return <ScrollDivBase ref={ref} {...props} />
})

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AiAssistant({
}) {
  /* ----------------------- state & refs --------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [value, setValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const params = useParams()
  const projectId = String((params as { projectId?: string }).projectId ?? '')
  const { projects, saveChatSession } = useProjects()
  const project = React.useMemo(
    () => projects.find(p => p.id === projectId),
    [projects, projectId],
  )
  const summary = project?.summary;


  /* -------------------- load persisted chat ----------------------- */
  useEffect(() => {
    if (project?.chatSession) {
      try {
        const parsed = JSON.parse(project.chatSession) as ChatMessage[]
        setMessages(parsed)
      } catch {
        /* ignore JSON parse errors */
      }
    }
  }, [project?.chatSession])

  /* -------------------- scrolling helpers ------------------------ */
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollToBottom = () =>
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const tolerance = 128
    const nearBottom = scrollHeight - scrollTop - clientHeight < tolerance
    setIsAtBottom(nearBottom)
  }

  useEffect(() => {
    if (isAtBottom) scrollToBottom()
  }, [messages, isAtBottom])

  /* -------------------- chat logic ------------------------------- */
  const assistantId = useRef<string | null>(null)
  const updateMsg = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    setMessages(prev => prev.map(m => (m.id === id ? fn(m) : m)))

  async function handleSubmit(ev?: { preventDefault?: () => void }) {
    ev?.preventDefault?.()

    const question = value.trim()
    if (!question || isGenerating) return

    setValue('')
    setIsGenerating(true)

    const userId = uuid()
    setMessages(prev => [
      ...prev,
      { id: userId, role: 'user', content: question },
    ])

    assistantId.current = uuid()
    const curAssistantId = assistantId.current
    setMessages(prev => [
      ...prev,
      { id: curAssistantId, role: 'assistant', content: '' },
    ])

    try {
      const lastMessages = [
        ...messages,
        { id: userId, role: 'user', content: question },
      ].slice(-11) // send max ten prior
      const result = streamFlow<typeof projectAssistantFlow>({
        url: '/api/projectAssistant',
        input: {
          question,
          summary: JSON.stringify(summary ?? {}),
          chatSession: JSON.stringify(lastMessages),
        },
      })

      for await (const token of result.stream) {
        updateMsg(curAssistantId, m => ({ ...m, content: m.content + token }))
      }

      const final = await result.output
      updateMsg(curAssistantId, m => ({
        ...m,
        content: final.assistantAnwser,
      }))

      saveChatSession(
        projectId,
        JSON.stringify(
          [
            ...lastMessages,
            { id: curAssistantId, role: 'assistant', content: final.assistantAnwser },
          ].slice(-100),
        ),
      )
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

  const isEmpty = messages.length === 0

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <main
      className={`relative flex h-full w-full flex-col overflow-hidden`}
    >
      {!projectId || !project ? <Loader show /> : null}

      {project && isEmpty ? (
        <div className="flex h-full flex-1 flex-col items-center justify-center gap-4">
          <h1 className="bg-gradient-to-r from-blue-600 via-indigo-300 to-indigo-400 bg-clip-text text-center text-3xl text-transparent">
            Hallo, wie kann ich weiterhelfen?
          </h1>
          <h2 className="max-w-sm text-center text-1xl text-muted-foreground">
            Fragen Sie mich etwas über Ihr Projekt, oder bitten Sie mich um Hilfe bei
            einer bestimmten Aufgabe.
          </h2>
        </div>
      ) : null}

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <ScrollDiv
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4"
          >
            <div className="pb-4">
              <MessageList messages={messages} />
            </div>
          </ScrollDiv>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => {
              saveChatSession(projectId, '')
              window.location.reload()
            }}
            className="cursor-pointer bg-destructive"
          >
            <Trash2 /> Chat löschen
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {!isAtBottom && (
        <div className="absolute bottom-28 left-1/2 z-10 flex -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to newest"
            className="cursor-pointer rounded-full bg-background p-2 shadow-lg transition hover:bg-accent"
          >
            <MoveDown className="h-5 w-5" />
          </button>
        </div>
      )}

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
