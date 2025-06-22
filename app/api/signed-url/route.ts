import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";
import { getElevenlabsAgentKey } from "@/providers/api-key-provider";

export async function GET() {
  const elevenlabsAgentKey = await getElevenlabsAgentKey();
  const agentId = elevenlabsAgentKey;
  console.log("Agent ID:", agentId);
  if (!agentId) {
    throw Error("AGENT_ID is not set");
  }
  try {
    const client = new ElevenLabsClient();
    const response = await client.conversationalAi.getSignedUrl({
      agent_id: agentId,
    });
    return NextResponse.json({ signedUrl: response.signed_url });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to get signed URL", elevenlabsAgentKey},
      { status: 500 }
    );
  }
}
