import React, { useState, useEffect, useRef } from "react";
import { Github, Database, FileEdit, MessageSquare, Code, Eye } from "lucide-react";

function Building() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // 'preview' | 'code'
  const [projectName, setProjectName] = useState("Untitled Project");
  const [chatHistory, setChatHistory] = useState([]);
  
  // --- REAL-TIME PREVIEW: Ref to directly manipulate the iframe's DOM ---
  const iframeRef = useRef(null);

  // Effect to update the preview when an edit happens (non-streaming)
  useEffect(() => {
    // FIX: Add a guard to ensure the iframe and its document are ready.
    if (iframeRef.current && iframeRef.current.contentDocument && !isLoading && generatedCode && chatHistory[chatHistory.length-1]?.content.startsWith('Applied edit')) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(generatedCode);
        iframeDoc.close();
      }
    }
  }, [generatedCode, isLoading, chatHistory]);


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
        
        setGeneratedCode(""); 

        // --- SECTION-BY-SECTION ANIMATION LOGIC ---
        
        // FIX: Ensure the iframe is ready before trying to manipulate it.
        const iframe = iframeRef.current;
        const iframeDoc = iframe ? iframe.contentDocument : null;

        if (iframeDoc) {
          // 1. Define Skeleton and Styles
          const skeletonHTML = `
            <html>
              <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @keyframes pulse { 50% { opacity: .5; } }
                  .skeleton { 
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; 
                    background-color: #e5e7eb; /* gray-200 */
                    border-radius: 0.5rem; 
                  }
                  @keyframes fadeIn { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                  }
                  body > * {
                    animation: fadeIn 0.5s ease-out forwards;
                  }
                </style>
              </head>
              <body class="p-4 sm:p-6 lg:p-8 bg-white">
                <div class="skeleton w-full h-16 mb-6"></div>
                <div class="skeleton w-full h-80 mb-6"></div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div class="skeleton h-56"></div>
                  <div class="skeleton h-56"></div>
                  <div class="skeleton h-56"></div>
                </div>
              </body>
            </html>
          `;

          // 2. Setup Iframe with Skeleton
          iframeDoc.open();
          iframeDoc.write(skeletonHTML);
          iframeDoc.close();

          // 3. Create off-screen parser and state
          const parserDiv = document.createElement('div');
          let hasClearedSkeleton = false;
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value, { stream: true });

            setGeneratedCode(prev => prev + chunkValue);
            parserDiv.innerHTML += chunkValue;

            // 4. Move any fully-formed child nodes from parser to the iframe's body
            while (parserDiv.firstElementChild) {
              if (!hasClearedSkeleton) {
                iframeDoc.body.innerHTML = ''; // Clear skeleton
                hasClearedSkeleton = true;
              }
              // Move the parsed element to the iframe, which triggers the CSS animation
              iframeDoc.body.appendChild(parserDiv.firstElementChild);
            }
          }
        } else {
            // Fallback for when iframe is not visible: just stream the code without preview
            console.warn("Preview not visible. Streaming code only.");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                setGeneratedCode((prev) => prev + chunkValue);
            }
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
              <div className="p-2 border-b border-gray-300 text-sm font-semibold text-gray-800 bg-gray-100">Live Preview</div>
              <div className="flex-grow overflow-auto">
                <iframe
                  ref={iframeRef}
                  title="preview"
                  sandbox="allow-scripts"
                  className="w-full h-full border-none"
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

