import Editor from "@monaco-editor/react";

export default function CodeEditor({ language, code, setCode, readOnly = false }) {
  return (
    // flex:1 + height:100% lets the parent (editor-pane) control the height
    // automaticLayout:true re-measures whenever the container resizes (including drag)
    <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={(value) => setCode(value)}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,   // re-measures on container resize
          scrollBeyondLastLine: false,
          readOnly: readOnly,
        }}
      />
    </div>
  );
}