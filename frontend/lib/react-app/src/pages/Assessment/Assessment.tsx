import { useState } from "react";
import CodeEditorComponent from "./components/CodeEditor";
import { Stack, Tabs } from "@mantine/core";
import QuestionInfoComponent from "./components/QuestionInfo";
import ChatBotComponent from "./components/ChatBot";
import CodeOutputComponent from "./components/CodeOutput";
import { IconBrandSpeedtest, IconTerminal } from "@tabler/icons-react";
import { BotMessageSquare } from "lucide-react";
import MetricCardComponent from "./components/MetricCard";

interface AttemptMetric {
  metric: string[];
  current: number[];
  best: number[];
  unit: string[];
  greaterIsBetter: boolean[];
}

const sampleAttempts: AttemptMetric[] = [
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [150, 200, 90],
    best: [120, 180, 95],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [200, 350, 95],
    best: [180, 330, 85],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
];

function AssessmentPage() {
  const languages = ["python", "javascript"];
  const languageSnippets = [
    "def solution(nums, target):\n    # Your code here\n    pass",
    "function solution(nums, target) {\n  // Your code here\n}",
  ];

  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState(languageSnippets[0]);
  const [codeOutput, setCodeOutput] = useState("Output will appear hdere");
  const [attempts, setAttempts] = useState<AttemptMetric[]>(sampleAttempts);

  const handleSubmit = () => {
    console.log(language);
    console.log(code);
    setCodeOutput(`Used ${language}:\n${code}`);
  };

  return (
    <Stack align="stretch" justify="center" gap="md">
      <QuestionInfoComponent
        title="Two Sum"
        description="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
        topic={["Array", "Two Pointers"]}
        difficulty="easy"
      />

      <CodeEditorComponent
        languages={languages}
        languageSnippets={languageSnippets}
        getLanguage={setLanguage}
        getCode={setCode}
        handleSubmit={handleSubmit}
        handleNext={handleSubmit}
      />

      <Tabs defaultValue="codeOutput">
        <Tabs.List grow>
          <Tabs.Tab value="codeOutput" leftSection={<IconTerminal size={12} />}>
            Code Output
          </Tabs.Tab>
          <Tabs.Tab
            value="messages"
            leftSection={<BotMessageSquare size={12} />}
          >
            Chat Bot
          </Tabs.Tab>
          <Tabs.Tab
            value="metrics"
            leftSection={<IconBrandSpeedtest size={12} />}
          >
            Metrics
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="codeOutput" pt="md" h={600}>
          <CodeOutputComponent codeOutput={codeOutput} />
        </Tabs.Panel>
        <Tabs.Panel value="messages" pt="md" h={600}>
          <ChatBotComponent />
        </Tabs.Panel>
        <Tabs.Panel value="metrics" pt="md" h={600}>
          <MetricCardComponent attemptMetrics={attempts} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default AssessmentPage;
