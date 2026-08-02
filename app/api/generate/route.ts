import { NextRequest, NextResponse } from "next/server";
import {
  STAMP_COUNT_OPTIONS,
  buildStampPrompt,
  getPresetsForCount,
} from "@/lib/lineStamp";
import { generateStampImage } from "@/lib/gemini";
import {
  bufferToDataUrl,
  chromaKeyToTransparent,
  toMainImage,
  toStampImage,
  toTabImage,
} from "@/lib/imageProcessing";

export const runtime = "nodejs";
export const maxDuration = 300;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const CONCURRENCY = 3;

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  async function next(): Promise<void> {
    const current = cursor++;
    if (current >= items.length) return;
    try {
      const value = await worker(items[current], current);
      results[current] = { status: "fulfilled", value };
    } catch (error) {
      results[current] = { status: "rejected", reason: error };
    }
    await next();
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    next()
  );
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました。" },
      { status: 400 }
    );
  }

  const file = formData.get("image");
  const countRaw = formData.get("count");
  const characterDescription = formData.get("characterDescription");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "画像ファイルが送信されていません。" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "PNG / JPEG / WebP 形式の画像を選択してください。" },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "画像サイズが大きすぎます（上限10MB）。" },
      { status: 400 }
    );
  }

  const count = Number(countRaw);
  if (!STAMP_COUNT_OPTIONS.includes(count as (typeof STAMP_COUNT_OPTIONS)[number])) {
    return NextResponse.json(
      { error: `スタンプ数は ${STAMP_COUNT_OPTIONS.join(" / ")} のいずれかを指定してください。` },
      { status: 400 }
    );
  }

  const description =
    typeof characterDescription === "string" ? characterDescription : "";

  const arrayBuffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);
  const presets = getPresetsForCount(count);

  try {
    // 事前チェック: APIキー未設定なら早期にエラーを返す
    const { getGeminiClient } = await import("@/lib/gemini");
    getGeminiClient();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gemini APIの設定を確認してください。",
      },
      { status: 500 }
    );
  }

  const settled = await runWithConcurrency(presets, CONCURRENCY, async (preset) => {
    const prompt = buildStampPrompt(preset.emotion, preset.caption, description);
    const raw = await generateStampImage({
      imageBuffer,
      imageMimeType: file.type,
      prompt,
    });
    const transparent = await chromaKeyToTransparent(raw);
    const stampBuffer = await toStampImage(transparent);
    return {
      caption: preset.caption,
      emotion: preset.emotion,
      dataUrl: bufferToDataUrl(stampBuffer),
      rawBuffer: transparent,
    };
  });

  const stamps: { caption: string; emotion: string; dataUrl: string }[] = [];
  const errors: string[] = [];
  let firstRaw: Buffer | null = null;

  for (const result of settled) {
    if (result.status === "fulfilled") {
      const { rawBuffer, ...rest } = result.value;
      stamps.push(rest);
      if (!firstRaw) firstRaw = rawBuffer;
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : "画像生成に失敗しました。";
      errors.push(message);
    }
  }

  if (!firstRaw) {
    return NextResponse.json(
      {
        error:
          "スタンプ画像を1枚も生成できませんでした。" +
          (errors[0] ? ` (${errors[0]})` : ""),
      },
      { status: 502 }
    );
  }

  const [mainBuffer, tabBuffer] = await Promise.all([
    toMainImage(firstRaw),
    toTabImage(firstRaw),
  ]);

  return NextResponse.json({
    stamps,
    main: bufferToDataUrl(mainBuffer),
    tab: bufferToDataUrl(tabBuffer),
    requestedCount: count,
    generatedCount: stamps.length,
    errors,
  });
}
