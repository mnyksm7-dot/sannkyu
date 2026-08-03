# sannkyu(39/サンキュー)

note(note.com)とInstagramを連携させて、ライフスタイル・日常エッセイ系の発信で収益化していくプロジェクトです。
ブランドコンセプトは「日常の中の小さな“ありがとう”を綴るエッセイ」。

## 構成

- `monetization-guide.md` — noteでの収益化の仕組みと、このジャンルでの進め方の指針
- `articles/ideas.md` — 記事ネタ一覧(カテゴリ別)
- `articles/*.md` — 実際に使える下書き記事(そのままnoteに貼り付けて仕上げられる状態)
- `articles/thumbnails/` — note記事用サムネイル画像
- `sns/instagram-profile.md` — Instagramプロフィール(アカウント名・bio・ハイライト構成)の設計
- `sns/instagram-posts.md` — note記事と連動したInstagram投稿(カルーセル構成・キャプション)の下書き
- `sns/note-funnel.md` — InstagramからNoteへ読者を誘導する導線設計
- `sns/images/` — Instagram投稿・プロフィールアイコン用の画像
- `automation/` — Instagram Graph APIを使った自動投稿スクリプト(セットアップ手順は `automation/README.md`)

## 使い方

1. `monetization-guide.md` で全体の方針を確認する
2. `articles/ideas.md` からネタを選ぶ、または下書き記事をそのまま使う
3. 下書きに自分の実体験・固有名詞を足して仕上げ、noteに投稿する(`articles/thumbnails/` の画像をサムネに使用)
4. `sns/instagram-profile.md` の内容でInstagramプロフィールを整える
5. note投稿の翌日に、対応するInstagramの下書き(`sns/instagram-posts.md`)を投稿する
6. `sns/note-funnel.md` の通り、プロフィールリンク・キャプション・ストーリーズでnoteへ送客する
7. 投稿後の反応を見ながら `articles/ideas.md` にネタを追記していく
8. Instagramを完全自動投稿にしたい場合は `automation/README.md` の手順でAPI連携をセットアップする

## 画像生成について(補足)

サムネイル・Instagram画像は生成済みでチャット上に表示されていますが、この実行環境のネットワークポリシー上、
画像ホスト(cloudfront)から直接ファイルをダウンロードしてリポジトリにコミットすることができませんでした。
`articles/thumbnails/` と `sns/images/` はプレースホルダーのディレクトリとして用意してあるので、
チャットに表示された画像を手元に保存し、このフォルダに配置してください。
