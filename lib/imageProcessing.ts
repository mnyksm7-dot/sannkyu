import sharp, { Sharp } from "sharp";
import {
  CHROMA_KEY_COLOR,
  MAIN_IMAGE_SIZE,
  STAMP_MAX_SIZE,
  TAB_IMAGE_SIZE,
} from "./lineStamp";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const MAX_FILE_BYTES = 1_000_000; // LINE Creators Market の目安上限（1ファイル1MB程度）

// クロマキー背景色からの距離がこの範囲内なら完全透明、範囲を超えたら不透明。
// 間はグラデーションでアルファ値を補間し、輪郭のギザギザを緩和する。
const CHROMA_INNER_THRESHOLD = 60;
const CHROMA_OUTER_THRESHOLD = 120;

/**
 * Gemini画像モデルは透過PNGを直接出力できないため、
 * 単色クロマキー背景（緑）で生成させた画像から背景を透明化する。
 */
export async function chromaKeyToTransparent(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const { r: kr, g: kg, b: kb } = CHROMA_KEY_COLOR;

  for (let i = 0; i < data.length; i += channels) {
    const dr = data[i] - kr;
    const dg = data[i + 1] - kg;
    const db = data[i + 2] - kb;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance <= CHROMA_INNER_THRESHOLD) {
      data[i + 3] = 0;
    } else if (distance < CHROMA_OUTER_THRESHOLD) {
      const t =
        (distance - CHROMA_INNER_THRESHOLD) /
        (CHROMA_OUTER_THRESHOLD - CHROMA_INNER_THRESHOLD);
      data[i + 3] = Math.round(255 * t);
    }
  }

  return sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function toPngUnderLimit(
  build: (opts: { palette: boolean; compressionLevel: number }) => Sharp
): Promise<Buffer> {
  let buffer = await build({ palette: false, compressionLevel: 9 }).toBuffer();
  if (buffer.length <= MAX_FILE_BYTES) return buffer;

  // パレット化して再圧縮を試みる
  buffer = await build({ palette: true, compressionLevel: 9 }).toBuffer();
  if (buffer.length <= MAX_FILE_BYTES) return buffer;

  return buffer; // それでも超える場合はそのまま返す（呼び出し側で警告表示）
}

/** スタンプ本体: 最大 370x320 に収まるよう縮小（拡大はしない）。背景は透明のまま。 */
export async function toStampImage(input: Buffer): Promise<Buffer> {
  return toPngUnderLimit(({ palette, compressionLevel }) =>
    sharp(input)
      .resize({
        width: STAMP_MAX_SIZE.width,
        height: STAMP_MAX_SIZE.height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel, palette })
  );
}

/** メイン画像: 240x240 固定キャンバスに収まるよう配置。 */
export async function toMainImage(input: Buffer): Promise<Buffer> {
  return toPngUnderLimit(({ palette, compressionLevel }) =>
    sharp(input)
      .resize({
        width: MAIN_IMAGE_SIZE.width,
        height: MAIN_IMAGE_SIZE.height,
        fit: "contain",
        background: TRANSPARENT,
      })
      .png({ compressionLevel, palette })
  );
}

/** タブ画像: 96x74 固定キャンバスに収まるよう配置。 */
export async function toTabImage(input: Buffer): Promise<Buffer> {
  return toPngUnderLimit(({ palette, compressionLevel }) =>
    sharp(input)
      .resize({
        width: TAB_IMAGE_SIZE.width,
        height: TAB_IMAGE_SIZE.height,
        fit: "contain",
        background: TRANSPARENT,
      })
      .png({ compressionLevel, palette })
  );
}

export function bufferToDataUrl(buffer: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
