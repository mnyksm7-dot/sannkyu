import OpenAI, { toFile } from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY が設定されていません。.env.local に OPENAI_API_KEY を設定してください。"
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export type GenerateStampImageArgs = {
  imageBuffer: Buffer;
  imageFileName: string;
  imageMimeType: string;
  prompt: string;
};

/**
 * 元画像 + プロンプトを gpt-image-1 の画像編集APIに渡し、
 * 背景透過PNGのスタンプ画像（Buffer）を1枚生成する。
 */
export async function generateStampImage({
  imageBuffer,
  imageFileName,
  imageMimeType,
  prompt,
}: GenerateStampImageArgs): Promise<Buffer> {
  const openai = getOpenAIClient();

  const file = await toFile(imageBuffer, imageFileName, {
    type: imageMimeType,
  });

  const result = await openai.images.edit({
    model: "gpt-image-1",
    image: file,
    prompt,
    size: "1024x1024",
    background: "transparent",
    quality: "medium",
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("画像生成APIから画像データを取得できませんでした。");
  }
  return Buffer.from(b64, "base64");
}
