import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ language, code, setCode }) {
  const containerRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState("400px");

  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth <= 768) {
        setEditorHeight("350px");   // Mobile
      } else {
        setEditorHeight("100%");    // Desktop
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div ref={containerRef} style={{ flex: 1 }}>
      <Editor
        height={editorHeight}
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
    </div>
  );
}