import { Button, Card, Group, SegmentedControl, Stack } from "@mantine/core";
import Editor from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
  languages: string[];
  languageSnippets: string[];
  getLanguage: (code: any) => void;
  getCode: (language: any) => void;
  handleSubmit: () => void;
}

function CodeEditorComponent({
  languages,
  languageSnippets,
  getLanguage,
  getCode,
  handleSubmit,
}: CodeEditorProps) {
  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState(languageSnippets[0]);

  const handleLanguageChange = (selectedLanguage: string) => {
    const index = languages.indexOf(selectedLanguage);
    const newCode = languageSnippets[index] || "";
    setLanguage(selectedLanguage);
    setCode(newCode);

    getLanguage(selectedLanguage);
    getCode(newCode);
  };

  const handleEditorChange = (newCode: string | undefined) => {
    const updatedCode = newCode || "";
    setCode(updatedCode);
    getLanguage(language);
    getCode(newCode);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" w="100%" mb="md">
          <SegmentedControl
            value={language}
            onChange={handleLanguageChange}
            data={languages}
          />
          <Button onClick={handleSubmit}>Submit</Button>
        </Group>

        <Editor
          height="65vh"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
        />
      </Stack>
    </Card>
  );
}

export default CodeEditorComponent;
