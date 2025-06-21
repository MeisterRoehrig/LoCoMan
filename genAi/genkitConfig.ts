import { googleAI } from '@genkit-ai/googleai';
import { genkit} from 'genkit';
import { getGeminiApiKey } from "@/providers/api-key-provider";

const geminiApiKey = await getGeminiApiKey();

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: geminiApiKey }),
  ],
  model: googleAI.model('gemini-2.5-flash'),
});