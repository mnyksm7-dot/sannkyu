---
name: note-thumbnail
description: "note.com 記事用のサムネイル(見出し画像)を作成する。ユーザーが無料ツール(Gemini アプリ、Bing Image Creator など)で作った画像を渡してくれたら、scripts/generate-thumbnail.ts (1枚) または scripts/batch-thumbnails.ts (複数枚まとめて) で note.com 推奨サイズ(1280x670)にリサイズ・クロップする。複数記事分のプロンプトをまとめて出したいときは image-prompt.txt をスラッグ名でまとめた一覧ファイルを作る。GEMINI_API_KEY が課金済みであれば、画像生成そのものも自動化できる。「サムネを作って」「サムネ作成自動化」「/note-thumbnail」のように呼ばれたときに使う。note.com への画像アップロード自体は行わない。"
---

# note.com サムネイル作成自動化

note.com の見出し画像(推奨サイズ 1280x670)を作る。`scripts/generate-thumbnail.ts` を呼び出すだけで、note.com への実際のアップロードは行わない(手動でアップロードしてもらう)。

このスクリプトには2つのモードがある。**まず無料モードを案内する。**

## モードA(無料・デフォルト): 既存の画像をリサイズ

1. ユーザーに、Gemini アプリ(gemini.google.com)や Bing Image Creator / Copilot Designer など無料のツールで画像を1枚作ってダウンロードしてもらう。プロンプト案が欲しいと言われたら、記事のタイトル/テーマから英語の画像プロンプトを組み立てて渡す(文字は画像内に入れない構図にする)。
2. できあがった画像ファイルのパスを教えてもらう。
3. 次のコマンドでリサイズ・クロップする:
   ```
   npx tsx scripts/generate-thumbnail.ts --input <ダウンロードした画像のパス> --out output/<slug>/thumbnail.png
   ```
   サイズを変えたい場合のみ `--width` / `--height` を追加する(デフォルト 1280x670)。

### 複数記事分をまとめて処理したいとき

記事が複数あるときは、往復の手間を減らすためにまとめて処理する。

1. 対象記事それぞれの `image-prompt.txt` を1つの一覧ファイル(例: `output/<日付>-thumbnail-prompts.md`)にまとめ、各プロンプトに「ファイル名: `<slug>.png`」の指定を添えて渡す。ユーザーはそれを1つずつ画像生成ツールに貼り付け、指定のファイル名でダウンロードして1つのフォルダにまとめる。
2. 画像フォルダを受け取ったら、次のコマンドで一括処理する:
   ```
   npx tsx scripts/batch-thumbnails.ts --input-dir <画像フォルダ>
   ```
   ファイル名(拡張子抜き)が `output/<日付>-<slug>/` フォルダ名のスラッグ部分と一致するものだけが処理され、それぞれの `thumbnail.png` として保存される。一致しなかったファイルはスキップされ、一覧で報告されるので黙って無視しない。

## モードB(有料・課金済みAPIキーがある場合のみ): Gemini で自動生成

`GEMINI_API_KEY` が**課金済み**のプロジェクトのものであれば、画像生成そのものを自動化できる。無料枠には画像生成モデルのクォータが無い(0)ため、未課金のキーでは `RESOURCE_EXHAUSTED` エラーになる。

1. 記事のタイトル/テーマから英語の画像生成プロンプトを組み立て、`image-prompt.txt` として記事と同じディレクトリに保存する。
2. 次のコマンドを実行する:
   ```
   npx tsx scripts/generate-thumbnail.ts --prompt "<英語プロンプト>" --out output/<slug>/thumbnail.png
   ```
3. `RESOURCE_EXHAUSTED` / `NOT_FOUND` などのエラーが出たら、黙ってリトライせずそのままユーザーに伝え、モードA(無料)に切り替えることを提案する。

## 共通

- 完了したら `thumbnail.png` のパスを伝え、note.com の記事編集画面から見出し画像として手動でアップロードしてもらうよう案内する。
- 依存パッケージは `npm install` 済みであること。未実行なら先に実行する。
