import {onCall} from "firebase-functions/v2/https";

export const getGeminiApiKey = onCall({
  region: "europe-west4",
  secrets: ["GEMINI_API_KEY"],
}, async () => {
  const constGeminiApiKey = process.env.GEMINI_API_KEY;
  return constGeminiApiKey;
});
