"""無料・APIキー不要のPollinations.ai 画像生成でReels用の縦画像を作る。"""
import os
import urllib.parse

import requests

IMAGE_WIDTH = 1080
IMAGE_HEIGHT = 1920


def generate_image(topic: str, out_path: str) -> str:
    prompt = f"{topic}, aesthetic instagram post, high quality photo, vertical composition"
    url = (
        "https://image.pollinations.ai/prompt/"
        + urllib.parse.quote(prompt)
        + f"?width={IMAGE_WIDTH}&height={IMAGE_HEIGHT}&nologo=true"
    )

    resp = requests.get(url, timeout=60)
    resp.raise_for_status()

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(resp.content)

    return out_path
