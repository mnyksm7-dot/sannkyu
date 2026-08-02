import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

interface Args {
  prompt?: string;
  input?: string;
  out: string;
  width: number;
  height: number;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };

  const prompt = get("--prompt");
  const input = get("--input");
  const out = get("--out");

  if (!out || (!prompt && !input) || (prompt && input)) {
    console.error(
      "Usage:\n" +
        '  tsx scripts/generate-thumbnail.ts --input <path/to/image> --out <path/to/thumbnail.png> [--width 1280] [--height 670]\n' +
        "    (free path: crop/resize an image you already generated with any free tool)\n" +
        '  tsx scripts/generate-thumbnail.ts --prompt "<image prompt>" --out <path/to/thumbnail.png> [--width 1280] [--height 670]\n' +
        "    (calls Gemini's image generation API — requires a billed GEMINI_API_KEY)",
    );
    process.exit(1);
  }

  return {
    prompt,
    input,
    out,
    width: Number(get("--width") ?? 1280),
    height: Number(get("--height") ?? 670),
  };
}

async function loadFromInput(input: string): Promise<Buffer> {
  return readFile(input);
}

async function loadFromGemini(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "GEMINI_API_KEY is not set. Export it before running this script, e.g.\n" +
        "  export GEMINI_API_KEY=your-key-here\n" +
        "(copy .env.example to .env and load it, or set it directly in your shell).\n" +
        "Note: Gemini's image models require a billed project — there is no free quota.\n" +
        "If you don't have that, use --input with an image from a free tool instead.",
    );
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.IMAGEN_MODEL ?? "gemini-3.1-flash-image";

  const response = await ai.models.generateContent({
    model,
    contents: `${prompt} (16:9 widescreen composition)`,
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  );
  const image = imagePart?.inlineData?.data;
  if (!image) {
    console.error("Gemini returned no image data for this prompt.");
    process.exit(1);
  }

  return Buffer.from(image, "base64");
}

async function main() {
  const { prompt, input, out, width, height } = parseArgs(process.argv.slice(2));

  const raw = input ? await loadFromInput(input) : await loadFromGemini(prompt!);

  await mkdir(dirname(out), { recursive: true });
  const resized = await sharp(raw)
    .resize({ width, height, fit: "cover" })
    .png()
    .toBuffer();
  await writeFile(out, resized);

  console.log(`Thumbnail written to ${out} (${width}x${height})`);
}

main().catch((err) => {
  console.error("Thumbnail generation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
