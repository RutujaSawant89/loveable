import React, { useState, useRef } from 'react';

function Building() {
  // State for the user's input prompt
  const [prompt, setPrompt] = useState('');
  // State to hold the generated HTML code
  const [generatedCode, setGeneratedCode] = useState('');
  // State for the ASCII backend diagram
  const [asciiDiagram, setAsciiDiagram] = useState('');
  // State to track loading status for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  // Ref to store the complete generated code for visualization
  const finalCodeRef = useRef('');

  // --- API 1: Code Generation (Streaming) ---
  const handleGenerateClick = async () => {
    if (!prompt) {
      alert('Please enter a prompt.');
      return;
    }
    // Reset states for a new generation
    setGeneratedCode('');
    setAsciiDiagram('');
    finalCodeRef.current = '';
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        // Append each new chunk to the state to create the "typing" effect
        setGeneratedCode((prev) => prev + chunkValue);
        finalCodeRef.current += chunkValue;
      }
    } catch (error) {
      console.error("Streaming failed:", error);
      alert("Failed to generate code. Check the console for details.");
    } finally {
      setIsLoading(false);
      // Once generation is complete, generate the visualization
      if (finalCodeRef.current) {
        generateVisualization(finalCodeRef.current);
      }
    }
  };

  // --- API 2: Visualization Generation ---
  const generateVisualization = async (htmlCode) => {
    try {
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlCode }),
      });
      const data = await response.json();
      if (data.diagram) {
        setAsciiDiagram(data.diagram);
      }
    } catch (error) {
      console.error("Error generating visualization:", error);
    }
  };

  // --- API 3: Code Editing ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const editPrompt = e.target.elements.editPrompt.value;
    if (!editPrompt) {
        alert('Please enter an edit instruction.');
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch('/api/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentCode: generatedCode, // Send the current code for context
                prompt: editPrompt,
            }),
        });
        const data = await response.json();
        if (data.newCode) {
            // Replace the old code with the new, edited code
            setGeneratedCode(data.newCode);
        }
    } catch (error) {
        console.error("Failed to edit code:", error);
        alert("Failed to edit code. Check the console for details.");
    } finally {
        setIsLoading(false);
        e.target.elements.editPrompt.value = ''; // Clear the input field after submission
    }
  };

  return (
    <div className="flex h-screen bg-black text-gray-200 font-sans">
      {/* Left Panel: Controls */}
      <div className="w-96 p-6 flex flex-col border-r border-slate-800 space-y-6">
        <h1 className="text-2xl font-bold text-white">
          AI<span className="text-purple-500">WebForge</span>
        </h1>
        
        {/* AI System Logs */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex-shrink-0">
          <h2 className="text-lg font-semibold mb-3 text-white">AI System Logs</h2>
          <pre className="bg-black/50 p-3 rounded-md text-xs whitespace-pre-wrap h-48 overflow-auto text-gray-400 font-mono">
            {asciiDiagram || "Logs will appear here..."}
          </pre>
        </div>
        
        {/* Chat / Edit */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex-grow flex flex-col">
          <h2 className="text-lg font-semibold mb-3 text-white">Chat / Edit</h2>
          <form onSubmit={handleEditSubmit} className="flex-grow flex flex-col">
            <textarea
              name="editPrompt"
              className="w-full flex-grow p-3 bg-slate-900 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Type your edits here. e.g., 'Change the heading to...' and press submit."
              disabled={!generatedCode || isLoading}
            />
            <button
              type="submit"
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
              disabled={!generatedCode || isLoading}
            >
              {isLoading ? 'Processing...' : 'Submit Edit'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: Main Content */}
      <div className="flex-grow p-6 flex flex-col">
        {/* Prompt Bar */}
        <div className="flex mb-4">
          <input
            type="text"
            className="flex-grow p-3 bg-slate-900 rounded-l-lg text-base text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., 'Create a landing page for a coffee shop'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={handleGenerateClick}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-r-lg disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Code and Preview */}
        <div className="flex-grow grid grid-cols-2 gap-6">
          {/* Code Editor */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800">
              <h2 className="font-semibold text-white">Code</h2>
            </div>
            <div className="flex-grow overflow-auto">
              <pre className="p-4 text-sm font-mono">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col">
            <div className="p-3 border-b border-slate-800">
              <h2 className="font-semibold text-white">Live Preview</h2>
            </div>
            <div className="flex-grow p-1">
              <iframe
                srcDoc={generatedCode}
                title="preview"
                sandbox="allow-scripts"
                className="w-full h-full bg-white rounded-md border-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Building;
