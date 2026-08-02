import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

interface Args {
  prompt: string;
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
  const out = get("--out");
  if (!prompt || !out) {
    console.error(
      'Usage: tsx scripts/generate-thumbnail.ts --prompt "<image prompt>" --out <path/to/thumbnail.png> [--width 1280] [--height 670]',
    );
    process.exit(1);
  }

  return {
    prompt,
    out,
    width: Number(get("--width") ?? 1280),
    height: Number(get("--height") ?? 670),
  };
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "GEMINI_API_KEY is not set. Export it before running this script, e.g.\n" +
        "  export GEMINI_API_KEY=your-key-here\n" +
        "(copy .env.example to .env and load it, or set it directly in your shell).",
    );
    process.exit(1);
  }

  const { prompt, out, width, height } = parseArgs(process.argv.slice(2));

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.IMAGEN_MODEL ?? "imagen-4.0-generate-001";

  const response = await ai.models.generateImages({
    model,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "16:9",
    },
  });

  const image = response.generatedImages?.[0]?.image?.imageBytes;
  if (!image) {
    console.error("Gemini returned no image data for this prompt.");
    process.exit(1);
  }

  const raw = Buffer.from(image, "base64");

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
