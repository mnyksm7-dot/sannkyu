---
name: note-thumbnail
description: "note.com 記事用のサムネイル(見出し画像)を Google Gemini の画像生成API(Imagen)で自動生成する。記事のタイトルやテーマから画像生成プロンプトを組み立て、scripts/generate-thumbnail.ts を実行して 1280x670 の PNG を出力する。「サムネを作って」「サムネ作成自動化」「/note-thumbnail」のように呼ばれたときに使う。GEMINI_API_KEY 環境変数が必要。note.com への画像アップロード自体は行わない。"
---

# note.com サムネイル作成自動化

note.com の見出し画像(推奨サイズ 1280x670)を Gemini の画像生成モデル(Imagen)で作る。`scripts/generate-thumbnail.ts` を呼び出すだけで、note.com への実際のアップロードは行わない(手動でアップロードしてもらう)。

## 前提

- `GEMINI_API_KEY` が環境変数として設定されている必要がある。未設定なら、ユーザーに `.env.example` を参考に設定してもらうよう伝えて中断する(黙って諦めたり別のもので代替したりしない)。
- 依存パッケージは `npm install` 済みであること。未実行なら先に実行する。

## 手順

1. **画像プロンプトを組み立てる。** 対象記事のタイトル/テーマから、Imagen 向けの**英語**プロンプトを1〜3文で作る(構図・雰囲気・色味・スタイルを具体的に。文字は画像内に入れない — Imagen は文字描画が不得意なため)。
2. **プロンプトを保存する。** 記事と同じディレクトリに `image-prompt.txt` として保存する(再生成時の参考用)。
3. **スクリプトを実行する。**
   ```
   npx tsx scripts/generate-thumbnail.ts --prompt "<英語プロンプト>" --out output/<slug>/thumbnail.png
   ```
   サイズを変えたい場合のみ `--width` / `--height` を追加する(デフォルト 1280x670)。
4. **結果を確認する。** コマンドが失敗した場合はエラーメッセージをそのままユーザーに伝える(APIキー未設定、APIエラーなど)。黙ってリトライしたり別モデルにフォールバックしたりしない。
5. **完了したら伝える。** `thumbnail.png` のパスを伝え、note.com の記事編集画面から見出し画像として手動でアップロードしてもらうよう案内する。
