# CLAUDE.md

このリポジトリは、note.com で販売する「体験談形式の有料記事」を作成・管理するためのプロジェクトです。

## プロジェクトの目的

- note.com で販売する有料記事を執筆する
- ジャンルは市場トレンド調査に基づいて選定（AI活用、副業、転職、婚活・恋愛、子育て、お金の悩み、SNS運用など）
- 記事は**創作・フィクション**（実話ではない）。ただし「いかにも本人が書いた体験談」に見えるリアリティを重視する
- トーンは**共感重視・エモーショナル**。専門知識の説明ではなく、感情の起伏（不安→挫折→気づき→変化）を軸にする

## 記事の書き方の方針

- 1人称（「私」）視点、です・ます調
- 1記事 2000〜3000字（本文のみ、タイトル・見出し除く）
- 構成は「Before → 迷走・挫折 → 気づき → After（具体的な変化）」の型に固定する
- タイトルは以下の型に沿って強化する（note公式の分析で「専門知識より、その人ならではの実体験」が売れるとされているため）
  - Before→After構造（「〜だった私が、〜になるまで」）
  - 具体的な数字を入れる（年齢・金額・回数・期間）
  - ターゲットを絞り込む（「シングルマザー」「32歳未経験」など）
- 実在の人物・団体を特定できる情報は書かない。エピソードは創作である旨を、必要であれば奥付や自己紹介欄で示す

## 無料/有料の境目

各記事には `<!-- PAID_CUT -->` というHTMLコメントを、有料エリアが始まる直前の見出しの上に入れる。
`scripts/generate_preview.py` はこのコメントを検出し、そこにプレビューダッシュボード上で「🔒 ここから先は有料エリア」のバナーを自動挿入する。note本番投稿時も、同じ位置に note の「有料エリア設定」を入れる。

## 記事一覧・価格

| # | ファイル | テーマ | 想定価格 |
|---|---|---|---|
| 01 | articles/01-konkatsu-3nen.md | 婚活3年の迷走と結婚 | ¥480 |
| 02 | articles/02-matching-app-20nin.md | マッチングアプリで20人に会った記録 | ¥400 |
| 03 | articles/03-tedori18man-fukugyou.md | 手取り18万円から副業月10万円 | ¥680 |
| 04 | articles/04-mikeiken-engineer-tenshoku.md | 32歳未経験からのエンジニア転職 | ¥780 |
| 05 | articles/05-kosodate-zaitaku-work.md | 子育てと在宅ワークの両立 | ¥400 |
| 06 | articles/06-kyouikuhi-3bai.md | 教育費が想定の3倍だった家計 | ¥500 |
| 07 | articles/07-chatgpt-buki.md | ChatGPTに仕事を奪われかけて武器にした話 | ¥600 |
| 08 | articles/08-toushi-200man-sonshitsu.md | 投資で200万円失った経験 | ¥580 |
| 09 | articles/09-sns-hasshin-jigoku.md | SNS発信で人生が変わって地獄も見た話 | ¥450 |
| 10 | articles/10-note-10hon-ureru-bunshou.md | note有料記事10本で学んだ「売れる文章」 | ¥980 |

## ディレクトリ構成

```
sannkyu/
├── CLAUDE.md
├── articles/*.md          記事本文（Markdown、frontmatter に価格・タグ）
├── templates/thumbnail.html   サムネイルのデザインテンプレート（HTML/CSS）
├── scripts/
│   ├── generate-thumbnails.mjs  サムネイル生成（Playwright + Chromium、1280x670px）
│   └── generate_preview.py      投稿用プレビュー/ダッシュボード生成
├── thumbnails/*.png       生成されたサムネイル画像
└── preview.html           生成された投稿補助ダッシュボード（git管理外でも可）
```

## ワークフロー

### 1. 記事を書く・直す

`articles/*.md` を直接編集する。frontmatter（先頭の `---` で囲まれた部分）に `title` / `price` / `tags` を持たせる。本文中の有料エリア開始位置に `<!-- PAID_CUT -->` を入れる。

### 2. サムネイルを生成する

このサンドボックス環境には Playwright 経由の Chromium (`/opt/pw-browsers/chromium`) が入っているため、これを使う。

```bash
node scripts/generate-thumbnails.mjs
```

`templates/thumbnail.html` のプレースホルダー（`__TAG__` `__LINE1__` `__LINE2__` `__COLOR1__` `__COLOR2__`）にジャンルごとの色とタイトル文字を差し込んでスクリーンショットを撮り、`thumbnails/*.png`（1280×670px、note推奨サイズ）に保存する。

note推奨の見出し画像サイズは 1280×670px（比率 1:1.91）。

### 3. 投稿補助ダッシュボードを生成・確認する

```bash
python3 scripts/generate_preview.py
```

`preview.html` が生成される。各記事ごとに以下がまとまったカードが並ぶ:

- サムネイル画像
- タイトルをコピーするボタン
- 本文をコピーするボタン（`<!-- PAID_CUT -->` の位置に「▼▼▼ ここから有料エリア ▼▼▼」の目印を自動挿入）
- note.com の新規投稿画面を開くリンク
- 投稿済みチェック（ブラウザの localStorage に保存され、進捗が残る）

note.com には外部からの自動投稿API（公式）が存在しないため、投稿自体はコピペ＋手動アップロードになる。このダッシュボードは「コピペの手間を最小化する」ためのものであり、完全自動化ではない。

### 4. （任意）ChatGPT (gpt-image-1) と連携したサムネイル背景生成

`OPENAI_API_KEY` を環境変数に設定した上で実行する（API利用料が発生するため、実行前に必ずユーザーに確認する）:

```bash
export OPENAI_API_KEY=sk-...
python3 scripts/generate_ai_backgrounds.py   # 記事ごとにイラスト背景を生成し thumbnails/ai_backgrounds/ に保存
node scripts/generate-thumbnails.mjs --ai    # 背景画像 + 日本語タイトル文字を合成して thumbnails/ に上書き
```

タイトル文字はAIに描画させず、常に `templates/thumbnail.html` のHTML/CSSで描画する（文字化け・誤字防止のため）。

## 注意事項

- このプロジェクトの記事は創作（フィクション）である。実在の人物・団体と誤認されるような固有情報は含めない
- 断定的な医療・法律・投資助言に読める表現は避け、あくまで個人の体験談として書く
- 金額や統計を語る箇所は「筆者の体験」の範囲に留め、断定的な一般論として書かない
