import { useState } from "react";
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

const sampleAttempts: Attempts[] = [
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

const sampleMetrics: Metric[] = [
  {
    metricName: "execution time",
    scopes: [
      { scopeName: "array#easy", count: 120, value: 45.3, unit: "ms" },
      { scopeName: "dp#medium", count: 85, value: 102.7, unit: "ms" },
      { scopeName: "graph#difficult", count: 60, value: 230.1, unit: "ms" },
    ],
  },
  {
    metricName: "memory usage",
    scopes: [
      { scopeName: "graph#difficult", count: 140, value: 15.2, unit: "MB" },
      { scopeName: "dp#medium", count: 90, value: 28.6, unit: "MB" },
      { scopeName: "array#easy", count: 45, value: 64.9, unit: "MB" },
    ],
  },
  {
    metricName: "time taken",
    scopes: [
      { scopeName: "graph#difficult", count: 78, value: 320.4, unit: "s" },
      { scopeName: "array#easy", count: 52, value: 198.2, unit: "s" },
      { scopeName: "dp#medium", count: 100, value: 88.5, unit: "s" },
    ],
  },
];

const sampleOverallMetrics: Metric[] = [
  {
    metricName: "execution time",
    scopes: [
      { scopeName: "graph#difficult", count: 95, value: 67.2, unit: "ms" },
      { scopeName: "dp#medium", count: 50, value: 210.3, unit: "ms" },
      { scopeName: "array#easy", count: 110, value: 38.9, unit: "ms" },
    ],
  },
  {
    metricName: "memory usage",
    scopes: [
      { scopeName: "array#easy", count: 60, value: 72.1, unit: "MB" },
      { scopeName: "dp#medium", count: 95, value: 30.3, unit: "MB" },
      { scopeName: "graph#difficult", count: 100, value: 18.7, unit: "MB" },
    ],
  },
  {
    metricName: "time taken",
    scopes: [
      { scopeName: "dp#medium", count: 88, value: 92.4, unit: "s" },
      { scopeName: "graph#difficult", count: 70, value: 310.0, unit: "s" },
      { scopeName: "array#easy", count: 55, value: 180.5, unit: "s" },
    ],
  },
];

function AssessmentPage() {
  const tabSize = 24;
  const languages = ["python", "javascript"];
  const languageSnippets = [
    "def solution(nums, target):\n    # Your code here\n    pass",
    "function solution(nums, target) {\n  // Your code here\n}",
  ];

  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState(languageSnippets[0]);
  const [codeOutput, setCodeOutput] = useState("Output will appear hdere");
  // const [attempts, setAttempts] = useState<Attempts[]>(sampleAttempts);
  const attempts = sampleAttempts;

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
          <ScopeCardComponent
            metrics={sampleMetrics}
            overallMetrics={sampleOverallMetrics}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default AssessmentPage;
