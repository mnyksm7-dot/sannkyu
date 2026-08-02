# sannkyu — Instagram 自動投稿スケジューラー

キャプション生成 → 画像生成 → 動画(Reels)合成 → Instagramへの自動投稿 を、
**GitHub Actions の無料cron**で毎日決まった時刻に実行する仕組みです。

## 使っている無料サービス・技術

| 用途 | 使用技術 | 料金 |
|---|---|---|
| キャプション生成 | [Pollinations.ai](https://pollinations.ai) テキストAPI（APIキー不要） | 無料 |
| 画像生成 | Pollinations.ai 画像API（APIキー不要） | 無料 |
| 動画合成 | ffmpeg（Ken Burns風のズーム動画を1枚の画像から生成） | 無料 |
| 定時実行 | GitHub Actions の `schedule` cron | 無料（Public リポジトリなら無制限） |
| Instagramへの投稿 | Meta Instagram Graph API | 無料 |
| 動画/画像の公開URLホスティング | GitHub Releases のアセット | 無料 |

## 事前に必要なもの

1. Instagramアカウントを **ビジネス/クリエイターアカウント** にし、Facebookページと連携（すでに完了している前提）
2. Instagram Graph API 用の **長期アクセストークン** と **Instagramビジネスアカウント(IG User) ID**
3. このリポジトリが **Public** であること
   - Instagram側のサーバーが動画/画像を取得できる公開URLが必要なため、動画・画像は GitHub Releases のアセットとして公開URL化しています。Privateリポジトリだとこの方式では取得できません。

## セットアップ手順

1. リポジトリの **Settings → Secrets and variables → Actions** に以下のSecretsを登録
   - `IG_USER_ID` : InstagramビジネスアカウントのユーザーID
   - `IG_ACCESS_TOKEN` : 長期アクセストークン
2. `config/topics.txt` を自分の発信したい内容のテーマ一覧に書き換える（1行1テーマ）
3. 投稿時刻を変えたい場合は `.github/workflows/daily-post.yml` の `cron` を編集
   - 例: `0 12 * * *` は UTC 12:00 = 日本時間 21:00
4. まずは **Actions タブ → Daily Instagram Auto Post → Run workflow** で手動実行し、正常に投稿できるか確認
5. 問題なければ、以後は毎日同じ時刻に自動実行されます

## 動作の流れ

1. `scripts/main.py` が `config/topics.txt` から日替わりでテーマを選択
2. `generate_caption.py` がテーマからキャプション+ハッシュタグを生成（失敗時はテンプレ文にフォールバック）
3. `generate_image.py` がテーマから縦長(1080x1920)画像を生成
4. `generate_video.py` が ffmpeg でその画像からズームアニメーション動画を作成（Reels投稿時）
5. ワークフロー内で動画/画像を GitHub Release アセットとして公開URL化
6. `post_instagram.py` が Instagram Graph API でメディアコンテナ作成 → 処理完了待ち → 公開

`workflow_dispatch` 実行時、または手動編集で `POST_TYPE=photo` にすると、動画の代わりに画像のみ(フィード投稿)にできます。

## 既知の制限（正直な注意点）

- **無料枠であるため品質・安定性は有償サービスに劣ります。** Pollinations.aiはAPIキー不要な代わりに、応答が遅い/失敗することがあります（キャプションは失敗時に自動フォールバックします）。
- **本格的なAI動画生成（Runway/Pika等）は使っていません。** 1枚の生成画像にズーム効果をつけたスライドショー動画です。
- **アクセストークンには有効期限があります**（長期トークンで概ね60日）。切れると投稿が失敗するため、定期的に再発行してSecretsを更新してください。
- GitHub Releaseに投稿のたびに動画/画像アセットが増えていきます。容量が気になる場合は定期的に古いリリースを削除してください。
