"""queue.yaml から未投稿の1件を選んでInstagramに自動投稿するスクリプト。

使い方:
    pip install -r automation/requirements.txt
    export IG_USER_ID=...
    export IG_ACCESS_TOKEN=...
    python automation/run_queue.py

環境変数 AUTO_COMMIT=true を設定すると、投稿成功後に queue.yaml の更新を
自動で git commit / push する(スケジュール実行向け)。
"""

import datetime
import os
import subprocess
import sys
from pathlib import Path

import yaml

from instagram_api import InstagramAPIError, post_carousel, post_single_image

QUEUE_PATH = Path(__file__).parent / "queue.yaml"


def load_queue() -> dict:
    with open(QUEUE_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_queue(data: dict) -> None:
    with open(QUEUE_PATH, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False, width=1000)


def maybe_commit(post_id: str) -> None:
    if os.environ.get("AUTO_COMMIT") != "true":
        return
    repo_root = Path(__file__).parent.parent
    subprocess.run(["git", "add", "automation/queue.yaml"], cwd=repo_root, check=True)
    subprocess.run(
        ["git", "commit", "-m", f"Instagram自動投稿: {post_id}"],
        cwd=repo_root,
        check=True,
    )
    subprocess.run(["git", "push"], cwd=repo_root, check=True)


def main() -> int:
    data = load_queue()
    posts = data.get("posts", [])

    pending = next((p for p in posts if not p.get("posted")), None)
    if pending is None:
        print("投稿待ちのキューはありません。")
        return 0

    caption = pending["caption"]
    try:
        if pending["type"] == "carousel":
            media_id = post_carousel(pending["image_urls"], caption)
        else:
            media_id = post_single_image(pending["image_url"], caption)
    except InstagramAPIError as e:
        print(f"投稿に失敗しました ({pending['id']}): {e}", file=sys.stderr)
        return 1

    pending["posted"] = True
    pending["posted_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    pending["ig_media_id"] = media_id
    save_queue(data)
    maybe_commit(pending["id"])

    print(f"投稿完了: {pending['id']} -> media_id={media_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
