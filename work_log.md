# work_log — 楽天アフィリエイト自動化 経緯記録

過去の試行錯誤や仕組みの変更をここに時系列で残す。新しい記録は末尾に追記する。

## 2026-08-11 — 初期構築（Claude Code Remoteセッションにて）

- ユーザーから「楽天アフィリエイト自動化の仕組み解説」というドキュメントが共有された。
  内容は、①クラウドRemoteTrigger→②Cloudflare Worker（MCPプロキシ）→③楽天Item Search API
  という3層構成で、クラウドのサンドボックスから楽天APIへ直接アクセスできない
  （ネットワーク制限）問題を、claude.aiのMCPコネクタ経由で迂回する設計。
- このセッションで実際に確認したところ、以下は**まだ何も構築されていなかった**：
  - claude.aiのコネクタ一覧に`rakuten-affiliate-proxy`は未登録
  - RemoteTrigger一覧に該当するルーティンは存在しない
  - `sannkyu`リポジトリに`README.md`/`template.md`/`work_log.md`/`drafts/`は存在しなかった
  - このセッションから`rakuten-affiliate-proxy.murakawa0000.workers.dev`へcurlすると
    `403`でブロックされた（このクラウド実行環境自体も楽天/Cloudflareへの直接アクセスに制限がある）
- そのため、このセッションでは以下を実施した：
  1. `README.md`/`template.md`/`genres.md`/`work_log.md`/`drafts/`の雛形をこのリポジトリに作成
  2. Cloudflare Worker（MCPプロキシ）のコード一式を作成し、ユーザーのPCにデプロイできる形で提供
  3. デプロイ〜claude.aiコネクタ登録までの手順書を提供
  4. 毎日朝6:00 JSTに動くRemoteTriggerを作成（コネクタ登録が完了するまでは実行時にエラーになる点に注意）
- 楽天APIの認証情報（applicationId/accessKey/affiliateId）はこのセッションには一切渡されておらず、
  Cloudflare Worker側にのみ設定される想定（設計を踏襲）。

<!-- 以降、実行のたびに「日付 / 選んだジャンル・商品 / 結果 / 気づいた問題」を追記していく -->

## 2026-09-03 — 下書き自動生成 初回実行

- 実行日: 2026-09-03
- 選んだジャンル・商品: #1 キッチン家電（keyword: "コーヒーメーカー"） / recolte レインドリップコーヒーメーカー RDC-1（インテリアショップ roomy、レビュー2,143件・評価4.59、4,950円）
  - `search_rakuten_items`は正常に動作し、`rakuten-affiliate-proxy`コネクタ経由で本物の`affiliateUrl`込みの検索結果を取得できた（README記載の403問題は解消されている）
  - 検索結果の上位はカプセル・コーヒー豆の商品も多く混在していたため、「コーヒーメーカー本体」であることを確認したうえで実物の家電を選定した
- 生成した下書きファイル名: `drafts/2026-09-03_レコルトレインドリップコーヒーメーカー.md`
- 気づいた問題:
  - `genres.md`のgenreId列は全行未設定のまま。検索精度を上げたい場合は今後埋めるとよい
  - keywordだけで検索すると本体以外（消耗品・豆）が多くヒットするため、次回以降も「本体らしい商品名か」を目視確認するステップが必要
