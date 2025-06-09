'use server';

import { streamText, UIMessage } from 'ai';
import { createGoogleGenerativeAI  } from '@ai-sdk/google';
import { getGeminiApiKey } from "@/providers/api-key-provider";


const geminiApiKey = await getGeminiApiKey();

const google = createGoogleGenerativeAI({apiKey: geminiApiKey})

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-flash'),

    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toDataStreamResponse();
}