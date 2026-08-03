"""Instagram Graph API(Content Publishing API)への投稿処理。

事前に Instagram プロアカウント + Facebookページ連携 + Meta Developerアプリ + 長期アクセストークン
が必要。セットアップ手順は automation/README.md を参照。
"""

import os
import time

import requests

GRAPH_API_VERSION = "v21.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


class InstagramAPIError(RuntimeError):
    pass


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise InstagramAPIError(f"環境変数 {name} が設定されていません")
    return value


def get_credentials() -> tuple[str, str]:
    ig_user_id = _require_env("IG_USER_ID")
    access_token = _require_env("IG_ACCESS_TOKEN")
    return ig_user_id, access_token


def _post(path: str, params: dict) -> dict:
    resp = requests.post(f"{GRAPH_API_BASE}/{path}", params=params, timeout=30)
    data = resp.json()
    if resp.status_code >= 400:
        raise InstagramAPIError(f"Graph API error on {path}: {data}")
    return data


def create_image_container(ig_user_id: str, access_token: str, image_url: str, caption: str) -> str:
    data = _post(
        f"{ig_user_id}/media",
        {"image_url": image_url, "caption": caption, "access_token": access_token},
    )
    return data["id"]


def create_carousel_item(ig_user_id: str, access_token: str, image_url: str) -> str:
    data = _post(
        f"{ig_user_id}/media",
        {"image_url": image_url, "is_carousel_item": "true", "access_token": access_token},
    )
    return data["id"]


def create_carousel_container(ig_user_id: str, access_token: str, children_ids: list[str], caption: str) -> str:
    data = _post(
        f"{ig_user_id}/media",
        {
            "media_type": "CAROUSEL",
            "caption": caption,
            "children": ",".join(children_ids),
            "access_token": access_token,
        },
    )
    return data["id"]


def wait_until_ready(creation_id: str, access_token: str, timeout_sec: int = 60) -> None:
    """コンテナのステータスが FINISHED になるまで待つ(画像は基本即時だが念のため)。"""
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        resp = requests.get(
            f"{GRAPH_API_BASE}/{creation_id}",
            params={"fields": "status_code", "access_token": access_token},
            timeout=30,
        )
        status = resp.json().get("status_code")
        if status == "FINISHED":
            return
        if status == "ERROR":
            raise InstagramAPIError(f"メディアコンテナの処理に失敗: {creation_id}")
        time.sleep(3)
    raise InstagramAPIError(f"メディアコンテナの処理がタイムアウト: {creation_id}")


def publish_container(ig_user_id: str, access_token: str, creation_id: str) -> str:
    data = _post(
        f"{ig_user_id}/media_publish",
        {"creation_id": creation_id, "access_token": access_token},
    )
    return data["id"]


def post_single_image(image_url: str, caption: str) -> str:
    ig_user_id, access_token = get_credentials()
    creation_id = create_image_container(ig_user_id, access_token, image_url, caption)
    wait_until_ready(creation_id, access_token)
    return publish_container(ig_user_id, access_token, creation_id)


def post_carousel(image_urls: list[str], caption: str) -> str:
    ig_user_id, access_token = get_credentials()
    children_ids = [create_carousel_item(ig_user_id, access_token, url) for url in image_urls]
    for child_id in children_ids:
        wait_until_ready(child_id, access_token)
    creation_id = create_carousel_container(ig_user_id, access_token, children_ids, caption)
    return publish_container(ig_user_id, access_token, creation_id)
