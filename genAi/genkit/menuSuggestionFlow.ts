import { googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';
import { getGeminiApiKey } from "@/providers/api-key-provider";

const geminiApiKey = await getGeminiApiKey();

const ai = genkit({
  plugins: [googleAI({ apiKey: geminiApiKey })],

});

export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.object({ theme: z.string() }),
    outputSchema: z.object({ menuItem: z.string() }),
    streamSchema: z.string(),
  },
  async ({ theme }, { sendChunk }) => {
    const { stream, response } = ai.generateStream({
      model: googleAI.model('gemini-2.0-flash'),

      prompt: `Invent a menu item for a ${theme} themed restaurant.`,
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    const { text } = await response;
    return { menuItem: text };
  }
);