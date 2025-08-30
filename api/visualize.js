import { GoogleGenerativeAI } from "@google/generative-ai";

// Get your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Vercel automatically parses the body for JSON content types
    const { htmlCode } = req.body;

    if (!htmlCode) {
      return res.status(400).json({ error: 'HTML code is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // A prompt specifically for creating ASCII diagrams from HTML
    const prompt = `
      Based on the following HTML code, generate a simple ASCII art
      diagram representing the layout of the potential backend that will be
      required for this webpage.
      - Use characters like +, -, |, #, and text labels to show sections.
      - Keep it clean, simple, and enclosed in a single code block.
      - Do not add any explanation, just the ASCII diagram inside a code block.

      HTML Code:
      \`\`\`html
      ${htmlCode}
      \`\`\`
    `;

    // Correctly call generateContent with the prompt string
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response to remove markdown code block fences
    const asciiDiagram = text.replace(/^```.*\n|```$/g, '');

    res.status(200).json({ diagram: asciiDiagram });

  } catch (error) {
    console.error("Error generating visualization:", error);
    res.status(500).json({ error: "Failed to generate visualization" });
  }
}