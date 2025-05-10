import { use, useEffect, useRef, useState } from "react";
import CodeEditorComponent from "./components/CodeEditor";
import { Skeleton, Stack, Tabs } from "@mantine/core";
import QuestionInfoComponent from "./components/QuestionInfo";
import ChatBotComponent from "./components/ChatBot";
import CodeOutputComponent from "./components/CodeOutput";
import { IconBrandSpeedtest, IconTerminal } from "@tabler/icons-react";
import { BotMessageSquare } from "lucide-react";
import AttemptCardComponent from "./components/AttemptCard";
import type { Attempts, MessageType } from "../../common/CustomTypes";
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
  httpURL: string;
  nextQuestionHandler: () => void;
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
  let languages = Object.keys(starterCode);
  let languageSnippets = Object.values(starterCode);
  const socketRef = useRef<WebSocket | null>(null);

  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState(languageSnippets[0]);
  const [codeOutput, setCodeOutput] = useState("Output will appear here");
  const [attempts, setAttempts] = useState<Attempts[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMessageSend = () => {
    if (userMessage.trim() === "") return;

    const newMessage: MessageType = {
      sender: "user",
      text: userMessage,
    };
    const newMessages: MessageType[] = [...messages, newMessage];
    setMessages(newMessages);
    const newUserMessage = userMessage;
    setUserMessage("");

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not initialized");
      return;
    }
    const payload = {
      action: "chatbot",
      questionId: questionId,
      prompt: newUserMessage,
    };
    socket.send(JSON.stringify(payload));
    console.log("Chat message sent:", payload);
  };

  const handleSocketChatBot = (response: any) => {
    const newMessage: MessageType = {
      sender: "bot",
      text: response.message,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

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
      } else if (response.action === "chatbot") {
        handleSocketChatBot(response);
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

  const handleNext = async () => {
    setLoading(true);
    await nextQuestionHandler();
    setLoading(false);
  };

  useEffect(() => {
    setCodeOutput("Output will appear here");
    setAttempts([]);
    setMessages([]);
    setUserMessage("");
    let languages = Object.keys(starterCode);
    let languageSnippets = Object.values(starterCode);
    setLanguage(languages[0]);
    setCode(languageSnippets[0]);
  }, [questionId]);

  return (
    <Stack align="stretch" justify="center" gap="md">
      <Skeleton visible={loading}>
        <QuestionInfoComponent
          title={questionTitle}
          description={questionDescription}
          topic={questionTopics}
          difficulty={questionDifficulty}
        />
      </Skeleton>

      <Skeleton visible={loading}>
        <CodeEditorComponent
          languages={languages}
          languageSnippets={languageSnippets}
          getLanguage={setLanguage}
          getCode={setCode}
          handleSubmit={handleSubmit}
          handleNext={handleNext}
        />
      </Skeleton>

      <Skeleton visible={loading}>
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
            {/* <Tabs.Tab
              value="scopes"
              leftSection={<IconBrandSpeedtest size={tabSize} />}
            >
              Scopes
            </Tabs.Tab> */}
          </Tabs.List>

          <Tabs.Panel value="codeOutput" pt="md" h={600}>
            <CodeOutputComponent codeOutput={codeOutput} />
          </Tabs.Panel>
          <Tabs.Panel value="messages" pt="md" h={600}>
            <ChatBotComponent
              messages={messages}
              userMessage={userMessage}
              setUserMessage={setUserMessage}
              handleSend={handleMessageSend}
            />
          </Tabs.Panel>
          <Tabs.Panel value="attempts" pt="md" h={600}>
            <AttemptCardComponent attempts={attempts} />
          </Tabs.Panel>
          {/* <Tabs.Panel value="scopes" pt="md" h={600}>
            <ScopeCardComponent metrics={[]} overallMetrics={[]} />
          </Tabs.Panel> */}
        </Tabs>
      </Skeleton>
    </Stack>
  );
}

export default AssessmentPage;
