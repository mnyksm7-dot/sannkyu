"""Instagram長期アクセストークンをリフレッシュするスクリプト。

長期トークンは60日で失効するが、失効前であれば同じトークンを使って
新しい60日間有効なトークンに更新できる。このスクリプトは新しいトークンの値を
標準出力に表示するだけで、環境変数への反映はできない(環境変数の永続保存は
このスクリプトの実行環境からは変更できないため)。

定期的に(60日より短い間隔で、例えば月1回)実行し、出力された新しいトークンを
IG_ACCESS_TOKEN としてClaude Codeの環境変数設定に手動で反映すること。
"""

import os
import sys

import requests

GRAPH_API_VERSION = "v21.0"


def main() -> int:
    current_token = os.environ.get("IG_ACCESS_TOKEN")
    if not current_token:
        print("環境変数 IG_ACCESS_TOKEN が設定されていません", file=sys.stderr)
        return 1

    resp = requests.get(
        f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": os.environ.get("META_APP_ID", ""),
            "client_secret": os.environ.get("META_APP_SECRET", ""),
            "fb_exchange_token": current_token,
        },
        timeout=30,
    )
    data = resp.json()
    if resp.status_code >= 400:
        print(f"トークン更新に失敗しました: {data}", file=sys.stderr)
        return 1

    new_token = data["access_token"]
    expires_in_days = data.get("expires_in", 0) // 86400
    print("新しいアクセストークンを取得しました。")
    print(f"有効期限: 約{expires_in_days}日後")
    print("以下の値を IG_ACCESS_TOKEN としてClaude Codeの環境変数に設定してください:")
    print(new_token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
