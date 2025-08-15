import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";

const { GEMINI_API_KEY, PORT, GEMINI_MODEL } = process.env;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const app = express();

const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

app.use(cors());
app.use(express.json());

/**
 * Mengonversi file dari buffer menjadi format yang diterima oleh Gemini API.
 * @param {Buffer} buffer - Buffer file dari upload.
 * @param {string} mimeType - Tipe MIME dari file.
 * @returns {object} Objek part generatif untuk API.
 */
const fileToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
};

/**
 * Mengekstrak teks dari respons Gemini AI dengan aman.
 * Menangani berbagai kemungkinan struktur respons dari SDK.
 * @param {object} response - Objek respons dari Gemini API.
 * @returns {string} Teks yang diekstrak atau string JSON dari respons jika teks tidak ditemukan.
 */
const extractText = (response) => {
  try {
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ?? response?.text();

    if (text) {
      return text;
    }
    return JSON.stringify(response, null, 2);
  } catch (error) {
    console.error("Error extracting text from response:", error);
    return "Failed to parse AI response.";
  }
};

/**
 * Endpoint untuk menghasilkan konten dari prompt teks saja.
 * Method: POST
 * URL: /generate-text
 * Body: { "prompt": "Tulis sebuah puisi tentang hujan." }
 */
app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const generatedText = extractText(aiResponse);

    res.status(200).json({ generatedText });
  } catch (error) {
    console.error("Error in /generate-text:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint untuk menghasilkan konten dari gambar dan prompt (opsional).
 * Method: POST
 * URL: /generate-from-image
 * Body: form-data dengan key 'image' (file) dan 'prompt' (teks, opsional).
 */
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required." });
  }

  try {
    const { prompt } = req.body;
    const imageBuffer = req.file.buffer;
    const imageMimeType = req.file.mimetype;

    const imagePart = fileToGenerativePart(imageBuffer, imageMimeType);

    const contents = [imagePart];
    if (prompt) {
      contents.unshift(prompt);
    }

    const result = await model.generateContent({ contents });
    const aiResponse = await result.response;
    const generatedText = extractText(aiResponse);

    res.status(200).json({ generatedText });
  } catch (error) {
    console.error("Error in /generate-from-image:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint untuk menghasilkan konten dari dokumen dan prompt (opsional).
 * Method: POST
 * URL: /generate-from-document
 * Body: form-data dengan key 'document' (file) dan 'prompt' (teks, opsional).
 */
app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Document file is required." });
    }

    try {
      const { prompt } = req.body;
      const docBuffer = req.file.buffer;
      const docMimeType = req.file.mimetype;

      const docPart = fileToGenerativePart(docBuffer, docMimeType);

      const contents = [docPart];
      if (prompt) {
        contents.unshift(prompt);
      }

      const result = await model.generateContent({ contents });
      const aiResponse = await result.response;
      const generatedText = extractText(aiResponse);

      res.status(200).json({ generatedText });
    } catch (error) {
      console.error("Error in /generate-from-document:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Endpoint untuk menghasilkan konten dari audio dan prompt (opsional).
 * Method: POST
 * URL: /generate-from-audio
 * Body: form-data dengan key 'audio' (file) dan 'prompt' (teks, opsional).
 */
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Audio file is required." });
  }

  try {
    const { prompt } = req.body;
    const audioBuffer = req.file.buffer;
    const audioMimeType = req.file.mimetype;

    const audioPart = fileToGenerativePart(audioBuffer, audioMimeType);

    const contents = [audioPart];
    if (prompt) {
      contents.unshift(prompt);
    }

    const result = await model.generateContent({ contents });
    const aiResponse = await result.response;
    const generatedText = extractText(aiResponse);

    res.status(200).json({ generatedText });
  } catch (error) {
    console.error("Error in /generate-from-audio:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✨ Server is running on http://localhost:${PORT}`);
});
