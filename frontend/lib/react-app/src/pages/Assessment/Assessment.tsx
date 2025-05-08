import { useEffect, useRef, useState } from "react";
import CodeEditorComponent from "./components/CodeEditor";
import { Stack, Tabs } from "@mantine/core";
import QuestionInfoComponent from "./components/QuestionInfo";
import ChatBotComponent from "./components/ChatBot";
import CodeOutputComponent from "./components/CodeOutput";
import { IconBrandSpeedtest, IconTerminal } from "@tabler/icons-react";
import { BotMessageSquare } from "lucide-react";
import AttemptCardComponent from "./components/AttemptCard";
import type { Attempts, Metric } from "../../common/CustomTypes";
import ScopeCardComponent from "./components/ScopeCard";

interface AssessmentProps {
  userId: string;
  assessmentId: string;
  questionId: string;
  questionTitle: string;
  questionDescription: string;
  questionTopics: string[];
  questionDifficulty: "easy" | "medium" | "hard";
  starterCode: Record<string, string>;

  socketURL: string;
  nextQuestionHandler: (data: any) => void;
}

function AssessmentPage({
  userId,
  assessmentId,
  questionId,
  questionTitle,
  questionDescription,
  questionTopics,
  questionDifficulty,
  starterCode,
  socketURL,
  nextQuestionHandler,
}: AssessmentProps) {
  const tabSize = 24;
  const languages = Object.keys(starterCode);
  const languageSnippets = Object.values(starterCode);
  const socketRef = useRef<WebSocket | null>(null);

  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState(languageSnippets[0]);
  const [codeOutput, setCodeOutput] = useState("Output will appear here");
  const [attempts, setAttempts] = useState<Attempts[]>([]);

  const handleSocketExecuteCode = (response: any) => {
    setCodeOutput(response.codeOutput);

    const newAttempt: Attempts = {
      metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
      current: [
        response.executionTime,
        response.memoryUsage,
        response.testCasesPassed,
      ],
      best: [
        response.bestExecutionTime,
        response.bestMemoryUsage,
        response.bestTestCasesPassed,
      ],
      unit: ["ms", "KB", "%"],
      greaterIsBetter: [false, false, true],
    };
    setAttempts((prevAttempts) => [...prevAttempts, newAttempt]);
  };

  useEffect(() => {
    const socket = new WebSocket(socketURL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.action === "executeCode") {
        handleSocketExecuteCode(response);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleSubmit = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not initialized");
      return;
    }

    const payload = {
      action: "executeCode",
      userID: userId,
      questionID: questionId,
      assessmentID: assessmentId,
      userCode: code,
      userSelectedLanguage: language,
    };
    socket.send(JSON.stringify(payload));
    console.log("Message sent:", payload);
  };

  const handleNext = () => {
    nextQuestionHandler({ userId, assessmentId, code });
  };

  return (
    <Stack align="stretch" justify="center" gap="md">
      <QuestionInfoComponent
        title={questionTitle}
        description={questionDescription}
        topic={questionTopics}
        difficulty={questionDifficulty}
      />

      <CodeEditorComponent
        languages={languages}
        languageSnippets={languageSnippets}
        getLanguage={setLanguage}
        getCode={setCode}
        handleSubmit={handleSubmit}
        handleNext={handleNext}
      />

      <Tabs defaultValue="codeOutput">
        <Tabs.List grow>
          <Tabs.Tab
            value="codeOutput"
            leftSection={<IconTerminal size={tabSize} />}
          >
            Code Output
          </Tabs.Tab>
          <Tabs.Tab
            value="messages"
            leftSection={<BotMessageSquare size={tabSize} />}
          >
            Chat Bot
          </Tabs.Tab>
          <Tabs.Tab
            value="attempts"
            leftSection={<IconBrandSpeedtest size={tabSize} />}
          >
            Attempts
          </Tabs.Tab>
          <Tabs.Tab
            value="scopes"
            leftSection={<IconBrandSpeedtest size={tabSize} />}
          >
            Scopes
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="codeOutput" pt="md" h={600}>
          <CodeOutputComponent codeOutput={codeOutput} />
        </Tabs.Panel>
        <Tabs.Panel value="messages" pt="md" h={600}>
          <ChatBotComponent />
        </Tabs.Panel>
        <Tabs.Panel value="attempts" pt="md" h={600}>
          <AttemptCardComponent attempts={attempts} />
        </Tabs.Panel>
        <Tabs.Panel value="scopes" pt="md" h={600}>
          <ScopeCardComponent metrics={[]} overallMetrics={[]} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default AssessmentPage;
