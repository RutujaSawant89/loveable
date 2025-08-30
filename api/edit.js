import { GoogleGenerativeAI } from "@google/generative-ai";

// Get your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { currentCode, prompt } = req.body;

    if (!currentCode || !prompt) {
      return res.status(400).json({ error: 'Current code and prompt are required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // This prompt is key. It tells the model to ONLY return the full, updated code.
    const systemPrompt = `
      You are an expert web developer. You will be given an existing HTML file and a user request to modify it.
      Your task is to return the **entire, new, and complete** HTML file with the requested change implemented.
      - DO NOT add explanations, apologies, or any text outside of the HTML code.
      - Ensure the Tailwind CDN script remains in the <head>.
      - The output must be only the raw HTML code.
    `;

    const fullPrompt = `${systemPrompt}\n\nHere is the current code:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nNow, apply this change: "${prompt}"`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const newCode = response.text();

    // Clean the response to remove markdown code block fences (e.g., ```html ... ```)
    const cleanedCode = newCode.replace(/^```(?:html\n)?|```$/g, '');

    res.status(200).json({ newCode: cleanedCode });

  } catch (error) {
    console.error("Error editing code:", error);
    res.status(500).json({ error: "Failed to edit code" });
  }
}