import { GoogleGenerativeAI } from "@google/generative-ai";

// Get your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration for Vercel to allow streaming
export const config = {
  runtime: 'edge',
};

// This is the main function for the serverless endpoint
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `
      You are an expert web developer specializing in Tailwind CSS.
      Your task is to generate a single, complete HTML file based on the user's prompt.
      - The HTML MUST be a single file.
      - Use Tailwind CSS for all styling. Use the CDN script: <script src="https://cdn.tailwindcss.com"></script>.
      - Use placeholder images from "https://placehold.co/" for any images needed (e.g., https://placehold.co/600x400).
      - Ensure the code is clean, well-formatted, and directly usable.
      - DO NOT include any explanations, comments, or markdown formatting like \`\`\`html. Only output the raw HTML code.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${systemPrompt}\n\nUser Prompt: "${prompt}"`;

    const result = await model.generateContentStream(fullPrompt);

    // Create a ReadableStream to stream the response
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
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error("Error generating content:", error);
    // Return a proper Response object on error
    return new Response(JSON.stringify({ error: "Failed to generate content" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}