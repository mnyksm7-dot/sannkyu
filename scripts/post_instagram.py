"""Instagram Graph APIを使って画像/動画(Reels)を投稿する。"""
import os
import time

import requests

GRAPH_API_VERSION = "v20.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def create_media_container(ig_user_id: str, access_token: str, media_url: str, caption: str, media_type: str) -> str:
    params = {
        "access_token": access_token,
        "caption": caption,
    }
    if media_type == "REELS":
        params["media_type"] = "REELS"
        params["video_url"] = media_url
    else:
        params["image_url"] = media_url

    resp = requests.post(f"{GRAPH_API_BASE}/{ig_user_id}/media", data=params, timeout=60)
    resp.raise_for_status()
    return resp.json()["id"]


def wait_until_ready(container_id: str, access_token: str, timeout: int = 300, interval: int = 10) -> None:
    elapsed = 0
    while elapsed < timeout:
        resp = requests.get(
            f"{GRAPH_API_BASE}/{container_id}",
            params={"fields": "status_code", "access_token": access_token},
            timeout=30,
        )
        resp.raise_for_status()
        status = resp.json().get("status_code")
        if status == "FINISHED":
            return
        if status == "ERROR":
            raise RuntimeError("Instagram側でのメディア処理に失敗しました")
        time.sleep(interval)
        elapsed += interval
    raise TimeoutError("Instagramのメディア処理待ちがタイムアウトしました")


def publish_media(ig_user_id: str, access_token: str, container_id: str) -> dict:
    resp = requests.post(
        f"{GRAPH_API_BASE}/{ig_user_id}/media_publish",
        data={"creation_id": container_id, "access_token": access_token},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    ig_user_id = os.environ["IG_USER_ID"]
    access_token = os.environ["IG_ACCESS_TOKEN"]
    media_url = os.environ["MEDIA_URL"]
    caption = os.environ.get("CAPTION", "")
    media_type = os.environ.get("MEDIA_TYPE", "REELS")

    container_id = create_media_container(ig_user_id, access_token, media_url, caption, media_type)
    print(f"Container created: {container_id}")

    wait_until_ready(container_id, access_token)

    result = publish_media(ig_user_id, access_token, container_id)
    print(f"Published: {result}")


if __name__ == "__main__":
    main()
