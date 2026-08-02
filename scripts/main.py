"""毎日のInstagram投稿コンテンツ(キャプション/画像/動画)を生成するオーケストレーター。"""
import datetime
import os

from generate_caption import generate_caption
from generate_image import generate_image
from generate_video import generate_video

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOPICS_FILE = os.path.join(SCRIPT_DIR, "..", "config", "topics.txt")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "output")


def load_topics() -> list[str]:
    with open(TOPICS_FILE, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip() and not line.startswith("#")]


def pick_topic(topics: list[str]) -> str:
    day_index = datetime.date.today().toordinal()
    return topics[day_index % len(topics)]


def main() -> None:
    topics = load_topics()
    topic = pick_topic(topics)
    print(f"Topic: {topic}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    caption = generate_caption(topic)
    with open(os.path.join(OUTPUT_DIR, "caption.txt"), "w", encoding="utf-8") as f:
        f.write(caption)
    print("Caption generated")

    image_path = generate_image(topic, os.path.join(OUTPUT_DIR, "image.jpg"))
    print(f"Image saved: {image_path}")

    post_type = os.environ.get("POST_TYPE", "reel")
    if post_type == "reel":
        video_path = generate_video(image_path, os.path.join(OUTPUT_DIR, "video.mp4"))
        print(f"Video saved: {video_path}")


if __name__ == "__main__":
    main()
