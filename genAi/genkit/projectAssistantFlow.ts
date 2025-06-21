import { z } from 'genkit';
import { ai } from '@/genAi/genkitConfig';

export const projectAssistantFlow = ai.defineFlow(
  {
    name: 'projectAssistantFlow',
    inputSchema: z.object({ 
      question: z.string(),
      summary: z.string(),
      chatSession: z.string().optional()
    }),
    outputSchema: z.object({ assistantAnwser: z.string() }),
    streamSchema: z.string(),
  },
  async ({ question, summary, chatSession}, { sendChunk }) => {
    if (!question) throw new Error("Must supply context.");
    const { stream, response } = ai.generateStream({
      prompt: `Sie sind ein Chat Assistent, der in eine Kostenanalyseplattform eingebettet ist und versucht, die folgende Aufgabenstellung zu lösen: ${question} \n\nSofern nötig, können Sie die folgende Kostenzusammenfassung für detaillierte Informationen verwenden: ${summary}\n Sofern für das beantworten der Nachricht hilfreich können Sie auch die letzten Nachrichten des Chatverlauf einsehen: ${chatSession}\n WICHTIG: Verwenden Sie immer deutsches Zahlenformat (Punkt als Tausendertrennzeichen, Komma für Dezimalstellen) mit vorangestelltem €‑Symbol, z. B. €12.000,01. \n Versuchen Sie in Antworten anstadt ID's immer für einen Menschen verständliche Namen und Bezeichnung zu verwenden.`,
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    const { text } = await response;
    return { assistantAnwser: text };
  }
);
