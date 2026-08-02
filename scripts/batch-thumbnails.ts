import { readdir, mkdir, writeFile } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import sharp from "sharp";

interface Args {
  inputDir: string;
  outputRoot: string;
  width: number;
  height: number;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };

  const inputDir = get("--input-dir");
  if (!inputDir) {
    console.error(
      "Usage: tsx scripts/batch-thumbnails.ts --input-dir <dir> [--output-root output] [--width 1280] [--height 670]\n" +
        "Each image in <dir> must be named after its article's slug (e.g. ai-work-hours.png)\n" +
        "matching an output/<date>-<slug>/ folder. Matched images are resized/cropped into\n" +
        "that folder's thumbnail.png.",
    );
    process.exit(1);
  }

  return {
    inputDir,
    outputRoot: get("--output-root") ?? "output",
    width: Number(get("--width") ?? 1280),
    height: Number(get("--height") ?? 670),
  };
}

function slugFromFolder(folderName: string): string {
  return folderName.replace(/^\d{8}-/, "");
}

async function main() {
  const { inputDir, outputRoot, width, height } = parseArgs(process.argv.slice(2));

  const articleFolders = await readdir(outputRoot, { withFileTypes: true });
  const slugToFolder = new Map<string, string>();
  for (const entry of articleFolders) {
    if (entry.isDirectory()) {
      slugToFolder.set(slugFromFolder(entry.name), entry.name);
    }
  }

  const imageFiles = (await readdir(inputDir, { withFileTypes: true })).filter((e) =>
    e.isFile(),
  );

  let matched = 0;
  const unmatched: string[] = [];

  for (const file of imageFiles) {
    const slug = basename(file.name, extname(file.name));
    const folder = slugToFolder.get(slug);
    if (!folder) {
      unmatched.push(file.name);
      continue;
    }

    const out = join(outputRoot, folder, "thumbnail.png");
    const raw = await sharp(join(inputDir, file.name)).toBuffer();
    await mkdir(dirname(out), { recursive: true });
    const resized = await sharp(raw).resize({ width, height, fit: "cover" }).png().toBuffer();
    await writeFile(out, resized);
    console.log(`${file.name} -> ${out}`);
    matched++;
  }

  console.log(`\n${matched} thumbnail(s) written.`);
  if (unmatched.length > 0) {
    console.log(
      `${unmatched.length} file(s) did not match any article slug and were skipped: ${unmatched.join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error("Batch thumbnail generation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
