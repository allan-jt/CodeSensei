import { useState } from "react";
import CodeEditorComponent from "./components/CodeEditor";
import { Stack } from "@mantine/core";
import QuestionInfoComponent from "./components/QuestionInfo";
import ChatBotComponent from "./components/ChatBot";

function AssessmentPage() {
  const languages = ["python", "javascript"];
  const languageSnippets = [
    "def solution(nums, target):\n    # Your code here\n    pass",
    "function solution(nums, target) {\n  // Your code here\n}",
  ];

  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState(languageSnippets[0]);
  const [codeOutput, setCodeOutput] = useState("Output will appear hdere");

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
        codeOutput={codeOutput}
        getLanguage={setLanguage}
        getCode={setCode}
        handleSubmit={handleSubmit}
      />
      <ChatBotComponent />
    </Stack>
  );
}

export default AssessmentPage;
