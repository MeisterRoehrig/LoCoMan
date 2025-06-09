import { functions } from "../lib/firebase-config";
import { httpsCallable } from "firebase/functions";

let cachedGeminiApiKey: string | null = null;

export async function getGeminiApiKey(): Promise<string> {
  if (cachedGeminiApiKey) return cachedGeminiApiKey;
  const getGeminiApiKeyFn = httpsCallable(functions, "getGeminiApiKey");
  const result = await getGeminiApiKeyFn();
  cachedGeminiApiKey = result.data as string;
  return cachedGeminiApiKey;
}