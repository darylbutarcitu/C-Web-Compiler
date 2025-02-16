import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";

function App() {
  const [code, setCode] = useState(`#include <stdio.h>\n\nint main() {\n\n    printf("Hello, World!\\n");\n\n    return 0;\n}`);
  const [terminalLines, setTerminalLines] = useState(["> "]);
  const [currentInput, setCurrentInput] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [buttonText, setButtonText] = useState("Run Code");
  const terminalWidth = 500;
  const terminalHeight = 300;

  useEffect(() => {
    const handleResize = () => {
      const xPos = window.innerWidth / 2 - terminalWidth / 2;
      const yPos = window.innerHeight / 2 - terminalHeight / 2;
      const xClamped = Math.max(0, Math.min(xPos, window.innerWidth - terminalWidth));
      const yClamped = Math.max(0, Math.min(yPos, window.innerHeight - terminalHeight));
      setPosition({ x: xClamped, y: yClamped });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        return;
      }
      if (inputDisabled || document.activeElement !== document.getElementById('editor-container')) return;
      if (e.key === "Enter") {
        e.preventDefault();
        processInput(currentInput);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setCurrentInput((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        e.preventDefault();
        setCurrentInput((prev) => prev + e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputDisabled, currentInput]);

  const compileCode = async () => {
    setShowTerminal(true);
    setTerminalLines(["> Compiling..."]);
    setInputDisabled(true);
    try {
      const { data } = await axios.post(backendURL, { code }, { headers: { "Content-Type": "application/json" } });
      setTerminalLines([data.output, "\nProgram exited with status 0"]);
      setInputDisabled(false);
    } catch (error) {
      setTerminalLines(["Error: " + error.message, "\nProgram exited with status 1"]);
      setInputDisabled(false);
    }
  };

  const handleRunClick = () => {
    if (showTerminal) {
      setButtonText("Close Terminal First");
      setTimeout(() => setButtonText("Running..."), 1000);
    } else {
      setButtonText("Running...");
      compileCode();
    }
  };

  const handleTerminalClose = () => {
    setShowTerminal(false);
    setButtonText("Run Code");
  };

  const handleEditorMount = (editor, monaco) => {
    monaco.editor.setTheme("vs-dark");
    editor.focus();
  };

  const startDrag = (e) => {
    setIsDragging(true);
    setOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const onDrag = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    const clampedX = Math.max(0, Math.min(newX, window.innerWidth - terminalWidth));
    const clampedY = Math.max(0, Math.min(newY, window.innerHeight - terminalHeight));
    setPosition({ x: clampedX, y: clampedY });
  };

  const processInput = async (input) => {
    if (!input.trim()) return;
    setTerminalLines((prev) => [...prev, `> ${input}`]);
    setCurrentInput("");
    try {
      const { data } = await axios.post(backendURL, { code: input }, { headers: { "Content-Type": "application/json" } });
      setTerminalLines((prev) => [...prev, data.output, "\nProgram exited with status 0"]);
      setInputDisabled(false); 
    } catch (error) {
      setTerminalLines((prev) => [...prev, "Error: " + error.message, "\nProgram exited with status 1"]);
      setInputDisabled(false);
    }
  };

  return (
    <div className="app-container" onMouseMove={onDrag} onMouseUp={() => setIsDragging(false)} tabIndex={0}>
      <h1>C - Web Compiler v1.0</h1>
      <Editor
        height="400px"
        language="c"
        value={code}
        onChange={setCode}
        options={{ selectOnLineNumbers: true, fontSize: 14, automaticLayout: true }}
        onMount={handleEditorMount}
      />
      <button
        className="run-button"
        onClick={handleRunClick}
        style={{
          backgroundColor: showTerminal ? (buttonText === "Close Terminal First" ? "red" : "gray") : "",
          cursor: showTerminal ? "not-allowed" : "pointer",
          transition: "color 0.3s ease, background-color 0.3s ease",
        }}
      >
        {buttonText}
      </button>
      <br></br>
      <br></br>
      <span>Note: Display only.<br></br>User input (scanf, fgets, etc) not supported yet huhu eme</span>
      {showTerminal && (
        <div className="terminal-container" style={{ top: position.y, left: position.x }}>
          <div className="terminal-header" onMouseDown={startDrag}>
            <span>🐸 Rylee's Terminal v1.0 🐸</span>
            <button className="terminal-close" onClick={handleTerminalClose}>X</button>
          </div>
          <div className="terminal-output">
            {terminalLines.map((line, index) => (
              <div key={index} className="terminal-line">{line}</div>
            ))}
            {!inputDisabled && (
              <div className="terminal-line">
                {"> "}{currentInput}
                <span className="cursor">█</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
