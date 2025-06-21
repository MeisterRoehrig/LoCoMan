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


export const projectReportFlow = ai.defineFlow(
  {
    name: 'projectReportFlow',
    inputSchema: z.object({ context: z.string() }),
    outputSchema: z.object({ report: z.string() }),
    streamSchema: z.string(),
  },
  async ({ context }, { sendChunk }) => {
    if (!context) throw new Error("Must supply context.");
    const { stream, response } = ai.generateStream({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Give a short overview of the provided cost data ${JSON.stringify(context)} `,
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    const { text } = await response;
    return { report: text };
  }
);
