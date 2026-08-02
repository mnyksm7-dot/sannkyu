#!/usr/bin/env node
// note推奨サイズ(1280x670px)のサムネイル画像を articles の各記事について生成する。
// Playwright + Chromium (このサンドボックスにプリインストール済み)を使う。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT, "templates", "thumbnail.html");
const OUT_DIR = path.join(ROOT, "thumbnails");
const CHROMIUM_PATH = "/opt/pw-browsers/chromium";

// ローカルの node_modules に playwright があればそれを使い、
// なければこのサンドボックスにグローバルインストール済みの playwright にフォールバックする。
async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    const globalRoot = "/opt/node22/lib/node_modules";
    if (existsSync(path.join(globalRoot, "playwright"))) {
      const require = createRequire(import.meta.url);
      return require(path.join(globalRoot, "playwright")).chromium;
    }
    throw new Error(
      "playwright が見つかりません。`npm install -D playwright` を実行するか、対応環境で実行してください。"
    );
  }
}

const ARTICLES = [
  { file: "01-konkatsu-3nen", tag: "婚活", line1: "婚活3年・47回のお見合い", line2: "「条件」をやめた日に見つけた本当の相手", color1: "#f6a5b0", color2: "#c9436e" },
  { file: "02-matching-app-20nin", tag: "マッチングアプリ", line1: "20人に会い、3人に既読無視", line2: "1人と結婚した私のチェックリスト", color1: "#f7b7c2", color2: "#b8305a" },
  { file: "03-tedori18man-fukugyou", tag: "副業", line1: "手取り18万円から", line2: "副業ゼロで月10万円稼ぐまで", color1: "#a8e6a1", color2: "#2e8b57" },
  { file: "04-mikeiken-engineer-tenshoku", tag: "転職", line1: "32歳・未経験・文系が", line2: "エンジニア転職で年収+280万円", color1: "#8ecae6", color2: "#023e8a" },
  { file: "05-kosodate-zaitaku-work", tag: "子育て×仕事", line1: "子育てと在宅ワークの両立で", line2: "3回泣いた私が見つけた働き方", color1: "#ffd399", color2: "#e85d04" },
  { file: "06-kyouikuhi-3bai", tag: "教育費", line1: "月2万円で足りるはずが", line2: "想定の3倍かかった家計を公開", color1: "#b9e6a8", color2: "#1b6b3a" },
  { file: "07-chatgpt-buki", tag: "AI活用", line1: "ChatGPTに仕事を奪われかけた私が", line2: "逆に月収を1.5倍にした話", color1: "#a0c4f7", color2: "#1d3d8f" },
  { file: "08-toushi-200man-sonshitsu", tag: "投資", line1: "投資で200万円失った29歳が", line2: "学んだお金との向き合い方", color1: "#95d5b2", color2: "#1b4332" },
  { file: "09-sns-hasshin-jigoku", tag: "SNS運用", line1: "フォロワー0から発信で人生激変", line2: "…と思ったら地獄を見た話", color1: "#c9a7eb", color2: "#6a0dad" },
  { file: "10-note-10hon-ureru-bunshou", tag: "note運用", line1: "note有料記事10本で分かった", line2: "「売れるタイトル」と「読まれない本文」", color1: "#d0b3f0", color2: "#4b0082" },
];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const template = readFileSync(TEMPLATE_PATH, "utf-8");
  const chromium = await loadChromium();

  const launchOptions = existsSync(CHROMIUM_PATH) ? { executablePath: CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1280, height: 670 } });

  for (const a of ARTICLES) {
    const html = template
      .replaceAll("__TAG__", a.tag)
      .replaceAll("__LINE1__", a.line1)
      .replaceAll("__LINE2__", a.line2)
      .replaceAll("__COLOR1__", a.color1)
      .replaceAll("__COLOR2__", a.color2);

    await page.setContent(html, { waitUntil: "networkidle" });
    const outPath = path.join(OUT_DIR, `${a.file}.png`);
    await page.screenshot({ path: outPath });
    console.log(`generated: ${outPath}`);
  }

  await browser.close();
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
