import React, { useState } from "react";
import { Github, Database, FileEdit, MessageSquare } from "lucide-react";


function Building() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // 'preview' | 'code' | 'split'
  const [projectName, setProjectName] = useState("Untitled Project");
  const [chatHistory, setChatHistory] = useState([]);

  const handleGenerateClick = async () => {
    if (!prompt) return;
    setGeneratedCode("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error(`API failed: ${response.status}`);
      if (!response.body) throw new Error("Empty response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setGeneratedCode((prev) => prev + chunkValue);
      }

      // Save prompt + small summary in chat history
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "ai", content: `Generated code for: ${prompt}` },
      ]);
    } catch (err) {
      console.error("Generation failed", err);
    } finally {
      setIsLoading(false);
      setPrompt("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        {/* Left integrations */}
        <div className="flex space-x-3">
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">
            <Github size={18} />
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">
            <Database size={18} />
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">
            <SiVercel size={18} />
          </button>
        </div>

        {/* Middle project name */}
        <div className="flex items-center space-x-2">
          <FileEdit size={18} className="text-gray-400" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent border-b border-gray-600 text-center text-white text-lg focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Right side placeholder */}
        <div className="flex items-center space-x-2">
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-grow overflow-hidden">
        {/* Chat Section on the Left */}
        <div className="w-80 bg-gray-850 border-r border-gray-700 flex flex-col">
          <div className="flex-grow overflow-auto p-4 space-y-3">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white self-end"
                    : "bg-gray-700 text-gray-200 self-start"
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-gray-700 flex space-x-2">
            <input
              type="text"
              placeholder="Type your request..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateClick()}
              disabled={isLoading}
              className="flex-grow p-2 rounded bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleGenerateClick}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg disabled:bg-gray-600"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>

        {/* Code + Preview Section on the Right - Full Width */}
        <div className="flex-grow p-4 overflow-hidden flex flex-col">
          {(viewMode === "code" || viewMode === "split") && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg flex flex-col overflow-hidden shadow-lg mb-4">
              <div className="flex items-center justify-between p-2 border-b border-gray-700">
                <h2 className="font-semibold text-white">Code</h2>
                <button
                  className="bg-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-600"
                  onClick={() =>
                    setViewMode(viewMode === "code" ? "preview" : "code")
                  }
                >
                  Toggle View
                </button>
              </div>
              <div className="flex-grow overflow-auto">
                <pre className="p-4 text-sm font-mono text-gray-300">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            </div>
          )}

          {(viewMode === "preview" || viewMode === "split") && (
            <div className="flex-grow bg-gray-800 border border-gray-700 rounded-lg flex flex-col overflow-hidden shadow-lg">
              <div className="flex items-center justify-between p-2 border-b border-gray-700">
                <h2 className="font-semibold text-white">Live Preview</h2>
                <button
                  className="bg-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-600"
                  onClick={() =>
                    setViewMode(viewMode === "preview" ? "code" : "preview")
                  }
                >
                  Toggle View
                </button>
              </div>
              <div className="flex-grow overflow-auto p-1">
                <iframe
                  srcDoc={generatedCode}
                  title="preview"
                  sandbox="allow-scripts"
                  className="w-full h-full bg-white rounded-md border-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Building;
