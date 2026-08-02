"""無料・APIキー不要のPollinations.ai テキスト生成でキャプションを作る。"""
import urllib.parse

import requests

FALLBACK_HASHTAGS = ["#今日の一枚", "#日常", "#instagood", "#photooftheday", "#日本語"]


def generate_caption(topic: str) -> str:
    prompt = (
        f"「{topic}」というテーマでInstagram投稿用の日本語キャプションを1つ書いてください。"
        "2〜3文程度、絵文字を1〜2個使い、最後に関連する日本語または英語のハッシュタグを5個つけてください。"
        "説明や前置きは不要で、投稿文だけを出力してください。"
    )
    url = "https://text.pollinations.ai/" + urllib.parse.quote(prompt)

    text = None
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        text = resp.text.strip()
    except requests.RequestException:
        text = None

    if not text:
        text = f"今日のテーマは「{topic}」🌿\n小さな一歩を積み重ねていきましょう。"

    if "#" not in text:
        text += "\n\n" + " ".join(FALLBACK_HASHTAGS)

    return text
