# BAR HOUSE 公式HP

久留米市日吉町「BAR HOUSE」の公式ホームページです。GitHub Pagesで無料公開しています。

## 公開方法（無料 / GitHub Pages）

1. GitHubのこのリポジトリで **Settings → Pages** を開く
2. **Source** を「Deploy from a branch」、ブランチを `main`（このブランチをマージ後）、フォルダを `/(root)` に設定して **Save**
3. 数分後、`https://mnyksm7-dot.github.io/sannkyu/` で公開されます

独自ドメイン（例: barhouse-kurume.com）を使いたい場合は年1,000〜2,000円程度かかりますが、
GitHub Pagesの標準ドメイン（`github.io`）のままなら**完全無料**で運用できます。MEO（Googleマップ検索）は
どちらのドメインでも同様に評価されるので、まずは無料ドメインで始めて問題ありません。

## 公開前にやること

- `assets/` フォルダに実店舗写真5枚を配置（詳細は `assets/README.md` 参照）
- `index.html` 内の住所・電話番号・営業日が最新か確認

## MEO（Googleマップ集客）を無料でやる方法

HPを公開しても、地図検索で見つけてもらうには別途 **Googleビジネスプロフィール** の登録が必要です（無料）。

1. https://www.google.com/business/ からオーナー登録
2. 店舗名「BAR HOUSE」、住所、電話番号、営業時間、カテゴリ「バー」を登録
3. **ウェブサイト**の欄にこのHPのURL（`https://mnyksm7-dot.github.io/sannkyu/`）を設定
4. 店内・外観・メニューの写真を複数枚アップロード（このHPのassets写真も流用可）
5. 口コミが集まるほど検索順位が上がるので、来店客にGoogleマップの口コミ投稿をお願いする

このHP側には既に、Googleがビジネス情報を読み取れる構造化データ（LocalBusiness/BarOrPub）を
埋め込み済みなので、追加の実装は不要です。

## サイトの技術的なSEO対応（実装済み）

- タイトル・ディスクリプションを検索意図（久留米 バー / ひとり飲み）に合わせて調整
- 構造化データ（JSON-LD）で店舗情報・営業時間をGoogleに伝達
- OGP設定でSNSシェア時のカード表示に対応
- 画像の`loading="lazy"`と`width/height`指定で表示速度を改善
- `robots.txt` / `sitemap.xml` を設置しクローラーを誘導
