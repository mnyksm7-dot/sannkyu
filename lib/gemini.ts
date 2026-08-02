import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY が設定されていません。.env.local に GEMINI_API_KEY を設定してください。"
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// gemini-2.5-flash-image (通称 Nano Banana)。
// 高品質が必要な場合は環境変数で gemini-3-pro-image 等に差し替え可能。
const DEFAULT_MODEL = "gemini-2.5-flash-image";

export type GenerateStampImageArgs = {
  imageBuffer: Buffer;
  imageMimeType: string;
  prompt: string;
};

/**
 * 元画像 + プロンプトを Gemini の画像生成モデルに渡し、
 * PNG画像（Buffer）を1枚生成する。
 * Gemini の画像モデルは透過PNGを直接出力できないため、
 * プロンプト側でクロマキー背景（単色グリーン）を指示し、
 * 呼び出し側（imageProcessing.ts）で透過処理を行う前提。
 */
export async function generateStampImage({
  imageBuffer,
  imageMimeType,
  prompt,
}: GenerateStampImageArgs): Promise<Buffer> {
  const ai = getGeminiClient();
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: imageBuffer.toString("base64"),
            },
          },
          { text: prompt },
        ],
      },
    ],
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    const textPart = parts.find((part) => part.text)?.text;
    throw new Error(
      textPart
        ? `画像生成APIから画像データを取得できませんでした: ${textPart}`
        : "画像生成APIから画像データを取得できませんでした。"
    );
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}
