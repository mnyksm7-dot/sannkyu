# sannkyu — 楽天アフィリエイト記事下書き自動生成

毎日クラウド上のRemoteTrigger（ルーティン）が動き、楽天市場の商品データと
本物のアフィリエイトトラッキングリンク（`affiliateUrl`）を取得して、
note.com投稿用の記事下書きを`drafts/`に自動生成しGitHubへpushする仕組み。

仕組みの全体像・なぜこの構成になっているかは `work_log.md` を参照。

## ディレクトリ構成

- `README.md` — この文書
- `template.md` — 記事下書きのテンプレート（見出し構成・書き方のルール）
- `work_log.md` — 経緯・仕組みの記録（試行錯誤の履歴を含む）
- `genres.md` — 商品ジャンルローテーション表（次にどのジャンルを扱うか）
- `drafts/` — 自動生成された記事下書き（`YYYY-MM-DD_商品名.md`）

## 自動化の全体像

```
① RemoteTrigger（毎日朝6:00頃 JST）
        │ MCPツール「search_rakuten_items」を呼ぶ
        ▼
② Cloudflare Worker（rakuten-affiliate-proxy、MCPサーバー）
        │ Referer/Originヘッダーを付けて楽天APIへ中継
        ▼
③ 楽天 Item Search API
        │ affiliateUrl込みの商品データを返す
        ▼
        ①に戻り、drafts/にmd下書きを書いてGitHubへpush
```

- ①のRemoteTriggerは note.com へのログイン・投稿は行わない（下書き作成まで）。
  実際の貼り付け・公開は人間が行う。
- ②のWorkerコード・楽天API認証情報（applicationId/accessKey/affiliateId）は
  このリポジトリには含めない（別リポジトリ／ローカルのみで管理）。

## 運用フロー（公開は「Claude in Chrome」での一言指示）

note.comには公式の投稿APIがなく、ログイン情報をサーバー側に保存して無人で
自動投稿する構成は「アカウント乗っ取りリスク」「利用規約に抵触する可能性」
「人のチェックなしで誤った内容が公開されるリスク」があるため採用していない。
代わりに、あなた自身がnote.comにログイン済みのブラウザ上で
「Claude in Chrome」拡張機能にひと言頼む形にする。

1. `drafts/`に新しい下書きが増えたら（毎朝自動で増える）
2. note.comに**普段通り自分でログイン**しておく
3. claude.aiの通常チャット（Claude in Chrome有効）で

   > 今日のdraftsの記事をnote.comに貼り付けて公開して

   と頼むと、あなたのログイン済みセッションのままClaudeが貼り付け〜公開まで代行する

### 準備（初回のみ）

- Chrome拡張機能「Claude for Chrome」をインストール
- claude.aiの「設定 → Claude in Chrome」で有効化
