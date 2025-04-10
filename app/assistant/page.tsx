"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { model } from "@/lib/firebase-config"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function Page() {
  const [userPrompt, setUserPrompt] = useState("")
  const [assistantResponse, setAssistantResponse] = useState("")
  const [loading, setLoading] = useState(false)

  // Preprompt: guiding the assistant for a logistics-specific use case
  const prePrompt = `
Sie sind ein KI-Assistent, der in eine Logistikmanagement-Anwendung eingebettet ist. Ihre Aufgabe ist es, klare, prägnante und hilfreiche Einblicke in Logistikfragen zu geben. Sie kennen sich mit Transportarten, Lagerhaltung, Kostenoptimierung, Routenplanung, Lieferkettenstrategie und bewährten Verfahren der Branche aus. Bei der Beantwortung Ihrer Fragen sollten Sie professionell und praktisch vorgehen und umsetzbare Erkenntnisse liefern, die zur Verbesserung der betrieblichen Effizienz beitragen.`.trim()

  async function handlePrompt() {
    if (!userPrompt.trim()) return

    setLoading(true)
    setAssistantResponse("")

    try {
      const fullPrompt = `${prePrompt}\n\nUser: ${userPrompt}\n\nAssistant:`

      const result = await model.generateContent(fullPrompt)
      const text =  result.response.text()
      setAssistantResponse(text)
    } catch (error) {
      console.error("Error generating content:", error)
      setAssistantResponse("An error occurred while fetching the response.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="flex-1 flex-col"
    >
      <ResizablePanel>
        <div className="p-4 h-full">
          <Label htmlFor="assistantArea">Assistant</Label>
          <div className="py-4 h-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                Loading...
              </div>
            ) : (
              <Textarea
                id="assistantArea"
                className="w-full h-full"
                placeholder="Response"
                value={assistantResponse}
                readOnly
              />
            )}
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={10}>
        <div className="p-4 h-full flex gap-2">
          <Textarea
            id="userPrompt"
            className="w-full h-full"
            placeholder="Start the Chat..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
          />
          <Button onClick={handlePrompt} disabled={loading}>
            Go
          </Button>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
