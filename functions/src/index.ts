import {onCall} from "firebase-functions/v2/https";

export const getGeminiApiKey = onCall({
  region: "europe-west4",
  secrets: ["GEMINI_API_KEY"],
}, async () => {
  const constGeminiApiKey = process.env.GEMINI_API_KEY;
  return constGeminiApiKey;
});

export const getElevenlabsApiKey = onCall({
  region: "europe-west4",
  secrets: ["ELEVENLABS_API_KEY"],
}, async () => {
  const constElevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  return constElevenlabsApiKey;
});

export const getElevenlabsAgentKey = onCall({
  region: "europe-west4",
  secrets: ["ELEVENLABS_AGENT_KEY"],
}, async () => {
  const constElevenlabsAgentKey = process.env.ELEVENLABS_AGENT_KEY;
  return constElevenlabsAgentKey;
});

