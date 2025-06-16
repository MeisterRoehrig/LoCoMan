import { googleAI } from '@genkit-ai/googleai';
import { genkit, z} from 'genkit';
import { getGeminiApiKey } from "@/providers/api-key-provider";


const geminiApiKey = await getGeminiApiKey();
const chunkingConfig = {
  minLength: 1000,
  maxLength: 2000,
  splitter: 'sentence',
  overlap: 100,
  delimiters: '',
} as any;

const ai = genkit({
  plugins: [
    googleAI({ apiKey: geminiApiKey }),
  ],
});


export const projectAssistantFlow = ai.defineFlow(
  {
    name: 'projectAssistantFlow',
    inputSchema: z.object({ question: z.string() }),
    outputSchema: z.object({ assistantAnwser: z.string() }),
    streamSchema: z.string(),
  },
  async ({ question }, { sendChunk }) => {
    if (!question) throw new Error("Must supply context.");
    const { stream, response } = ai.generateStream({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `You are a helpfull assistant trying to solve the following: ${question} Respond using markdown formatting.`,
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    const { text } = await response;
    return { assistantAnwser: text };
  }
);
