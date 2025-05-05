import { useState } from "react";
import CodeEditorComponent from "./components/CodeEditor";

function AssessmentPage() {
    const languages = ["python", "javascript"]
    const languageSnippets = [
        "def solution(nums, target):\n    # Your code here\n    pass",
        "function solution(nums, target) {\n  // Your code here\n}",
    ]

    const [language, setLanguage] = useState(languages[0]);
    const [code, setCode] = useState(languageSnippets[0]);
    const [codeOutput, setCodeOutput] = useState("Output will appear hdere")

    const handleSubmit = () => {
        console.log(language);
        console.log(code);
        setCodeOutput(`Used ${language}:\n${code}`)
    }

    return (
        <CodeEditorComponent
            languages={languages}
            languageSnippets={languageSnippets}
            codeOutput={codeOutput}
            getLanguage={setLanguage}
            getCode={setCode}
            handleSubmit={handleSubmit}
        />
    );
}

export default AssessmentPage;
