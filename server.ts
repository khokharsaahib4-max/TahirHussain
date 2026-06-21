import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint: Generate proposed blog outline (JSON format)
app.post("/api/blog/outline", async (req, res) => {
  try {
    const { topic, tone, keywords, length } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const systemPrompt = `You are a world-class SEO content strategist and blog generator.
Your goal is to outline a comprehensive, engaging, and high-impact blog outline based on the user's prompt.
You must return only JSON matching the schema provided. No conversational preamble.`;

    const userPrompt = `Create a structured blog outline for:
Topic: "${topic}"
Tone: "${tone}"
Target Length: "${length || "medium"}"
Optional Keywords: "${keywords || "None"}"

Suggest a catchy, optimized main title and a list of proposed sections as a JSON array. Each section should have 'heading' (the title of the section, e.g., "Introduction", or custom headings that fit the theme), 'level' (2 for H2, 3 for H3), and 'instructions' (bullet points on what to write in this section).
Ensure the sections are sequential, logical, and cover all aspects thoroughly. Keep a Kingly, bold attitude in instructions for sections.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A catchy, SEO-optimized main title for the blog post.",
            },
            outline: {
              type: Type.ARRAY,
              description: "The list of sequential sections making up the outline.",
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING, description: "The section heading." },
                  level: { type: Type.INTEGER, description: "The heading level: 2 for H2 outline, 3 for H3 subheader." },
                  instructions: { type: Type.STRING, description: "Specific instructions / talking points to cover in this section." },
                },
                required: ["heading", "level", "instructions"],
              },
            },
          },
          required: ["title", "outline"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model");
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Outline generation error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate blog outline." });
  }
});

// Endpoint: Generate full blog content from customized outline
app.post("/api/blog/generate", async (req, res) => {
  try {
    const { topic, tone, keywords, title, outline } = req.body;
    if (!topic || !outline || !Array.isArray(outline)) {
      return res.status(400).json({ error: "Topic and outline array are required." });
    }

    const systemPrompt = `You are an acclaimed, professional blogger and storytelling master.
You write incredibly engaging, high-retention, and comprehensive articles that keep readers hooked till the last word.
Tones description:
- "professional": Authoritative, backed by insights, formal yet engaging, precise language, and business-focused.
- "casual": Conversational, friendly, uses lighthearted analogies, speaks directly to the reader (you/your), and very warm.
- "funny": Clever humor, playful sarcasm, witty metaphors, incredibly engaging and entertaining.
- "seo": Fully optimized with naturally integrated keywords, highly scannable, rich explanations, bullet points, and actionable takeouts.
- "king_style": Legendary Hinglish Style ('Topic dalo, Blog nikalo! 👑'). Speaks with massive charisma and authority, call the reader "King" or "Boss", uses phrases like "Suno Bhaiyon!", "Yeh dhyan se samajhna, King!", "Zabardast tips!", combines English and Hindi phrases beautifully, and drafts a super energetic, motivational, and prideful guide that makes the reader feel unbeatable.

You write only standard, clean GitHub Flavored Markdown:
- Do NOT repeat the main title at the top, since the client renders it separately. Just start writing the content.
- Use '##' for H2 headings
- Use '###' for H3 headings
- Bold '**important points**' to make scanning delightful
- Use bullet points '-' or checklists
- Include callouts using blockquotes '>' for key takeaways and "Pro Tips"
Ensure the article is detailed, expansive, and has rich context. Write 800 - 1500 words depending on outline size. Avoid rushing; write satisfying paragraphs with concrete examples.`;

    const userPrompt = `Write the complete, detailed blog post.
Main Title of Article: "${title || topic}"
Topic requested: "${topic}"
Tone: "${tone}"
Optional Keywords to naturally weave in: "${keywords || "None"}"

The structure of the blog post is specified by this outline:
${JSON.stringify(outline, null, 2)}

Please write the full blog text following this outline exactly. Connect sections smoothly. Do not write system markers or meta-comments. Return ONLY the final beautifully-styled Markdown content.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.9,
      },
    });

    const blogContent = response.text;
    res.json({ content: blogContent });
  } catch (error: any) {
    console.error("Blog generation error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate blog content." });
  }
});

// Start server with Vite middleware integration for dev, or static asset delivery for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
