# sannkyu — LINEスタンプ自動生成アプリ

画像を1枚アップロードすると、AI（Google Gemini `gemini-2.5-flash-image` /
通称 Nano Banana）が表情・ポーズ違いのLINEスタンプ風画像セットを自動生成する
Next.js アプリです。

## 主な機能

- 画像アップロード（PNG / JPEG / WebP）
- スタンプ枚数の選択（8 / 16 / 24 / 32 / 40 枚 — LINE Creators Market の提出枚数に対応）
- 表情・ポーズ違いのプリセット（「ありがとう」「OK!」「ごめんね」など）を元にAIが
  スタンプ画像を自動生成
- LINE Creators Market の目安サイズに自動リサイズ
  - スタンプ本体: 最大 370×320px
  - メイン画像: 240×240px
  - タブ画像: 96×74px
- 生成結果をブラウザ上でプレビューし、ZIPで一括ダウンロード

> **注意:** サイズやファイル容量の上限は執筆時点のガイドラインを参考にした目安です。
> LINE Creators Market へ提出する前に、必ず最新の公式ガイドラインを確認してください。

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に GEMINI_API_KEY を設定
npm run dev
```

`http://localhost:3000` にアクセスしてください。

## 必要な環境変数

| 変数名 | 説明 |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini API（[Google AI Studio](https://aistudio.google.com/apikey)で発行）を利用するためのAPIキー |
| `GEMINI_IMAGE_MODEL`（任意） | 使用する画像生成モデル。デフォルトは `gemini-2.5-flash-image`。高品質が必要なら `gemini-3-pro-image` 等に変更可能 |

## 仕組み

1. ブラウザから画像とオプション（枚数・キャラクターの特徴）を `/api/generate` にPOST
2. サーバー側で表情/ポーズのプリセットごとに Gemini の画像生成モデル
   （`gemini-2.5-flash-image`）を呼び出し、元画像をベースにスタンプ用イラストを生成
3. Gemini の画像モデルは透過PNGを直接出力できないため、生成時は単色の
   クロマキーグリーン背景で描かせ、`sharp` でその背景色をアルファ透過に変換
   （`lib/imageProcessing.ts` の `chromaKeyToTransparent`）
4. `sharp` でLINEの規定サイズに合わせてリサイズ（スタンプ本体・メイン画像・タブ画像）
5. 生成結果をJSONで返却し、フロントエンドでプレビュー表示
6. 「ZIPで一括ダウンロード」ボタンでブラウザ側（`jszip` + `file-saver`）にZIP化して保存

### クロマキー処理について

キャラクターの色や輪郭線に緑を使わないようプロンプトで指示していますが、
被写体に緑色が含まれる場合は背景と誤認識され、部分的に透明になることがあります。
その場合はプロンプト（`lib/lineStamp.ts` の `buildStampPrompt`）のキー色や
`chromaKeyToTransparent` のしきい値を調整してください。

## コスト・時間について

- 1枚のスタンプ生成につき Gemini の画像生成APIが1回呼び出されます（従量課金）。
- 40枚生成する場合はAPI呼び出しが40回発生し、数分かかることがあります。
- サーバーの同時実行数は3並列に制限しています（`app/api/generate/route.ts` の `CONCURRENCY`）。

## 今後の拡張候補

- 生成プロンプト（表情・セリフ）のカスタム編集UI
- 生成失敗したスタンプだけ個別に再生成
- クロマキー処理の精度向上（エッジのフリンジ除去など）
