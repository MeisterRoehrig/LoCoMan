'use server';

import { streamText, UIMessage } from 'ai';
import { createGoogleGenerativeAI  } from '@ai-sdk/google';
import { genApiKey } from '@/lib/firebase-config';

const GEMINI_API_KEY = await genApiKey();
const google = createGoogleGenerativeAI({apiKey: GEMINI_API_KEY})

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-flash'),

    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toDataStreamResponse();
}