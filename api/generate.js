import { GoogleGenerativeAI } from "@google/generative-ai";

// Get your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration for Vercel Edge Functions to allow streaming
export const config = {
  runtime: 'edge',
};

// This is the main, merged function for the /api/generate endpoint
export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse the request body to get the prompt and potentially the current code
    const { prompt, currentCode } = await req.json();

    // A prompt is always required
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ==================================================================
    //  CONDITION: If 'currentCode' exists, we are in EDIT mode.
    // ==================================================================
    if (currentCode) {
      const systemPrompt = `
        You are an expert web developer specializing in Tailwind CSS. You will be given an existing HTML file and a user request to modify it.
        Your task is to return the **entire, new, and complete** HTML file with the requested change implemented.
        - DO NOT add explanations, apologies, or any text outside of the HTML code itself.
        - Ensure the Tailwind CDN script remains in the <head>.
        - The output must be only the raw HTML code, without any markdown formatting like \`\`\`html.
      `;
      const fullPrompt = `${systemPrompt}\n\nHere is the current code:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nNow, apply this change: "${prompt}"`;

      // For editing, we wait for the full response to ensure we get the complete file
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const newCode = response.text();

      // Clean the response to remove markdown code block fences if the model adds them
      const cleanedCode = newCode.replace(/^```(?:html\n)?|```$/g, '').trim();

      // Return the complete, updated code as a JSON object
      return new Response(JSON.stringify({ newCode: cleanedCode }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==================================================================
    //  CONDITION: If 'currentCode' does NOT exist, we are in GENERATE mode.
    // ==================================================================
    else {
      const systemPrompt = `
        You are an expert web developer specializing in Tailwind CSS.
        Your task is to generate a single, complete HTML file based on the user's prompt.
        - The HTML MUST be a single file.
        - Use Tailwind CSS for all styling. Include the CDN script: <script src="https://cdn.tailwindcss.com"></script> in the <head>.
        - Use placeholder images from "https://placehold.co/" for any images needed (e.g., https://placehold.co/600x400).
        - Ensure the code is clean, well-formatted, and directly usable.
        - DO NOT include any explanations, comments, or markdown formatting like \`\`\`html. Only output the raw HTML code.
      `;
      const fullPrompt = `${systemPrompt}\n\nUser Prompt: "${prompt}"`;

      // For generating new code, we stream the response for a better user experience
      const result = await model.generateContentStream(fullPrompt);

      // Create a ReadableStream to pipe the model's output to the client
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        },
      });

      // Return the stream as the response
      return new Response(stream, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

  } catch (error) {
    console.error("Error in /api/generate handler:", error);
    // Return a proper Response object on error
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}