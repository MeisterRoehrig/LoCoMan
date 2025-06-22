import { functions } from "../lib/firebase-config";
import { httpsCallable } from "firebase/functions";

let cachedGeminiApiKey: string | null = null;
let cachedElevenlabsApiKey: string | null = null;
let cachedElevenlabsAgentKey: string | null = null;


export async function getGeminiApiKey(): Promise<string> {
  if (cachedGeminiApiKey) return cachedGeminiApiKey;
  const getGeminiApiKeyFn = httpsCallable(functions, "getGeminiApiKey");
  const result = await getGeminiApiKeyFn();
  cachedGeminiApiKey = result.data as string;
  return cachedGeminiApiKey;
}

export async function getElevenlabsApiKey(): Promise<string> {
  if (cachedElevenlabsApiKey) return cachedElevenlabsApiKey;
  const getElevenlabsApiKeyFn = httpsCallable(functions, "getElevenlabsApiKey");
  const result = await getElevenlabsApiKeyFn();
  cachedElevenlabsApiKey = result.data as string;
  return cachedElevenlabsApiKey;
}

export async function getElevenlabsAgentKey(): Promise<string> {
  if (cachedElevenlabsAgentKey) return cachedElevenlabsAgentKey;
  const getElevenlabsAgentKeyFn = httpsCallable(functions, "getElevenlabsAgentKey");
  const result = await getElevenlabsAgentKeyFn();
  cachedElevenlabsAgentKey = result.data as string;
  return cachedElevenlabsAgentKey;
}