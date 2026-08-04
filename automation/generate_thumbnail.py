"""外部APIを使わず、ローカルだけでサムネイル画像を生成するスクリプト。

Pillow + システム内蔵の日本語フォント(IPAゴシック)のみを使うため、
画像生成の費用は一切かからない(完全無料)。ネットワーク接続も不要。

使い方:
    python generate_thumbnail.py --title "記事タイトル" --output out.png --format note
    python generate_thumbnail.py --title "記事タイトル" --output out.png --format instagram
"""

import argparse
import hashlib
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"

# ブランドパレット(warm beige / dusty blue / soft terracotta / cream)
PALETTE = [
    ("#F3E9DD", "#D98E73"),  # ベージュ→テラコッタ
    ("#E8EEF1", "#A9BFC9"),  # クリーム→ダスティブルー
    ("#F6EFE7", "#C9A98C"),  # クリーム→ブラウンベージュ
    ("#EFE6E9", "#C98E9A"),  # ペール→ダスティローズ
]
TEXT_COLOR = "#4A4038"
ACCENT_ALPHA = 60

SIZES = {
    "note": (1280, 670),
    "instagram": (1080, 1080),
    "profile": (600, 600),
}


def pick_palette(seed: str) -> tuple[str, str]:
    idx = int(hashlib.sha1(seed.encode("utf-8")).hexdigest(), 16) % len(PALETTE)
    return PALETTE[idx]


def draw_gradient(size: tuple[int, int], color_a: str, color_b: str) -> Image.Image:
    w, h = size
    base = Image.new("RGB", size, color_a)
    top = Image.new("RGB", size, color_b)
    mask = Image.new("L", size)
    mask_data = [int(255 * (x + y) / (w + h)) for y in range(h) for x in range(w)]
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base


def draw_accent_circle(img: Image.Image, color: str) -> None:
    w, h = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    r = int(w * 0.35)
    cx, cy = int(w * 0.92), int(h * 0.08)
    rgba = tuple(int(color.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4)) + (ACCENT_ALPHA,)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=rgba)
    img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"), (0, 0))


def wrap_title(title: str, max_chars_per_line: int) -> list[str]:
    return textwrap.wrap(title, width=max_chars_per_line, break_long_words=True) or [title]


def draw_title(img: Image.Image, title: str) -> None:
    w, h = img.size
    draw = ImageDraw.Draw(img)

    font_size = int(h * 0.11)
    max_chars = max(6, int(w / (font_size * 0.95)))
    lines = wrap_title(title, max_chars)
    while len(lines) > 3 and font_size > 24:
        font_size -= 4
        max_chars = max(6, int(w / (font_size * 0.95)))
        lines = wrap_title(title, max_chars)

    font = ImageFont.truetype(FONT_PATH, font_size)
    line_height = int(font_size * 1.35)
    total_height = line_height * len(lines)
    y = (h - total_height) // 2

    padding_x = int(w * 0.08)
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        x = max(padding_x, (w - text_w) // 2)
        # 疑似ボールド(1px右にずらして重ね書き)
        draw.text((x + 1, y), line, font=font, fill=TEXT_COLOR)
        draw.text((x, y), line, font=font, fill=TEXT_COLOR)
        y += line_height


def draw_brand_mark(img: Image.Image) -> None:
    w, h = img.size
    draw = ImageDraw.Draw(img)
    font_size = int(h * 0.035)
    font = ImageFont.truetype(FONT_PATH, font_size)
    label = "39 | サンキュー"
    margin = int(h * 0.05)
    draw.text((margin, h - margin - font_size), label, font=font, fill=TEXT_COLOR)


def draw_profile_icon(output: Path) -> None:
    size = SIZES["profile"]
    w, h = size
    color_a, color_b = PALETTE[0]
    img = draw_gradient(size, color_a, color_b)
    draw = ImageDraw.Draw(img)

    r = int(w * 0.3)
    cx, cy = w // 2, int(h * 0.42)
    draw.ellipse(
        [cx - r, cy - r, cx + r, cy + r],
        outline=TEXT_COLOR,
        width=max(4, int(w * 0.015)),
    )

    font = ImageFont.truetype(FONT_PATH, int(h * 0.22))
    label = "39"
    bbox = draw.textbbox((0, 0), label, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - text_w / 2, cy - text_h / 2 - bbox[1]), label, font=font, fill=TEXT_COLOR)

    small_font = ImageFont.truetype(FONT_PATH, int(h * 0.075))
    sub = "サンキュー"
    bbox2 = draw.textbbox((0, 0), sub, font=small_font)
    sub_w = bbox2[2] - bbox2[0]
    draw.text((w / 2 - sub_w / 2, cy + r + int(h * 0.06)), sub, font=small_font, fill=TEXT_COLOR)

    output.parent.mkdir(parents=True, exist_ok=True)
    img.save(output, "PNG")


def generate(title: str, output: Path, fmt: str) -> None:
    size = SIZES[fmt]
    color_a, color_b = pick_palette(title)
    img = draw_gradient(size, color_a, color_b)
    draw_accent_circle(img, color_b)
    draw_title(img, title)
    draw_brand_mark(img)
    output.parent.mkdir(parents=True, exist_ok=True)
    img.save(output, "PNG")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--title", required=False, default="", help="記事タイトル(--format profile では不要)")
    parser.add_argument("--output", required=True, type=Path, help="出力ファイルパス")
    parser.add_argument("--format", choices=SIZES.keys(), default="note")
    args = parser.parse_args()
    if args.format == "profile":
        draw_profile_icon(args.output)
    else:
        if not args.title:
            raise SystemExit("--title は --format note/instagram では必須です")
        generate(args.title, args.output, args.format)
    print(f"生成しました: {args.output}")


if __name__ == "__main__":
    main()
