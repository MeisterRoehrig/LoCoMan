"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConversation } from "@elevenlabs/react";
import { ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { RotatingText } from "@/components/animate-ui/text/rotating";
import { ProjectNameForm } from "@/components/forms/project-name-form";
import { FixedCostEmployeeForm } from "@/components/forms/fixedcost-employee-form";
import { FixedCostOverheadForm } from "@/components/forms/fixedcost-overhead-form";
import { AIVisual } from "./ai-visual";
import { getElevenlabsAgentKey } from "@/providers/api-key-provider";
import { useProjects } from "@/providers/projects-provider";
import { useEmployees } from "@/providers/employees-provider";
import { useFixedCostObjects } from "@/providers/fixed-cost-provider";
import { useFixedTree } from "@/providers/fixed-tree-provider";
import { useRouter } from "next/navigation";
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

type Employee = {
  employeeJobtitel: string;
  employeeMonthlySalary: number;
};

type OverheadCost = {
  overheadDescription: string;
  overheadMonthlyCost: number;
};

type ProjectSessionData = {
  name?: string;
  description?: string;
  employees?: Employee[];
  overheadCosts?: OverheadCost[];
};

export function ConvAI() {
  const { addProject } = useProjects();
  const { addEmployee } = useEmployees();
  const { addFixedCostObject } = useFixedCostObjects();
  const { loadFixedTree, bulkSaveFixedCosts } = useFixedTree();
  const router = useRouter();

  const [currentMessage, setCurrentMessage] = useState("");
  const [uiMode, setUiMode] = useState<
    "chat" | "projectName" | "employeeFixedCosts" | "overheadFixedCosts"
  >("chat");

  // Store all project data collected during the session
  const [projectSessionData, setProjectSessionData] =
    useState<ProjectSessionData>({});

  // Create a ref to store the latest session data
  const projectSessionDataRef = useRef<ProjectSessionData>({});

  // Update the ref whenever projectSessionData changes
  React.useEffect(() => {
    projectSessionDataRef.current = projectSessionData;
  }, [projectSessionData]);

  // Save employees to Firestore
  const saveEmployeesToFirestore = async (employees: Employee[]) => {
    const savedEmployeeIds: string[] = [];
    
    for (const employee of employees) {
      try {
        const employeeId = await addEmployee({
          jobtitel: employee.employeeJobtitel,
          monthlySalaryEuro: employee.employeeMonthlySalary,
        });
        
        if (employeeId) {
          savedEmployeeIds.push(employeeId);
        }
      } catch (error) {
        console.error(`Failed to save employee: ${employee.employeeJobtitel}`, error);
      }
    }
    
    return savedEmployeeIds;
  };

  // Save overhead costs to Firestore
  const saveOverheadCostsToFirestore = async (overheadCosts: OverheadCost[]) => {
    const savedCostIds: string[] = [];
    
    for (const cost of overheadCosts) {
      try {
        const costId = await addFixedCostObject({
          costObjectName: cost.overheadDescription,
          costPerMonthEuro: cost.overheadMonthlyCost,
        });
        
        if (costId) {
          savedCostIds.push(costId);
        }
      } catch (error) {
        console.error(`Failed to save overhead cost: ${cost.overheadDescription}`, error);
      }
    }
    
    return savedCostIds;
  };

  // Create project with collected data
  const createProjectFromSessionData = async () => {
    const currentSessionData = projectSessionDataRef.current;

    // Only create project if we have at least a name
    if (!currentSessionData.name || currentSessionData.name.trim() === "") {
      console.log("No project name collected, skipping project creation");
      setProjectSessionData({});
      projectSessionDataRef.current = {};
      return;
    }

    try {
      // 1. Create the project first
      const newProject = await addProject(
        currentSessionData.name,
        currentSessionData.description || "Project created with AI assistant"
      );

      // 2. Load the fixed tree to establish a clean baseline
      await loadFixedTree(newProject.id);

      // 3. Save all employees to Firestore
      let savedEmployeeIds: string[] = [];
      if (currentSessionData.employees && currentSessionData.employees.length > 0) {
        savedEmployeeIds = await saveEmployeesToFirestore(currentSessionData.employees);
      }

      // 4. Save all overhead costs to Firestore
      let savedCostIds: string[] = [];
      if (currentSessionData.overheadCosts && currentSessionData.overheadCosts.length > 0) {
        savedCostIds = await saveOverheadCostsToFirestore(currentSessionData.overheadCosts);
      }

      // 5. Bulk save all IDs to the project in a single operation
      const bulkData: { employees?: string[]; fixedCosts?: string[] } = {};
      if (savedEmployeeIds.length > 0) {
        bulkData.employees = savedEmployeeIds;
      }
      if (savedCostIds.length > 0) {
        bulkData.fixedCosts = savedCostIds;
      }

      if (Object.keys(bulkData).length > 0) {
        await bulkSaveFixedCosts(newProject.id, bulkData);
      }

      // 6. Navigate to the new project
      router.push(`/dashboard/${newProject.id}`);

      // 7. Clear ALL session data after successful project creation
      setProjectSessionData({});
      projectSessionDataRef.current = {};
      setProjectNameInitial(undefined);
      setProjectDescriptionInitial(undefined);
      setEmployeeFixedCostsInitial([]);
      setOverheadFixedCostsInitial([]);
      
    } catch (error) {
      console.error("Failed to create project or save data:", error);
      alert("Failed to create project. Please try again.");
      
      // Even on error, clear the session data to prevent accumulation
      setProjectSessionData({});
      projectSessionDataRef.current = {};
    }
  };

  // Project name resolver
  const projectNameResolver = useRef<
    ((project: { name: string; description?: string }) => void) | null
  >(null);
  const [projectNameInitial, setProjectNameInitial] = useState<
    string | undefined
  >();
  const [projectDescriptionInitial, setProjectDescriptionInitial] = useState<
    string | undefined
  >();

  // Employee fixed costs resolver
  const employeeFixedCostsResolver =
    useRef<(employees: Employee[]) => void | null>(null);
  const [employeeFixedCostsInitial, setEmployeeFixedCostsInitial] = useState<
    Employee[]
  >([]);

  // Overhead fixed costs resolver
  const overheadFixedCostsResolver =
    useRef<(overheadCosts: OverheadCost[]) => void | null>(null);
  const [overheadFixedCostsInitial, setOverheadFixedCostsInitial] = useState<
    OverheadCost[]
  >([]);

  // conversation hook with controlled micMuted
  const [micMuted, setMicMuted] = useState(false);
  const conversation = useConversation({
    micMuted,
    onConnect: async () => {
      // Clear everything on connect to ensure clean slate
      setProjectSessionData({});
      projectSessionDataRef.current = {};
      setProjectNameInitial(undefined);
      setProjectDescriptionInitial(undefined);
      setEmployeeFixedCostsInitial([]);
      setOverheadFixedCostsInitial([]);
      setCurrentMessage("");
    },
    onDisconnect: async () => {
      try {
        await createProjectFromSessionData();
      } finally {
        // Ensure cleanup happens even if project creation fails
        setProjectSessionData({});
        projectSessionDataRef.current = {};
        setProjectNameInitial(undefined);
        setProjectDescriptionInitial(undefined);
        setEmployeeFixedCostsInitial([]);
        setOverheadFixedCostsInitial([]);
        setCurrentMessage("");
      }
    },
    onError: async (err) => {
      console.error("Conversation error:", err);
      alert("An error occurred during the conversation");
      
      // Clear session data on error as well
      setProjectSessionData({});
      projectSessionDataRef.current = {};
      setProjectNameInitial(undefined);
      setProjectDescriptionInitial(undefined);
      setEmployeeFixedCostsInitial([]);
      setOverheadFixedCostsInitial([]);
      setCurrentMessage("");
    },
    onMessage: async (message) => {
      if (message.source === "ai") setCurrentMessage(String(message.message));
    },
  });

  // Called when project name form completes
  const handleProjectNameComplete = (
    project: { name: string; description?: string } | null
  ) => {
    setUiMode("chat");

    if (project) {
      // Store project data in session
      setProjectSessionData((prev) => ({
        ...prev,
        name: project.name,
        description: project.description,
      }));
    }

    if (projectNameResolver.current && project) {
      projectNameResolver.current(project);
      projectNameResolver.current = null;
    }
  };

  // Called when employee fixed costs form completes
  const handleEmployeeFixedCostsComplete = (employees: Employee[] | null) => {
    setUiMode("chat");

    if (employees) {
      // Store employee data in session
      setProjectSessionData((prev) => ({
        ...prev,
        employees: employees,
      }));
    }

    if (employeeFixedCostsResolver.current) {
      employeeFixedCostsResolver.current(employees ?? []);
      employeeFixedCostsResolver.current = null;
    }
  };

  // Called when overhead fixed costs form completes
  const handleOverheadFixedCostsComplete = (
    overheadCosts: OverheadCost[] | null
  ) => {
    setUiMode("chat");

    if (overheadCosts) {
      // Store overhead costs data in session
      setProjectSessionData((prev) => ({
        ...prev,
        overheadCosts: overheadCosts,
      }));
    }

    if (overheadFixedCostsResolver.current) {
      overheadFixedCostsResolver.current(overheadCosts ?? []);
      overheadFixedCostsResolver.current = null;
    }
  };

  async function startConversation() {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert("No permission");
      return;
    }

    // Clear all data before starting new conversation
    setProjectSessionData({});
    projectSessionDataRef.current = {};
    setProjectNameInitial(undefined);
    setProjectDescriptionInitial(undefined);
    setEmployeeFixedCostsInitial([]);
    setOverheadFixedCostsInitial([]);
    setCurrentMessage("");
    setUiMode("chat");

    const elevenlabsAgentKey = await getElevenlabsAgentKey();
    await conversation.startSession({
      agentId: elevenlabsAgentKey,
      clientTools: {
        logMessage: async ({ message }) =>
          console.log("Test Message:", message),
        getProjectName: async ({
          projectName,
          projectDescription,
        }: { projectName?: string; projectDescription?: string } = {}) => {
          return new Promise<string>((resolve, reject) => {
            projectNameResolver.current = (project: {
              name: string;
              description?: string;
            }) => {
              resolve(JSON.stringify(project));
            };
            setProjectNameInitial(projectName);
            setProjectDescriptionInitial(projectDescription);
            setUiMode("projectName");
            setTimeout(() => {
              if (uiMode === "projectName") {
                setUiMode("chat");
                reject(new Error("timeout"));
              }
            }, 120_000);
          });
        },
        openEmployeeFixedCostsForm: async ({
          employees,
        }: {
          employees: Employee[];
        }) => {
          return new Promise<string>((resolve, reject) => {
            employeeFixedCostsResolver.current = (emps: Employee[]) => {
              resolve(JSON.stringify(emps));
            };
            setEmployeeFixedCostsInitial(employees || []);
            setUiMode("employeeFixedCosts");
            setTimeout(() => {
              if (uiMode === "employeeFixedCosts") {
                setUiMode("chat");
                reject(new Error("timeout"));
              }
            }, 120_000);
          });
        },
        openOverheadFixedCostsForm: async ({
          overheadCosts,
        }: {
          overheadCosts: OverheadCost[];
        }) => {
          return new Promise<string>((resolve, reject) => {
            overheadFixedCostsResolver.current = (costs: OverheadCost[]) => {
              resolve(JSON.stringify(costs));
            };
            setOverheadFixedCostsInitial(overheadCosts || []);
            setUiMode("overheadFixedCosts");
            setTimeout(() => {
              if (uiMode === "overheadFixedCosts") {
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
    try {
      await conversation.endSession();
    } finally {
      // Clear all data when manually stopping
      setProjectSessionData({});
      projectSessionDataRef.current = {};
      setProjectNameInitial(undefined);
      setProjectDescriptionInitial(undefined);
      setEmployeeFixedCostsInitial([]);
      setOverheadFixedCostsInitial([]);
      setCurrentMessage("");
      setUiMode("chat");
    }
  }, [conversation]);

  const toggleMute = () => {
    setMicMuted((prev) => !prev);
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
                  isListening={
                    !micMuted &&
                    conversation.status === "connected" &&
                    !conversation.isSpeaking
                  }
                  isThinking={conversation.status === "connected"}
                  isSpeaking={
                    conversation.isSpeaking &&
                    conversation.status === "connected"
                  }
                />
              </CardContent>
              <CardFooter>
                <div className="flex flex-col gap-2 w-full">
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
                        {micMuted ? (
                          <MicOff className="size-4 mr-2" />
                        ) : (
                          <Mic className="size-4 mr-2" />
                        )}
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
                  
                  {/* Fake call button for testing
                  {conversation.status !== "connected" && (
                    <Button
                      variant="secondary"
                      className="rounded-full w-full cursor-pointer"
                      size="sm"
                      onClick={simulateFakeCall}
                    >
                      🎭 Fake Call (Test)
                    </Button>
                  )} */}
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
          ) : uiMode === "projectName" ? (
            <ProjectNameForm
              initialName={projectNameInitial}
              initialDescription={projectDescriptionInitial}
              onComplete={handleProjectNameComplete}
            />
          ) : uiMode === "employeeFixedCosts" ? (
            <FixedCostEmployeeForm
              initialEmployees={employeeFixedCostsInitial}
              onComplete={handleEmployeeFixedCostsComplete}
            />
          ) : uiMode === "overheadFixedCosts" ? (
            <FixedCostOverheadForm
              initialOverheadCosts={overheadFixedCostsInitial}
              onComplete={handleOverheadFixedCostsComplete}
            />
          ) : null}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
