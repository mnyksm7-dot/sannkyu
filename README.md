# sannkyu — LINEスタンプ自動生成アプリ

画像を1枚アップロードすると、AI（OpenAI `gpt-image-1`）が表情・ポーズ違いの
LINEスタンプ風画像セットを自動生成する Next.js アプリです。

## 主な機能

- 画像アップロード（PNG / JPEG / WebP）
- スタンプ枚数の選択（8 / 16 / 24 / 32 / 40 枚 — LINE Creators Market の提出枚数に対応）
- 表情・ポーズ違いのプリセット（「ありがとう」「OK!」「ごめんね」など）を元にAIが
  背景透過のスタンプ画像を自動生成
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
# .env.local に OPENAI_API_KEY を設定
npm run dev
```

`http://localhost:3000` にアクセスしてください。

## 必要な環境変数

| 変数名 | 説明 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI の画像生成API（`gpt-image-1`）を利用するためのAPIキー |

## 仕組み

1. ブラウザから画像とオプション（枚数・キャラクターの特徴）を `/api/generate` にPOST
2. サーバー側で表情/ポーズのプリセットごとに OpenAI Images Edit API
   （`gpt-image-1`, `background: transparent`）を呼び出し、元画像をベースに
   スタンプ用イラストを生成
3. `sharp` でLINEの規定サイズに合わせてリサイズ（スタンプ本体・メイン画像・タブ画像）
4. 生成結果をJSONで返却し、フロントエンドでプレビュー表示
5. 「ZIPで一括ダウンロード」ボタンでブラウザ側（`jszip` + `file-saver`）にZIP化して保存

## コスト・時間について

- 1枚のスタンプ生成につき OpenAI の画像生成APIが1回呼び出されます（従量課金）。
- 40枚生成する場合はAPI呼び出しが40回発生し、数分かかることがあります。
- サーバーの同時実行数は3並列に制限しています（`app/api/generate/route.ts` の `CONCURRENCY`）。

## 今後の拡張候補

- 生成プロンプト（表情・セリフ）のカスタム編集UI
- 生成失敗したスタンプだけ個別に再生成
- 他の画像生成API（Google Gemini など）への切り替え対応
