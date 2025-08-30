import React, { useState, useEffect } from "react";
import { Github, Database, FileEdit, MessageSquare, Code, Eye } from "lucide-react";

function Building() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // 'preview' | 'code'
  const [projectName, setProjectName] = useState("Untitled Project");
  const [chatHistory, setChatHistory] = useState([]);

  // --- FLICKER FIX: State to hold the final, complete code for the iframe ---
  const [finalCodeForPreview, setFinalCodeForPreview] = useState("");
  
  // --- ANIMATION: Add a key to the iframe to trigger re-mounts for the animation ---
  const [previewKey, setPreviewKey] = useState(0);

  // When the final code is generated, update the preview.
  useEffect(() => {
    if (!isLoading && generatedCode) {
      setFinalCodeForPreview(generatedCode);
      // --- ANIMATION: Increment the key to trigger the fade-in animation on the new iframe ---
      setPreviewKey(prevKey => prevKey + 1);
    }
  }, [isLoading, generatedCode]);


  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;

    const currentChat = { role: "user", content: prompt };
    setChatHistory((prev) => [...prev, currentChat]);
    setIsLoading(true);
    setPrompt("");

    try {
      const isEditing = generatedCode.length > 0;
      const endpoint = "/api/generate";
      const body = isEditing ? { prompt, currentCode: generatedCode } : { prompt };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API failed with status ${response.status}`);
      }

      if (isEditing) {
        const data = await response.json();
        setGeneratedCode(data.newCode); // Update directly
        setChatHistory((prev) => [
          ...prev,
          { role: "ai", content: `Applied edit: ${prompt}` },
        ]);
      } else {
        if (!response.body) throw new Error("Empty response body");
        
        // --- FLICKER FIX: Clear previous code immediately for the code view ---
        setGeneratedCode(""); 
        // --- FLICKER FIX: Clear the iframe to show a loading state ---
        setFinalCodeForPreview("<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#555;'>Loading preview...</body></html>");


        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let fullCode = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value);
          fullCode += chunkValue;
          
          // --- FLICKER FIX: Update the live code view only, not the iframe ---
          setGeneratedCode(fullCode);
        }
        
        setChatHistory((prev) => [
          ...prev,
          { role: "ai", content: `Generated code for: ${prompt}` },
        ]);
      }
    } catch (err) {
      console.error("Request failed", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: `An error occurred: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const ViewToggle = () => (
    <div className="flex items-center bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => setViewMode('preview')}
        title="Preview"
        className={`px-3 py-1 text-sm rounded-md ${viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
      >
        <Eye size={16} />
      </button>
      <button
        onClick={() => setViewMode('code')}
        title="Code"
        className={`px-3 py-1 text-sm rounded-md ${viewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
      >
        <Code size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden">
      <header className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 shadow-md flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors">
            <Github size={18} />
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors">
            <Database size={18} />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <FileEdit size={18} className="text-gray-400" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-center text-white text-lg focus:outline-none w-48"
          />
        </div>
        <div className="flex items-center space-x-3">
          <ViewToggle />
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors">
            <MessageSquare size={18} />
          </button>
        </div>
      </header>

      <main className="flex flex-grow overflow-hidden">
        <aside className="w-80 bg-gray-850 border-r border-gray-700 flex flex-col flex-shrink-0">
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
             {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 mt-8 px-4">
                    <p>Describe the component you want to build.</p>
                </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm max-w-xs break-words ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white self-end ml-auto"
                    : "bg-gray-700 text-gray-200 self-start"
                }`}
              >
                {msg.content}
              </div>
            ))}
             {isLoading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
              <div className="bg-gray-700 p-3 rounded-lg text-sm text-gray-400 self-start animate-pulse">
                Generating...
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-700 flex space-x-2">
            <textarea
              placeholder={generatedCode ? "Describe your changes..." : "Type your request..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              disabled={isLoading}
              rows={1}
              className="flex-grow p-2 rounded bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={handleSendPrompt}
              disabled={isLoading || !prompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </aside>

        <section className="flex-grow p-4 overflow-auto">
          {viewMode === "code" && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg flex flex-col overflow-hidden shadow-lg h-full">
              <div className="p-2 border-b border-gray-700 text-sm font-semibold text-white">Code</div>
              <div className="flex-grow overflow-auto">
                <pre className="p-4 text-xs font-mono text-gray-300 h-full">
                  <code className="whitespace-pre-wrap break-all">{generatedCode || "// Your code will appear here"}</code>
                </pre>
              </div>
            </div>
          )}
          {viewMode === "preview" && (
            <div className="bg-white border border-gray-700 rounded-lg flex flex-col overflow-hidden shadow-lg h-full">
              {/* --- ANIMATION: Add style tag for the fade-in keyframes --- */}
              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                .fade-in-iframe {
                  animation: fadeIn 0.5s ease-in-out;
                }
              `}</style>
              <div className="p-2 border-b border-gray-300 text-sm font-semibold text-gray-800 bg-gray-100">Live Preview</div>
              <div className="flex-grow overflow-auto">
                <iframe
                  // --- ANIMATION: Add key and className to trigger animation ---
                  key={previewKey}
                  className="w-full h-full border-none fade-in-iframe"
                  srcDoc={finalCodeForPreview}
                  title="preview"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Building;


