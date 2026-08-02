import sharp, { Sharp } from "sharp";
import { MAIN_IMAGE_SIZE, STAMP_MAX_SIZE, TAB_IMAGE_SIZE } from "./lineStamp";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const MAX_FILE_BYTES = 1_000_000; // LINE Creators Market の目安上限（1ファイル1MB程度）

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
