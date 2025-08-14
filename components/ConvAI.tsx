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
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

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
  const [currentMessage, setCurrentMessage] = useState("");
  const [uiMode, setUiMode] = useState<"chat" | "projectName">("chat");
  const projectNameResolver = useRef<(name: string) => void | null>(null);
  const [projectNameInitial, setProjectNameInitial] = useState<string | undefined>();

  // conversation hook with controlled micMuted
  const [micMuted, setMicMuted] = useState(false);
  const conversation = useConversation({
    micMuted,
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

  // Called when project name form completes
  const handleProjectNameComplete = (name: string | null) => {
    setUiMode("chat");
    if (projectNameResolver.current) {
      projectNameResolver.current(name ?? "Unnamed project");
      projectNameResolver.current = null;
    }
  };

  async function startConversation() {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert("No permission");
      return;
    }
    const elevenlabsAgentKey = await getElevenlabsAgentKey();
    await conversation.startSession({
      agentId: elevenlabsAgentKey,
      clientTools: {
        logMessage: async ({ message }) => console.log("Test Message:", message),
        getProjectName: async ({ projectName }: { projectName?: string } = {}) => {
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

  const toggleMute = () => {
    setMicMuted(prev => !prev);
  };

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
                      ? micMuted
                      ? "Loco spricht, Mikro stumm"
                      : "Loco spricht"
                      : micMuted
                      ? "Loco hört zu, Mikro stumm"
                      : "Loco hört zu"
                    : "Getrennt"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center h-full min-h-0 w-full">
                <AIVisual
                  isAsleep={false}
                  isListening={!micMuted && conversation.status === "connected" && !conversation.isSpeaking}
                  isThinking={conversation.status === "connected"}
                  isSpeaking={conversation.isSpeaking && conversation.status === "connected"}
                />
              </CardContent>
              <CardFooter>
                <div className="flex flex-row gap-4 w-full">
                  {conversation.status !== "connected" ? (
                    <Button
                      variant="outline"
                      className="rounded-full w-full cursor-pointer"
                      size="lg"
                      onClick={startConversation}
                    >
                      <Phone className="size-4 mr-2" />
                      Anrufen
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="rounded-full w-full cursor-pointer"
                      size="lg"
                      onClick={toggleMute}
                    >
                      {micMuted ? <MicOff className="size-4 mr-2" /> : <Mic className="size-4 mr-2" />}
                      {/* {micMuted ? "Stumgeschaltet" : "Mikrofon Ein"} */}
                    </Button>
                  )}
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
              key={currentMessage + String(micMuted)}
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
