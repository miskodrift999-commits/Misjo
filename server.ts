import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazily initialized Gemini SDK client
let aiInstance: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set your Gemini API key in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limits to support base64 selfie rendering/uploading
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint: Analyze selfie upload
  app.post("/api/analyze-selfie", async (req, res) => {
    try {
      const { image, userNote } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Missing selfie photo code payload" });
      }

      // Extract mimeType & base64 raw string from the data URL
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = image;

      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const client = getAIClient();

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const promptPart = {
        text: `You are an expert style, styling profile analyzer, mood detector, and warm, incredibly encouraging friend.
Analyze this photo of the user (they have uploaded a photo of themselves).
Provide:
1. Current mood/vibe of the photo.
2. Direct style feedback: what stands out about their style, outfit, expression, confidence, lighting, or overall composition?
3. A glowing confidence booster: a warm, personalized, inspiring statement that champions their unique style and boosts their mood!
4. An outfit/aesthetic description detailing what they look like, accessories, or look themes.
5. 3 to 5 dominant color hex codes that match, highlight, or pair beautifully with this photo.
6. A vibes matching rating percentage (a fun rating from 80% to 100%).
7. A set of 3 to 5 descriptive tags of their mood or look.

Respond strictly in the provided JSON schema. Ensure your response is highly supportive, uplifting, and focuses entirely on boosting their confidence! 

${userNote ? `The user also attached this note with the photo: "${userNote}". Incorporate their feelings or details into your analysis feedback gracefully if relevant.` : ""}`,
      };

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [imagePart, promptPart],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mood: {
                type: Type.STRING,
                description: "Primary mood/vibe identifying this selfie (e.g. 'Warm & Radiantly Styled' or 'Chill Weekend Vibes')",
              },
              styleFeedback: {
                type: Type.STRING,
                description: "Compassionate, high-quality style feedback noting outfit coordinates, expressions, accessories, or background synergy",
              },
              confidenceBooster: {
                type: Type.STRING,
                description: "An inspiring, highly encouraging, warm confidence booster statement",
              },
              dominantColors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-5 HEX codes that represent dominant colors in the photo or which complement their vibe perfectly, starting with '#'",
              },
              outfitDescription: {
                type: Type.STRING,
                description: "Detailed summary of the clothing, glasses, expression, accessories, or look shown in the photo",
              },
              vibesRating: {
                type: Type.INTEGER,
                description: "A fun percentage matching score of pure positive vibes (integer from 80 to 100)",
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 descriptive, positive look style/mood hash-tags (e.g., '#UrbanAesthetic', '#SunlitJoy')",
              },
            },
            required: [
              "mood",
              "styleFeedback",
              "confidenceBooster",
              "dominantColors",
              "outfitDescription",
              "vibesRating",
              "tags",
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini analysis engine.");
      }

      // Parse the JSON block and return
      const analysisResult = JSON.parse(responseText.trim());
      return res.json(analysisResult);
    } catch (err: any) {
      console.error("Gemini Selfie analysis error:", err);
      // Give a clean friendly description of the error
      const message = err.message || "An unexpected error occurred during photo analysis.";
      return res.status(500).json({ error: message });
    }
  });

  // API endpoint: AI Edit selfie using gemini-2.5-flash-image or smart style fallback
  app.post("/api/edit-selfie", async (req, res) => {
    try {
      const { image, editPrompt } = req.body;

      if (!image || !editPrompt) {
        return res.status(400).json({ error: "Missing image/prompt parameters" });
      }

      // Extract mimeType & base64 raw string from the data URL
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = image;

      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const client = getAIClient();

      // We call gemini-2.5-flash-image to perform the edit
      // If the user's key does not have paid billing or if it fails, we fall back to a structured server-driven preview
      try {
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: `You are an AI photo editor. Edit this photo based on the user's instructions: "${editPrompt}". 
Return the modified image as an image chunk in your response. Ensure the output is high-fashion and matches the editorial/aesthetic standard.`,
              },
            ],
          },
        });

        // Search the parts for inlineData
        let outBase64: string | null = null;
        let outMime: string = "image/jpeg";

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              outBase64 = part.inlineData.data;
              if (part.inlineData.mimeType) {
                outMime = part.inlineData.mimeType;
              }
              break;
            }
          }
        }

        if (outBase64) {
          return res.json({
            image: `data:${outMime};base64,${outBase64}`,
            method: "gemini-image-edit",
          });
        }
      } catch (innerErr: any) {
        console.warn("Gemini 2.5 flash image failed or billing not enabled. Using high-fidelity server fallback system.", innerErr.message);
      }

      // High-Fidelity Server fallback: we analyze the requested edit prompt, and return a set of filter adjustment guidelines for the canvas to execute
      // This is extremely safe and ensures the UX is flawless even fallback status
      const analysisPrompt = `The user wants to apply this AI Edit style: "${editPrompt}" to their selfie.
Provide a stylized representation. What high-fashion filter/adjustments should we apply to make this look exactly like "${editPrompt}"?
Provide:
1. An evocative style name (e.g. "Nordic Noir" or "Prism Cyberpunk").
2. Core adjustments: brightness (value like 1.0 to 1.5 or 0.5 to 1.0), contrast (values like 1.0 to 2.0), saturation (values like 0.0 for black and white to 2.0), sepia (0.0 to 1.0), and hue-rotate (0 to 360).
3. A special canvas blend style overlay: "grayscale", "sepia", "invert", "vintage", "cool", "warm", "neon", "duotone-warm", "draft-sketch", or "none".
4. A creative caption detailing this dynamic AI artistic adjustment.

Respond strictly in JSON format matching this schema:
{
  "styleName": "name",
  "adjustments": {
    "brightness": 1.0,
    "contrast": 1.0,
    "saturation": 1.0,
    "sepia": 0.0,
    "hueRotate": 0
  },
  "blendStyle": "blend-type",
  "creativeCaption": "description of the filter shift applied"
}`;

      const textResponse = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: analysisPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = textResponse.text;
      if (text) {
        const fallbackConfig = JSON.parse(text.trim());
        return res.json({
          fallbackConfig,
          method: "canvas-adjustment-fallback",
        });
      }

      throw new Error("Could not execute AI photo edit.");
    } catch (err: any) {
      console.error("AI Photo edit endpoint error:", err);
      // Fallback with standard template if failure occurs
      return res.json({
        method: "canvas-adjustment-fallback",
        fallbackConfig: {
          styleName: "Cinematic Drama",
          adjustments: { brightness: 0.9, contrast: 1.3, saturation: 0.8, sepia: 0.1, hueRotate: 0 },
          blendStyle: "vintage",
          creativeCaption: "Applied subtle vignette with high contrast color-grade for an editorial noir look.",
        }
      });
    }
  });

  // Serve static assets or mount Vite dev handler
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
