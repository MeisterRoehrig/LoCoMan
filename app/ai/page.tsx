import { AiAssistant } from '@/components/ai-assistant'

export default function SomeScreen() {
  const projectSummary = { /* …whatever you were already assembling… */ }

  return (
    <section className="h-full w-full">
      <AiAssistant summary={projectSummary} />
    </section>
  )
}