"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useConversation } from "@elevenlabs/react";
import { ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { RotatingText } from "@/components/animate-ui/text/rotating";
import { ProjectNameForm } from "@/components/forms/project-name-form";
import { AIVisual } from "./ai-visual";

import { getElevenlabsAgentKey } from "@/providers/api-key-provider";
import { Phone, PhoneOff } from "lucide-react";

//  Ich freue mich auf unseren Austausch. Sind Sie bereit, einen Blick auf Ihre Kostenstruktur zu werfen?

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    console.error("Microphone permission denied");
    return false;
  }
}

export function ConvAI() {
  const [currentMessage, setCurrentMessage] = useState<string>("");

  /* Main ElevenLabs hook */
  const conversation = useConversation({
    onConnect: () => console.log("connected"),
    onDisconnect: () => console.log("disconnected"),
    onError: err => {
      console.error(err);
      alert("An error occurred during the conversation");
    },
    onMessage: message => {
      if (message.source === "ai") setCurrentMessage(String(message.message));
      console.log(message);
    },
  });

  // state
  const [uiMode, setUiMode] = useState<"chat" | "projectName">("chat");
  const projectNameResolver = useRef<(name: string) => void | null>(null);
  const [projectNameInitial, setProjectNameInitial] = useState<string | undefined>();

  // called when the form fires onComplete
  const handleProjectNameComplete = (name: string | null) => {
    setUiMode("chat");
    if (projectNameResolver.current) {
      projectNameResolver.current(name ?? "Unnamed project");
      projectNameResolver.current = null;
    }
  };

  /* Start session */
  async function startConversation() {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert("No permission");
      return;
    }
    // const signedUrl = await getSignedUrl();
    const elevenlabsAgentKey = await getElevenlabsAgentKey();

    await conversation.startSession({
      agentId: elevenlabsAgentKey, // Replace with your agent ID
      clientTools: {
        logMessage: async ({ message }) => {
          console.log("Test Message:", message);
        },
        getProjectName: async ({ projectName }: { projectName?: string } = {}) => {
          console.log("getProjectName called");
          return new Promise<string>((resolve, reject) => {
            projectNameResolver.current = resolve;
            setProjectNameInitial(projectName);
            setUiMode("projectName");
            setTimeout(() => {
              if (uiMode === "projectName") {
                setUiMode("chat");
                reject(new Error("timeout"));
              }
            }, 120_000);
          });
        },
      },
    });
  }

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full pb-4">
      <ResizablePanel className="border-r-1" defaultSize={50}>
        <div className="flex flex-col h-full min-h-0 justify-center">
          <div className="flex justify-center items-center gap-x-4 h-full min-h-0 w-full p-16 max-h-5/6">
            <Card className="lg:col-span-2 h-full min-h-0 w-full flex flex-col">
              <CardHeader>
                <CardTitle>
                  {conversation.status === "connected"
                    ? conversation.isSpeaking
                      ? "Loco spricht"
                      : "Loco hört zu"
                    : "Getrennt"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center h-full min-h-0 w-full">
                <AIVisual
                  isAsleep={false}
                  isListening={false}
                  isThinking={conversation.status === "connected"}
                  isSpeaking={conversation.isSpeaking && conversation.status === "connected"}
                />
              </CardContent>
              <CardFooter>
                <div className="flex flex-row gap-4 w-full">
                  <Button
                    variant="outline"
                    className="rounded-full w-full cursor-pointer bg-"
                    size="lg"
                    disabled={conversation.status === "connected"}
                    onClick={startConversation}
                  >
                    <Phone className="size-4 mr-2" />
                    Anrufen
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full w-full cursor-pointer bg-destructive"
                    size="lg"
                    disabled={conversation.status !== "connected"}
                    onClick={stopConversation}
                  >
                    <PhoneOff className="size-4 mr-2" />
                    Auflegen
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </ResizablePanel>

      <ResizablePanel defaultSize={50}>
        <div className="flex h-full w-full items-center justify-center pb-14 px-12">
          {uiMode === "chat" ? (
            <RotatingText
              key={currentMessage}
              text={currentMessage ? [currentMessage] : [""]}
              duration={1000}
              y={-40}
              className="text-2xl text-center"
              containerClassName="inline-block"
            />
          ) : (
            <ProjectNameForm
              initialName={projectNameInitial}
              onComplete={handleProjectNameComplete}
            />
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
