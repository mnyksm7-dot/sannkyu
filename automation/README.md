# Instagram自動投稿(Graph API)

`sns/instagram-posts.md` の内容を、Instagram公式のContent Publishing API(Graph API)を使って
自動投稿するためのスクリプト。**認証情報の取得は必ず自分のMeta/Facebookアカウントで行う必要があり、
この作業だけは代行できない。**以下の手順通りに進めれば1人で完結できる。

## 事前準備(初回のみ)

### 1. Instagramをプロアカウントに切り替える

Instagramアプリ → 設定 → アカウントの種類とツール →「プロアカウントに切り替える」→
「クリエイター」または「ビジネス」を選択。

### 2. Facebookページを作成し、Instagramと連携する

- 個人のFacebookプロフィールとは別に、Facebookページ(なければ新規作成)を用意する
- Instagramのプロアカウント設定内「連携済みアカウント」からそのFacebookページとリンクする

### 3. Meta for Developersでアプリを作成する

1. https://developers.facebook.com/apps/ にアクセスし、Meta Developerアカウントを作成
2. 「アプリを作成」→ タイプは「ビジネス」を選択
3. 作成したアプリに **Instagram Graph API** プロダクトを追加する

### 4. アクセストークンを取得する

1. アプリのダッシュボード内「グラフAPIエクスプローラ」を開く
2. 対象アプリ・対象ユーザーを選択し、以下の権限にチェック:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
3. 「アクセストークンを生成」→ 短期トークンが発行される
4. 短期トークンを長期トークン(60日間有効)に交換する

   ```bash
   curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={アプリID}&client_secret={アプリシークレット}&fb_exchange_token={短期トークン}"
   ```

   → `access_token` が長期トークン。これを `IG_ACCESS_TOKEN` として使う。

   **60日ごとに期限が切れるため、切れる前に同じエンドポイントで再取得(リフレッシュ)する必要がある。**

### 5. Instagram User ID(IG_USER_ID)を取得する

```bash
# 1. 連携しているFacebookページの一覧とIDを取得
curl -i -X GET "https://graph.facebook.com/v21.0/me/accounts?access_token={長期トークン}"

# 2. 上記で得たページIDから、紐づくInstagramビジネスアカウントIDを取得
curl -i -X GET "https://graph.facebook.com/v21.0/{ページID}?fields=instagram_business_account&access_token={長期トークン}"
```

`instagram_business_account.id` が `IG_USER_ID`。

### 6. 画像を公開URLで参照できるようにする

Graph APIは画像を直接アップロードできず、**インターネット上に公開されている画像URL**を渡す必要がある。
このリポジトリでは `sns/images/` に置いた画像を GitHub の raw URL
(`https://raw.githubusercontent.com/mnyksm7-dot/sannkyu/<ブランチ名>/sns/images/xxx.png`)
経由で参照する。画像を追加してpushしたら、`automation/queue.yaml` の `image_url` の
ブランチ名部分を実際のブランチ(mainにマージ後は `main`)に合わせて書き換えること。
リポジトリが非公開の場合、この方法は使えないので画像ホスティングサービスを別途使う。

## 使い方(手動実行)

```bash
cd automation
pip install -r requirements.txt
export IG_USER_ID=xxxxxxxxxx
export IG_ACCESS_TOKEN=xxxxxxxxxx
python run_queue.py
```

`queue.yaml` の中で `posted: false` になっている最初の1件だけを投稿し、
成功したら `posted: true` / `posted_at` / `ig_media_id` を自動で書き込む。

## 自動実行(スケジュール化)

環境変数 `IG_USER_ID` / `IG_ACCESS_TOKEN` をこのリポジトリを動かす実行環境に設定した上で、
Claude側の Routine(定期実行)機能から

```bash
cd automation && AUTO_COMMIT=true python run_queue.py
```

を定期的(例:週2〜3回)に実行するよう設定できる。設定を希望する場合は伝えてほしい。
`AUTO_COMMIT=true` を付けると、投稿成功後に `queue.yaml` の更新を自動でcommit・pushする。

## 制限事項

- Instagram Graph APIのレート制限: 1アカウントあたり24時間で最大25投稿まで
- ストーリーズの自動投稿はContent Publishing APIでは非対応(フィード投稿・リール・カルーセルのみ)
- アクセストークンは60日で失効するため、定期的な更新が必要
- `IG_ACCESS_TOKEN` は絶対にリポジトリにコミットしない(`.gitignore` で `.env` を除外済み)
