import Editor from "@monaco-editor/react";

export default function CodeEditor({ language, code, setCode }) {
  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      theme="vs-dark"
      onChange={(value) => setCode(value)}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
}
